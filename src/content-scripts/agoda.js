/*******************************************
 * chrome-extension/src/content-scripts/agoda.js
 *
 * 아고다 CSV 스크래핑 (확장 방식, using date-fns)
 * - POST로 CSV 받아오기
 * - 따옴표 인식 CSV 파서로 각 열 추출
 * - RoomType/Special_Request는 그대로 사용
 * - 가격은 ReferenceSellInclusive → 0이면 Total_inclusive_rate
 *******************************************/
import { add } from 'date-fns';
import { parseDate } from '../utils/dateParser.js'; // date-fns 기반 parseDate
import { sendReservations } from '../utils/sendReservations.js';

/************************************************
 * (A) CSV 다운로드용 Request Body 구성
 ************************************************/
function buildRequestBody(agodaId) {
  // 원하는 투숙 기간(예: 오늘부터 +30일)
  const fromDate = new Date();
  const toDate = add(fromDate, { days: 30 });
  const fromMs = fromDate.getTime();
  const toMs = toDate.getTime();

  return {
    ackRequestTypes: ['All'],
    bookingDatePeriod: {}, // 예약일(BookingDate)로는 필터X
    stayDatePeriod: {
      from: `/Date(${fromMs})/`,
      to: `/Date(${toMs})/`,
    },
    lastUpdateDatePeriod: {},
    customerName: '',
    hotelId: Number(agodaId),
  };
}

/************************************************
 * (B) Agoda CSV 요청 (POST → Blob → text)
 ************************************************/
async function fetchAgodaCSV(agodaId) {
  const url = `https://ycs.agoda.com/mldc/ko-kr/api/reporting/Booking/csv/${agodaId}`;
  const bodyObj = buildRequestBody(agodaId);

  const resp = await fetch(url, {
    method: 'POST',
    credentials: 'include', // 세션 쿠키 포함
    headers: {
      'content-type': 'application/json-patch+json',
    },
    body: JSON.stringify(bodyObj),
  });
  if (!resp.ok) {
    throw new Error(`[AgodaCSV] CSV request failed. status=${resp.status}`);
  }

  // 응답은 CSV Blob
  const blob = await resp.blob();
  // Blob → 텍스트 (CSV 문자열)
  const csvText = await blob.text();
  return csvText;
}

/************************************************
 * (C) 단일 CSV 라인 -> 배열
 *   따옴표("") 안 콤마는 무시, 밖 콤마로 split
 ************************************************/
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // 따옴표 상태 토글
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      // 따옴표 밖의 콤마면 열 분리
      result.push(current);
      current = '';
    } else {
      // 그 외 문자 누적
      current += ch;
    }
  }
  // 마지막 누적
  result.push(current);

  // 각 열 trim + 양끝 따옴표 제거
  return result.map((col) => col.trim().replace(/^"|"$/g, ''));
}

/************************************************
 * (D) CSV 파싱 → reservations 배열
 ************************************************/
function parseCSVToReservations(csvText) {
  // BOM 제거
  const text = csvText.replace(/^\uFEFF/, '');

  // 줄 단위 분리
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    console.warn('[AgodaCSV] No data lines in CSV');
    return [];
  }

  // 첫 줄(헤더)
  const headerCols = parseCSVLine(lines[0]);
  console.log('[AgodaCSV] header =>', headerCols);

  // 필요한 열 이름
  const idxBookingID = headerCols.indexOf('BookingIDExternal_reference_ID');
  const idxStatus = headerCols.indexOf('Status');
  const idxCheckIn = headerCols.indexOf('StayDateFrom');
  const idxCheckOut = headerCols.indexOf('StayDateTo');
  const idxBookedDate = headerCols.indexOf('BookedDate');
  const idxCustomer = headerCols.indexOf('Customer_Name');
  const idxRoomType = headerCols.indexOf('RoomType');
  const idxSpecReq = headerCols.indexOf('Special_Request');
  const idxPayment = headerCols.indexOf('PaymentModel');
  const idxRefSell = headerCols.indexOf('ReferenceSellInclusive');
  const idxTotalInc = headerCols.indexOf('Total_inclusive_rate');
  // (fallback 용)

  // 필수 열 누락 체크
  if (
    idxBookingID < 0 ||
    idxStatus < 0 ||
    idxCheckIn < 0 ||
    idxCheckOut < 0 ||
    idxBookedDate < 0 ||
    idxCustomer < 0 ||
    idxRoomType < 0 ||
    idxSpecReq < 0 ||
    idxPayment < 0 ||
    idxRefSell < 0
  ) {
    console.warn(
      '[AgodaCSV] Some required columns are missing -> check header'
    );
    return [];
  }

  // 데이터 라인들
  const dataLines = lines.slice(1);

  // 각 라인 -> reservation
  const reservations = dataLines.map((line) => {
    const cols = parseCSVLine(line);
    // 열 개수가 부족하면 skip
    if (cols.length < headerCols.length) {
      return null;
    }

    // 추출
    const reservationNo = cols[idxBookingID] || '';
    let reservationStatus = cols[idxStatus] || '';
    if (reservationStatus.includes('취소')) {
      reservationStatus = 'Canceled';
    } else if (reservationStatus.includes('확정')) {
      reservationStatus = 'Confirmed';
    } else if (reservationStatus.includes('변경')) {
      reservationStatus = 'Modified';
    }

    const checkInRaw = cols[idxCheckIn] || '';
    const checkOutRaw = cols[idxCheckOut] || '';
    const bookedDate = cols[idxBookedDate] || '';
    const customerName = cols[idxCustomer] || '';
    const roomInfo = cols[idxRoomType] || '';
    const specialRequests = cols[idxSpecReq] || '';
    const paymentMethod = cols[idxPayment] || '';

    // 가격: ReferenceSellInclusive + fallback(Total_inclusive_rate)
    let rawRef = cols[idxRefSell] || '0';
    let priceRef = parseInt(rawRef.replace(/[^\d-]/g, ''), 10) || 0;

    let fallback = 0;
    if (idxTotalInc >= 0) {
      const rawTot = cols[idxTotalInc] || '0';
      fallback = parseInt(rawTot.replace(/[^\d-]/g, ''), 10) || 0;
    }
    const finalPrice = priceRef !== 0 ? priceRef : fallback;

    // 날짜 파싱
    const inDate = parseDate(checkInRaw);
    let outDate = parseDate(checkOutRaw);
    if (inDate && !outDate) {
      // 체크아웃이 비어 있으면 +1일
      outDate = new Date(inDate.getTime());
      outDate.setDate(outDate.getDate() + 1);
    }
    if (!inDate || isNaN(inDate) || !outDate || isNaN(outDate)) {
      console.warn('[AgodaCSV] invalid date => skip line:', line);
      return null;
    }

    return {
      reservationNo,
      reservationStatus,
      customerName,
      checkIn: inDate,
      checkOut: outDate,
      roomInfo,
      paymentMethod,
      reservationDate: bookedDate,
      specialRequests,
      price: finalPrice,
    };
  });

  // null 제거
  return reservations.filter((r) => r);
}

/************************************************
 * (E) 최종 스크래핑 함수
 ************************************************/
export async function scrapeAgoda(hotelId, siteName) {
  console.log(
    `[AgodaCSV] scrapeAgoda() start. hotelId=${hotelId}, siteName=${siteName}`
  );

  if (window.location.pathname.includes('/login')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: Agoda');
  }

  // 도메인 체크
  if (!window.location.href.includes('ycs.agoda.com')) {
    console.warn('[AgodaCSV] Not on ycs.agoda.com domain -> skip');
    return;
  }

  // agodaId 추출 (booking/숫자 or dashboard/숫자)
  const dashRegex = /(booking|dashboard)\/(\d+)/;
  const match = window.location.href.match(dashRegex);
  if (!match || !match[2]) {
    console.error('[AgodaCSV] agodaId not found in URL -> stop');
    return;
  }
  const agodaId = match[2];
  console.log(`[AgodaCSV] found agodaId=${agodaId}`);

  // 1) CSV 다운로드
  let csvText = '';
  try {
    csvText = await fetchAgodaCSV(agodaId);
    console.log('[AgodaCSV] CSV length=', csvText.length);
  } catch (err) {
    console.error('[AgodaCSV] fetch CSV error:', err);
    return;
  }

  // 2) CSV 파싱
  const reservations = parseCSVToReservations(csvText);
  if (!reservations.length) {
    console.warn('[AgodaCSV] no valid reservations => stop');
    return;
  }
  console.log('[AgodaCSV] final reservations =>', reservations);

  // 3) 서버 전송
  try {
    await sendReservations(hotelId, siteName, reservations);
    console.log(
      `[AgodaCSV] success => sent ${reservations.length} reservations to server.`
    );
  } catch (err) {
    console.error('[AgodaCSV] sendReservations error:', err);
  }
}

/************************************************
 * (F) 메시지 리스너 (SCRAPE_AGODA)
 ************************************************/
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'SCRAPE_AGODA') {
    console.log('[AgodaCSV] onMessage =>', msg);
    const { hotelId, siteName } = msg;

    // roomTypes는 더이상 사용 안 하지만, 일단 무시
    scrapeAgoda(hotelId, siteName)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('[AgodaCSV] scraping error:', error);
        sendResponse({ success: false, message: error.message });
      });

    return true; // 비동기 응답
  }
  return false;
});


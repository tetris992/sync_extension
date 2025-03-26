/****************************************
 * goodMotel.js - GoodMotel (여기어때 모텔) 스크래핑 전체 코드
 ****************************************/

// 1) Day.js 관련 플러그인 사용 (Moment 대신 Day.js)
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// 플러그인 등록
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

// [0] 스크립트 로드 로그
console.log('[goodMotel.js] loaded!');

/**
 * [1] URL 생성 함수
 * startDate, endDate 포맷: 'YYYY-MM-DD'
 */
function buildUpdatedURL(startDate, endDate) {
  return `https://ad.goodchoice.kr/reservation/history/total?start_date=${startDate}&end_date=${endDate}&keyword=&keywordType=ORDER_NUMBER&armgno=&sort=checkin&page=1&checked_in=&status=6`;
}

/**
 * [2] URL 이동 함수
 * 현재 URL이 생성된 URL과 같으면 이동하지 않고 false 반환, 아니면 이동 후 true 반환
 */
function navigateToUpdatedURL(startDate, endDate) {
  const updatedURL = buildUpdatedURL(startDate, endDate);
  if (window.location.href === updatedURL) {
    console.log('[goodMotel] Already on updatedURL, skip navigation');
    return false;
  }
  console.log('[goodMotel] Navigating to updatedURL:', updatedURL);
  window.location.href = updatedURL;
  return true;
}

/**
 * [3] 예약 목록 파싱 함수
 * 페이지 내 테이블이 로드될 때까지 최대 20회 (2초 간격) 대기 후 파싱 진행
 */
async function parseGoodMotelReservations(hotelId, siteName, startDate, endDate) {
  try {
    // 3.1 테이블 로드 대기 (최대 40초)
    let tableLoaded = false;
    for (let i = 0; i < 20; i++) {
      const firstRow = document.querySelector(
        '#app > div.contents-wrapper.container > div.row > div > div > div.contents-component > div.common-component--table.is-type01 > table > tbody > tr'
      );
      if (firstRow) {
        tableLoaded = true;
        break;
      }
      console.log('[goodMotel] waiting for table to appear...');
      // 2초 대기
      await new Promise((res) => setTimeout(res, 2000));
    }
    if (!tableLoaded) {
      console.error('[goodMotel] Table not found within 40s → abort parse.');
      return;
    }
    console.log('[goodMotel] Table detected. Start parsing...');

    // 3.2 모든 행을 선택하여 예약 데이터를 파싱
    const rows = document.querySelectorAll(
      '#app > div.contents-wrapper.container > div.row > div > div > div.contents-component > div.common-component--table.is-type01 > table > tbody > tr'
    );
    const reservations = Array.from(rows).map((row) => {
      // 예약 상태 및 예약번호 (동일 요소에서 파싱)
      const reservationStatusEl = row.querySelector('td:nth-child(2) > p');
      const reservationStatus = reservationStatusEl ? reservationStatusEl.innerText.trim() : '';
      const reservationNo = reservationStatus; // 필요에 따라 별도 파싱 가능

      // detail-info 영역 파싱: 예약자 정보, 객실 타입, 날짜 정보 등
      const detailInfoTd = row.querySelector('td.is-left.detail-info');
      const detailText = detailInfoTd ? detailInfoTd.innerText.trim() : '';
      let customerName = '';
      let phoneNumber = '';
      let checkIn = '';
      let checkOut = '';
      let roomInfo = '';

      if (detailText) {
        const lines = detailText.split('\n').map((l) => l.trim());
        // 첫 줄: "고객이름 | 전화번호"
        if (lines.length >= 1 && lines[0].includes('|')) {
          const [namePart, phonePart] = lines[0].split('|').map((p) => p.trim());
          customerName = namePart;
          phoneNumber = phonePart;
        }
        // 두 번째 줄: 객실 타입 정보
        if (lines.length >= 2) {
          roomInfo = lines[1];
        }
        // 날짜 정보: "YYYY-MM-DD HH:mm ~ YYYY-MM-DD HH:mm"
        const dateRegex = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) ~ (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/;
        const matched = detailText.match(dateRegex);
        if (matched) {
          checkIn = matched[1];
          checkOut = matched[2];
        }
      }

      // 예약일 정보 (4번째 셀)
      const reservationDateEl = row.querySelector('td:nth-child(4)');
      const reservationDate = reservationDateEl ? reservationDateEl.innerText.trim() : checkIn;

      // 객실 가격 (6번째 셀 내부 첫 번째 li 요소)
      const priceCell = row.querySelector('td:nth-child(6) > ul > li:nth-child(1)');
      const price = priceCell ? priceCell.innerText.trim() : '';

      return {
        reservationStatus,
        reservationNo,
        customerName,
        phoneNumber,
        roomInfo,
        checkIn,
        checkOut,
        price,
        reservationDate,
      };
    });

    console.log('[goodMotel] Extracted reservations:', reservations);

    // 3.3 중복 제거
    const unique = Array.from(
      new Map(reservations.map((r) => [r.reservationNo, r])).values()
    );
    console.log(`[goodMotel] Unique reservations: ${unique.length}`);

    // 3.4 날짜 범위 검증 (모든 예약의 체크인이 지정한 범위 내에 있는지)
    const isDataValid = unique.every((r) => {
      const inDate = dayjs(r.checkIn, 'YYYY-MM-DD HH:mm');
      const start = dayjs(startDate, 'YYYY-MM-DD');
      const end = dayjs(endDate, 'YYYY-MM-DD').endOf('day');
      return inDate.isValid() && inDate.isBetween(start, end, null, '[]');
    });
    if (!isDataValid) {
      console.warn('[goodMotel] Some reservations are outside date range');
    }

    if (!unique.length) {
      console.info('[goodMotel] No reservations found → nothing to send');
      return;
    }

    // 3.5 서버로 예약 데이터 전송
    await sendReservations(hotelId, siteName, unique);
    console.info(
      `[goodMotel] Successfully sent reservations to server. count=${unique.length}`
    );
  } catch (err) {
    console.error('[goodMotel] parse error:', err);
  }
}

/**
 * [4] 최종 스크랩 함수
 */
export async function scrapeGoodMotel(hotelId, siteName = 'GoodMotel') {
  console.log(`[goodMotel] Starting scrapeGoodMotel. hotelId=${hotelId}`);

  // 로그인 상태 체크: "/login" 경로에 있으면 에러 처리
  if (window.location.pathname.includes('/login')) {
    throw new Error('로그인 필요: GoodMotel');
  }

  // 도메인 체크: 반드시 "ad.goodchoice.kr" 도메인이어야 함
  if (!window.location.href.includes('ad.goodchoice.kr')) {
    console.warn('[goodMotel] Not on ad.goodchoice.kr domain, skip parse');
    return;
  }

  // 날짜 계산: 오늘부터 30일 후까지
  const today = dayjs();
  const startDate = today.format('YYYY-MM-DD');
  const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  // 페이지 이동: URL이 아직 업데이트되지 않은 경우 이동 시도
  const didNavigate = navigateToUpdatedURL(startDate, endDate);
  if (didNavigate) {
    // 페이지 이동 후 content script가 재주입되므로 여기서 종료
    return;
  }

  // 파싱 시작
  await parseGoodMotelReservations(hotelId, siteName, startDate, endDate);
}

/**
 * [5] background 메시지 수신 및 처리
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[goodMotel.js: onMessage] Received message:', msg);
  if (msg.action === 'SCRAPE_GOODMOTEL') {
    const { hotelId } = msg;
    scrapeGoodMotel(hotelId, 'GoodMotel')
      .then(() => {
        console.log('[goodMotel.js: onMessage] scrapeGoodMotel success');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[goodMotel.js: onMessage] Scrape error:', error);
        sendResponse({ success: false, message: error.message });
      });
    return true; // 비동기 응답을 보장
  }
  return false;
});

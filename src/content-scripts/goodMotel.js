// chrome-extension/src/content-scripts/goodMotel.js

// 1) Moment 대신 Day.js 사용
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// 2) 플러그인 등록
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/**
 *  [0] 스크립트 로드 로그
 */
console.log('[goodMotel.js] loaded!');

/**
 *  [1] URL 생성 함수
 */
function buildUpdatedURL(startDate, endDate) {
  return `https://ad.goodchoice.kr/reservation/history/total?start_date=${startDate}&end_date=${endDate}&keyword=&keywordType=ORDER_NUMBER&armgno=&sort=checkin&page=1&checked_in=&status=6`;
}

/**
 *  [2] 필요 시 URL 이동 (이미 그 URL이면 이동 스킵)
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
 *  [3] 예약 목록을 실제로 파싱
 */
async function parseGoodMotelReservations(
  hotelId,
  siteName,
  startDate,
  endDate
) {
  try {
    // [3.1] 최대 20회(2초 간격) 폴링하여 테이블 로드 대기
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
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 2000));
    }
    if (!tableLoaded) {
      console.error('[goodMotel] Table not found within 40s → abort parse.');
      return;
    }
    console.log('[goodMotel] Table detected. Start parsing...');

    // [3.2] 모든 행 가져오기
    const rows = document.querySelectorAll(
      '#app > div.contents-wrapper.container > div.row > div > div > div.contents-component > div.common-component--table.is-type01 > table > tbody > tr'
    );

    const reservations = Array.from(rows).map((row) => {
      // (A) 예약 상태
      const reservationStatusEl = row.querySelector('td:nth-child(2) > p');
      const reservationStatus = reservationStatusEl
        ? reservationStatusEl.innerText.trim()
        : '';

      // (B) 예약번호
      const reservationNoEl = row.querySelector('td:nth-child(2) > p');
      const reservationNo = reservationNoEl
        ? reservationNoEl.innerText.trim()
        : '';

      // (C) detail-info 안에서 파싱
      const detailInfoTd = row.querySelector('td.is-left.detail-info');
      const detailText = detailInfoTd ? detailInfoTd.innerText.trim() : '';
      let customerName = '';
      let phoneNumber = '';
      let checkIn = '';
      let checkOut = '';
      let roomInfo = '';

      if (detailText) {
        // 첫 줄: '홍길동 | 010-XXXX-XXXX'
        const lines = detailText.split('\n').map((l) => l.trim());
        if (lines.length >= 1 && lines[0].includes('|')) {
          const [namePart, phonePart] = lines[0]
            .split('|')
            .map((p) => p.trim());
          customerName = namePart;
          phoneNumber = phonePart;
        }
        if (lines.length >= 2) {
          // 두 번째 줄이 객실타입 가정
          roomInfo = lines[1];
        }
        // 체크인/체크아웃 정규식
        const dateRegex =
          /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) ~ (\d{4}-\d{2}-\d{2} \d{2}:\d{2})/;
        const matched = detailText.match(dateRegex);
        if (matched) {
          checkIn = matched[1];
          checkOut = matched[2];
        }
      }

      // (D) 예약일(td:nth-child(4)) 등
      const reservationDateEl = row.querySelector('td:nth-child(4)');
      const reservationDate = reservationDateEl
        ? reservationDateEl.innerText.trim()
        : checkIn; // 필요하면 변경

      // (E) 객실 가격
      const priceCell = row.querySelector(
        'td:nth-child(6) > ul > li:nth-child(1)'
      );
      const price = priceCell ? priceCell.innerText.trim() : '';

      // 반환
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

    // (F) 중복 제거
    const unique = Array.from(
      new Map(reservations.map((r) => [r.reservationNo, r])).values()
    );
    console.log(`[goodMotel] Unique reservations: ${unique.length}`);

    // (G) 날짜 범위 체크 (Moment 대신 Day.js)
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

    // (H) 서버 전송
    await sendReservations(hotelId, siteName, unique);
    console.info(
      `[goodMotel] Successfully sent reservations to server. count=${unique.length}`
    );
  } catch (err) {
    console.error('[goodMotel] parse error:', err);
  }
}

/**
 *  [4] 최종 스크랩 함수
 */
export async function scrapeGoodMotel(hotelId, siteName = 'GoodMotel') {
  console.log(`[goodMotel] Starting scrapeGoodMotel. hotelId=${hotelId}`);

  if (window.location.pathname.includes('/login')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: GoodMotel');
  }

  // 도메인 체크
  if (!window.location.href.includes('ad.goodchoice.kr')) {
    console.warn('[goodMotel] Not on ad.goodchoice.kr domain, skip parse');
    return;
  }

  // 날짜 계산 (Day.js)
  const today = dayjs();
  const startDate = today.format('YYYY-MM-DD');
  const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  // 이동 시도
  const didNavigate = navigateToUpdatedURL(startDate, endDate);
  if (didNavigate) {
    // 페이지 reload → script 재주입
    return;
  }

  // 이미 updatedURL이면 파싱
  await parseGoodMotelReservations(hotelId, siteName, startDate, endDate);
}

/**
 *  [5] background.js → content script 메시지
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
    return true; // 비동기 응답
  }
  return false;
});

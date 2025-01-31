// chrome-extension/src/content-scripts/yanolja.js

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// Day.js 플러그인 등록
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/**
 * [0] 콘솔 로그
 */
console.log('[yanolja.js] loaded!');

/**
 * [1] URL 생성 함수 (날짜 파라미터)
 */
function buildReservationURL(startDate, endDate) {
  return `https://partner.yanolja.com/reservation/search?dateType=CHECK_IN_DATE&startDate=${startDate}&endDate=${endDate}&reservationStatus=ALL&keywordType=VISITOR_NAME&page=1&size=50&sort=checkInDate,desc&propertyCategory=MOTEL&checkedIn=STAY_STATUS_ALL&selectedDate=${startDate}&searchType=detail&useTypeDetail=ALL&useTypeCheckIn=ALL`;
}

/**
 * [2] 필요 시 URL 이동
 */
function navigateToReservationURL(startDate, endDate) {
  const updatedURL = buildReservationURL(startDate, endDate);

  if (window.location.href === updatedURL) {
    console.log('[yanolja] Already on reservation search URL, skip navigation');
    return false;
  }
  console.log('[yanolja] Navigating to reservation URL:', updatedURL);
  window.location.href = updatedURL;
  return true;
}

/**
 * [3] 예약 목록 파싱
 */
async function parseYanoljaReservations(hotelId, siteName, startDate, endDate) {
  try {
    // (3.1) 최대 20회(1초 간격) 폴링하여 테이블 로드 대기
    let tableFound = false;
    for (let i = 0; i < 20; i++) {
      const firstRow = document.querySelector('table > tbody > tr');
      if (firstRow) {
        tableFound = true;
        break;
      }
      console.log('[yanolja] waiting for table to appear...');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 1000));
    }
    if (!tableFound) {
      console.error('[yanolja] Table not found -> abort parse');
      return;
    }
    console.log('[yanolja] Table detected. Start parsing...');

    // (3.2) 모든 행 가져오기
    const rows = document.querySelectorAll('table > tbody > tr');

    const reservations = Array.from(rows).map((row) => {
      const reservationNoEl = row.querySelector(
        'td.ReservationSearchListItem__no > span'
      );
      const reservationNo = reservationNoEl
        ? reservationNoEl.innerText.trim()
        : '';

      const reservationStatusEl = row.querySelector(
        'td.ReservationSearchListItem__status'
      );
      const reservationStatus = reservationStatusEl
        ? reservationStatusEl.innerText.trim()
        : '';

      const customerNameEl = row.querySelector(
        'td.ReservationSearchListItem__visitor > span:nth-child(1)'
      );
      const customerName = customerNameEl
        ? customerNameEl.innerText.trim()
        : '';

      const roomInfoEl = row.querySelector(
        'td.ReservationSearchListItem__roomInfo'
      );
      const roomInfo = roomInfoEl ? roomInfoEl.innerText.trim() : '';

      // checkIn / checkOut
      const dateTd = row.querySelector('td.ReservationSearchListItem__date');
      let checkIn = '';
      let checkOut = '';
      if (dateTd) {
        const lines = dateTd.innerText.split('\n').map((l) => l.trim());
        checkIn = lines[0] || '';
        checkOut = lines[1] || '';
      }

      // price
      const priceEl = row.querySelector('td.ReservationSearchListItem__price');
      const price = priceEl ? priceEl.innerText.trim() : '';

      // reservationDate
      const reservationDateEl = row.querySelector(
        'td.ReservationSearchListItem__reservation'
      );
      const reservationDate = reservationDateEl
        ? reservationDateEl.innerText.trim()
        : '';

      return {
        reservationNo,
        reservationStatus,
        customerName,
        roomInfo,
        checkIn,
        checkOut,
        price,
        reservationDate,
      };
    });

    console.log('[yanolja] Extracted reservations:', reservations);

    if (!reservations.length) {
      console.log('[yanolja] No reservations found -> skip sending');
      return;
    }

    // (3.3) 날짜 범위 체크(필요시). 여기서는 전체 전송
    await sendReservations(hotelId, siteName, reservations);
    console.log('[yanolja] Successfully sent reservations to server.');

    // ★ (3.4) 쿠키 서버 전송 부분 제거 ★
    // 기존에 있던 "EXTRACT_YANOLJA_COOKIES" 메시지 송신 코드를 삭제함.
    // ...
  } catch (err) {
    console.error('[yanolja] parse error:', err);
  }
}

/**
 * [4] 최종 스크랩 함수
 */
async function scrapeYanolja(hotelId, siteName = 'YanoljaMotel') {
  console.log(`[yanolja] Starting scrape. hotelId=${hotelId}`);

  if (window.location.pathname.includes('/login')) {
    throw new Error('로그인 필요: Yanolja');
  }

  if (!window.location.href.includes('partner.yanolja.com')) {
    console.warn('[yanolja] Not on partner.yanolja.com domain, skip');
    return;
  }

  // (4.1) 날짜 계산
  const today = dayjs();
  const startDate = today.format('YYYY-MM-DD');
  const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');

  // (4.2) URL 이동
  const didNavigate = navigateToReservationURL(startDate, endDate);
  if (didNavigate) {
    return; // 페이지가 바뀌면 content script가 재주입될 것
  }

  // (4.3) 이미 타겟 URL이면 파싱
  await parseYanoljaReservations(hotelId, siteName, startDate, endDate);
}

/**
 * [5] background.js → content script 메시지 리스너
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[yanolja.js: onMessage] Received:', msg);
  if (msg.action === 'SCRAPE_YANOLJA') {
    const { hotelId } = msg;
    scrapeYanolja(hotelId, 'YanoljaMotel')
      .then(() => {
        console.log('[yanolja] scrape done');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[yanolja] scrape error:', error);
        sendResponse({ success: false, message: error.message });
      });
    return true; // 비동기 응답
  }
  return false;
});

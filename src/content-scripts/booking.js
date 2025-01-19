// chrome-extension/src/content-scripts/booking.js

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// 1) Day.js 플러그인 등록
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

console.log('[booking.js] content script loaded');

/**
 * (A) "Booking.com" 예약 페이지 URL 생성
 */
function buildBookingURL(bookingHotelId, startDate, endDate) {
  return (
    `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html` +
    `?upcoming_reservations=1&source=nav` +
    `&hotel_id=${bookingHotelId}` +
    `&lang=ko` +
    `&date_from=${startDate}` +
    `&date_to=${endDate}` +
    `&date_type=arrival`
  );
}

/**
 * (B) Booking.com 페이지로 이동하는 함수
 *    - 이미 그 URL이면 이동 스킵
 */
// function navigateToBookingPage(startDate, endDate) {
//   const urlObj = new URL(window.location.href);
//   let realHotelId = urlObj.searchParams.get('hotel_id');

//   // 호텔 ID가 없거나 unknown이면 fallback 사용
//   if (!realHotelId || realHotelId === 'unknown') {
//     realHotelId = '6876426'; // 임시 fallback
//     console.log('[booking.js] Using fallback hotel_id:', realHotelId);
//   }

//   const finalURL = buildBookingURL(realHotelId, startDate, endDate);

//   // 이미 해당 URL이면 스킵
//   if (window.location.href === finalURL) {
//     console.log('[booking.js] Already on final booking URL, skip navigation');
//     return false;
//   }

//   console.log('[booking.js] Navigating to final booking URL:', finalURL);
//   window.location.href = finalURL;
//   return true; // 실제 이동
// }

/***********************************************************
 * C. 실제로 예약 리스트를 파싱하고 서버로 전송하는 함수
 ***********************************************************/
async function parseBookingReservations(hotelId, siteName) {
  try {
    console.log('[booking.js] parseBookingReservations start');

    // (1) 페이지가 완전히 로드될 때까지 대기 (window.onload)
    await waitForWindowLoad();

    // (2) 추가로 3초 (또는 5초) 정도 더 대기
    console.log('[booking.js] window.onload done => waiting extra 1s...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // (3) 이제 테이블 로딩 폴링 (최대 20~60회)
    let tableFound = false;
    const maxAttempts = 20; // 예: 20회
    for (let i = 0; i < maxAttempts; i++) {
      const rows = document.querySelectorAll(
        '#main-content > div > div.reservation-table__wrapper > table > tbody > tr'
      );
      console.log(
        `[booking.js] Attempt #${i + 1} to find table. rowCount=${rows.length}`
      );
      if (rows.length > 0) {
        tableFound = true;
        break;
      }
      console.log('[booking.js] Table not ready -> waiting another 2s...');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!tableFound) {
      console.error('[booking.js] Table not found -> abort parse');
      return;
    }

    // (4) 예약 정보 추출
    const rows = document.querySelectorAll(
      '#main-content > div > div.reservation-table__wrapper > table > tbody > tr'
    );
    const reservations = Array.from(rows)
      .map((row) => {
        const thCustomer = row.querySelector('th');
        if (!thCustomer) return null;

        const customerName = thCustomer.innerText.trim();
        const checkIn =
          row.querySelector('td:nth-child(2)')?.innerText.trim() || '';
        const checkOut =
          row.querySelector('td:nth-child(3)')?.innerText.trim() || '';
        const roomInfo =
          row
            .querySelector('td.wrap-anywhere.bui-table__cell')
            ?.innerText.trim() || '';
        const reservationDate =
          row.querySelector('td:nth-child(5)')?.innerText.trim() || '';
        const reservationStatus =
          row.querySelector('td:nth-child(6)')?.innerText.trim() || '';
        const price =
          row.querySelector('td:nth-child(7)')?.innerText.trim() || '';
        const reservationNo =
          row.querySelector('td:nth-child(9)')?.innerText.trim() || '';

        return {
          reservationStatus,
          reservationNo,
          customerName,
          roomInfo,
          checkIn,
          checkOut,
          price,
          reservationDate,
        };
      })
      .filter(Boolean);

    if (!reservations.length) {
      console.warn('[booking.js] No reservations found => skip sending');
      return;
    }

    console.log('[booking.js] Extracted reservations =>', reservations);

    // (5) 서버 전송
    await sendReservations(hotelId, siteName, reservations);
    console.info(
      `[booking.js] Successfully sent reservations. count=${reservations.length}`
    );
  } catch (err) {
    console.error('[booking.js] parse error:', err);
  }
}

/***********************************************************
 * X. window.onload 대기 헬퍼
 ***********************************************************/
function waitForWindowLoad() {
  // 이미 로드가 끝났다면(document.readyState==='complete') 즉시 resolve
  if (document.readyState === 'complete') {
    console.log(
      '[booking.js] document.readyState=complete => skip waitForWindowLoad'
    );
    return Promise.resolve();
  }
  // 아직이면 onload 이벤트 기다림
  return new Promise((resolve) => {
    console.log('[booking.js] waiting for window.onload...');
    window.addEventListener(
      'load',
      () => {
        console.log('[booking.js] window.onload event fired => proceed');
        resolve();
      },
      { once: true }
    );
  });
}

/**
 * (D) 스크래핑 메인 함수
 */
export async function scrapeBooking(hotelId, siteName = 'Booking') {
  console.log(`[booking.js] Starting scrapeBooking. hotelId=${hotelId}`);

  if (window.location.pathname.includes('/login')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: Booking');
  }

  // 1) 날짜 범위
  const today = dayjs();
  const startDate = today.format('YYYY-MM-DD');
  const endDate = today.add(30, 'day').format('YYYY-MM-DD');

  // 2) admin.booking.com 도메인 체크
  if (!window.location.href.includes('admin.booking.com')) {
    // 다른 페이지라면, fallback hotel_id로 이동
    const fallbackHotelId = '6876426';
    const fallbackURL = buildBookingURL(fallbackHotelId, startDate, endDate);
    console.warn(
      '[booking.js] Not on admin.booking.com -> navigating to fallbackURL'
    );
    window.location.href = fallbackURL;
    return; // 이동 후 content script 재주입됨
  }

  // // 3) 이미 admin.booking.com에 있다면, 최종 목적지 URL 이동 시도
  // const didNavigate = navigateToBookingPage(startDate, endDate);
  // if (didNavigate) {
  //   // 이동하면 새로고침되므로 함수 종료
  //   return;
  // }

  // 4) 페이지 이동이 없었다면(이미 그 URL이라면), 예약 파싱
  await parseBookingReservations(hotelId, siteName);
}

/**
 * (E) 메시지 리스너
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[booking.js: onMessage] Received message:', msg);

  if (msg.action === 'SCRAPE_BOOKING') {
    const { hotelId, siteName } = msg;
    scrapeBooking(hotelId, siteName)
      .then(() => {
        console.log('[booking.js: onMessage] scrapeBooking success');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[booking.js: onMessage] Scrape error:', error);
        sendResponse({ success: false, message: error.message });
      });
    return true; // 비동기 응답
  }

  return false;
});

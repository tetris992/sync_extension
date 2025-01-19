// chrome-extension/src/content-scripts/expedia.js

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// Day.js 플러그인 등록 (선택)
dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

console.log('[expedia.js] content script loaded');

/***********************************************************
 * (A) Expedia 예약 페이지 URL 생성
 ***********************************************************/
function buildExpediaURL(expediaHotelId) {
  return `https://apps.expediapartnercentral.com/lodging/bookings?htid=${expediaHotelId}`;
}

/***********************************************************
 * (B) 페이지 이동
 ***********************************************************/
function navigateToExpediaPage(expediaHotelId) {
  const currentUrl = window.location.href;
  const finalUrl = buildExpediaURL(expediaHotelId);

  if (currentUrl === finalUrl) {
    console.log('[expedia.js] Already on final URL => skip navigation');
    return false;
  }
  console.log('[expedia.js] Navigating to final booking URL:', finalUrl);
  window.location.href = finalUrl;
  return true;
}

/***********************************************************
 * (C) window.onload + 추가 대기
 ***********************************************************/
async function waitForPageLoadAndDelay() {
  if (document.readyState !== 'complete') {
    console.log('[expedia.js] waiting for window.onload...');
    await new Promise((resolve) => {
      window.addEventListener(
        'load',
        () => {
          console.log('[expedia.js] window.onload -> proceed');
          resolve();
        },
        { once: true }
      );
    });
  } else {
    console.log(
      '[expedia.js] document.readyState=complete => skip waitForWindowLoad'
    );
  }

  // 추가 1초 대기
  console.log('[expedia.js] extra 1s delay...');
  await new Promise((r) => setTimeout(r, 1000));
}

/***********************************************************
 * (D) 예약 리스트 파싱 (결제방법 필드 추가)
 ***********************************************************/
async function parseExpediaReservations(hotelId, siteName) {
  try {
    console.log('[expedia.js] parseExpediaReservations start');

    // (1) 페이지 로드 + 딜레이
    await waitForPageLoadAndDelay();

    // (2) 테이블 폴링 (최대 20회, 1초 간격)
    let tableFound = false;
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const rows = document.querySelectorAll('table > tbody > tr');
      console.log(`[expedia.js] Attempt #${i + 1} rowCount=${rows.length}`);
      if (rows.length > 0) {
        tableFound = true;
        break;
      }
      console.log('[expedia.js] Table not ready -> wait 1s');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!tableFound) {
      console.error('[expedia.js] Table not found -> abort');
      return;
    }

    // (3) 실제 DOM 파싱
    const rows = document.querySelectorAll('table > tbody > tr');
    const reservations = Array.from(rows)
      .map((row) => {
        // 예시: <td class="reservationId"> 391303427 </td>
        const reservationNoCell = row.querySelector('td.reservationId');
        if (!reservationNoCell) return null;

        let reservationNo = reservationNoCell.innerText.trim();

        // 상태 (ex: <td class="confirmationCode">OK</td> or "Canceled")
        let reservationStatus =
          row.querySelector('td.confirmationCode')?.innerText.trim() || '';

        // 고객명 (ex: <td class="guestName">TSUYOSHI YOSHIDA</td>)
        const customerName =
          row.querySelector('td.guestName')?.innerText.trim() || '';

        // 객실타입 (ex: <td class="roomType">Hinoki Deluxe Double Room</td>)
        const roomInfo =
          row.querySelector('td.roomType')?.innerText.trim() || '';

        // 체크인, 체크아웃
        const checkIn =
          row.querySelector('td.checkInDate')?.innerText.trim() || '';
        const checkOut =
          row.querySelector('td.checkOutDate')?.innerText.trim() || '';

        // 결제 금액 (ex: <td class="bookingAmount"> 510000 </td>)
        const price =
          row.querySelector('td.bookingAmount')?.innerText.trim() || '';

        // 예약일 (ex: <td class="bookedOnDate"> 2025-01-07T21:17:00-08:00 </td>)
        const reservationDate =
          row.querySelector('td.bookedOnDate')?.innerText.trim() || '';
        const paymentSel = row.querySelector(
          'td.bookingAmount .fds-cell.secondRowStyle > span'
        );
        const paymentMethod = paymentSel ? paymentSel.innerText.trim() : '';

        // 취소 처리
        if (reservationNo.includes('Canceled')) {
          reservationNo = reservationNo.replace('Canceled', '').trim();
          reservationStatus = 'Canceled';
        }

        return {
          reservationNo,
          reservationStatus,
          customerName,
          roomInfo,
          checkIn,
          checkOut,
          reservationDate,
          price,
          paymentMethod,
        };
      })
      .filter(Boolean);

    if (!reservations.length) {
      console.warn('[expedia.js] No valid reservations => skip sending');
      return;
    }

    console.log('[expedia.js] Extracted reservations =>', reservations);

    // (4) 서버 전송
    await sendReservations(hotelId, siteName, reservations);
    console.info(
      `[expedia.js] Sent ${reservations.length} reservations => done.`
    );
  } catch (err) {
    console.error('[expedia.js] parse error:', err);
  }
}

/***********************************************************
 * (E) 메인 함수
 ***********************************************************/
export async function scrapeExpedia(hotelId, siteName = 'Expedia') {
  console.log(
    `[expedia.js] Starting scrapeExpedia => hotelId=${hotelId}, siteName=${siteName}`
  );

  if (window.location.pathname.includes('/Logon')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: Epedia');
  }

  // 1) 도메인 체크
  if (!window.location.href.includes('apps.expediapartnercentral.com')) {
    console.warn('[expedia.js] Not on apps.expediapartnercentral.com -> skip');
    return;
  }

  // 2) Expedia hotelId (fallback)
  const fallbackExpediaId = '59872761'; // 예시
  // 실제론 msg.expediaId || ...

  // // 3) 예약 페이지 이동
  // const didNavigate = navigateToExpediaPage(fallbackExpediaId);
  // if (didNavigate) {
  //   // 새로고침 -> content script 재주입
  //   return;
  // }

  // 4) 이미 페이지면 파싱
  await parseExpediaReservations(hotelId, siteName);
}

/***********************************************************
 * (F) 메시지 리스너
 ***********************************************************/
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[expedia.js: onMessage] Received message:', msg);

  if (msg.action === 'SCRAPE_EXPEDIA') {
    const { hotelId, siteName } = msg;
    scrapeExpedia(hotelId, siteName)
      .then(() => {
        console.log('[expedia.js: onMessage] scrapeExpedia success');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[expedia.js: onMessage] Scrape error:', error);
        sendResponse({ success: false, message: error.message });
      });
    return true; // 비동기
  }
  return false;
});

// chrome-extension/src/content-scripts/goodHotel.js

import { sendReservations } from '../utils/sendReservations.js';

// 간단한 "waitForSelector" 유사 함수 (최대 10초까지 시도)
async function waitForSelector(selector, maxRetries = 2, intervalMs = 2000) {
  let retries = 0;
  while (retries < maxRetries) {
    const el = document.querySelector(selector);
    if (el) return el;
    console.log(`[goodHotel] Waiting for selector: ${selector}`);
    await new Promise((res) => setTimeout(res, intervalMs));
    retries += 1;
  }
  throw new Error(`Selector not found: ${selector}`);
}

/**
 * 1) 실제 예약 목록을 파싱하고 서버로 전송하는 함수
 
 */
async function scrapeGoodChoiceHotel(hotelId, siteName = 'GoodHotel') {
  console.log(`[goodHotel] Starting scrape for hotelId=${hotelId}`);

  if (window.location.pathname.includes('/login')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: GoodHotel');
  }

  try {
    // (1) 혹시 다른 페이지일 수 있으니, URL 확인 후 필요하면 이동
    //     → 크롬 확장에서는 window.location.href 로 이동 가능
    if (
      !window.location.href.includes(
        'partner.goodchoice.kr/reservations/reservation-list'
      )
    ) {
      console.log('[goodHotel] Not on reservation-list page → navigating...');
      window.location.href =
        'https://partner.goodchoice.kr/reservations/reservation-list';

      return;
    }

    // (2) "월별 드롭다운" + "특정 월 선택"
    const monthDropdownSelector =
      '#__next > div > div > main > section > div.css-1kiy3dg.eobbxyy1 > div:nth-child(2) > button';
    const monthDropdown = await waitForSelector(monthDropdownSelector, 5, 2000);
    monthDropdown.click();
    console.info('[goodHotel] 월별 드롭다운 버튼 클릭');

    const selectMonthSelector =
      '#__next > div > div > main > section > div.css-1kiy3dg.eobbxyy1 > div:nth-child(2) > div > ul > li:nth-child(3) > button';
    const selectMonth = await waitForSelector(selectMonthSelector, 5, 2000);
    selectMonth.click();
    console.info('[goodHotel] 드롭 메뉴에서 특정 월 선택');

    // (3) "기본 10개 보기" 클릭
    const view10ButtonSelector =
      '#__next > div > div > main > section > div.css-6obysj.e7w8kta5 > div.css-1bg37p3.e7w8kta2 > div.css-j2u1gu.eifwycs3 > button';
    const view10Button = await waitForSelector(view10ButtonSelector, 5, 2000);
    view10Button.click();
    console.info('[goodHotel] 기본 10개 보기 버튼 클릭');

    // (4) "50개씩 보기" 클릭
    const view50ButtonSelector =
      '#__next > div > div > main > section > div.css-6obysj.e7w8kta5 > div.css-1bg37p3.e7w8kta2 > div.css-j2u1gu.eifwycs3 > div > ul > li:nth-child(3) > button';
    const view50Button = await waitForSelector(view50ButtonSelector, 5, 2000);
    view50Button.click();
    console.info('[goodHotel] 50개씩 보기 드롭 메뉴 클릭');

    // (5) 2초 정도 대기 (필요시)
    console.info('[goodHotel] Waiting 2s for page update...');
    await new Promise((res) => setTimeout(res, 2000));

    // (6) 예약 목록 추출
    const rows = document.querySelectorAll('table > tbody > tr');
    if (!rows || rows.length === 0) {
      console.info(`[goodHotel] No reservations found for ${siteName}`);
      return;
    }

    const reservations = Array.from(rows).map((row) => {
      const reservationStatusCell = row.querySelector('td:nth-child(1)');
      const reservationStatus = reservationStatusCell
        ? reservationStatusCell.innerText.trim().split('\n')[0].trim()
        : '';

      const reservationNoCell = row.querySelector('td:nth-child(2)');
      const reservationNo = reservationNoCell
        ? reservationNoCell.innerText.trim().split('\n')[0].trim()
        : '';

      const customerNameCell = row.querySelector('td:nth-child(3)');
      const customerName = customerNameCell
        ? customerNameCell.innerText.trim().split('\n')[0].trim()
        : '';

      const roomInfoCell = row.querySelector('td:nth-child(4)');
      const roomInfo = roomInfoCell
        ? roomInfoCell.innerText.trim().split('\n')[0].trim()
        : '';

      const checkInCell = row.querySelector(
        'td:nth-child(5) > div:nth-child(1) > p'
      );
      const checkIn = checkInCell ? checkInCell.innerText.trim() : '';

      const checkOutCell = row.querySelector(
        'td:nth-child(5) > div:nth-child(2) > p'
      );
      const checkOut = checkOutCell ? checkOutCell.innerText.trim() : '';

      const priceCell = row.querySelector('td:nth-child(6)');
      const price = priceCell
        ? priceCell.innerText.trim().split('\n')[0].trim()
        : '';

      const reservationDateCell = row.querySelector('td:nth-child(8)');
      const reservationDate = reservationDateCell
        ? reservationDateCell.innerText.trim()
        : '';

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
    });

    console.info('[goodHotel] Extracted Reservation Data:', reservations);

    if (!reservations.length) {
      console.info(`[goodHotel] No reservations found after extracting.`);
      return;
    }

    // (7) 서버 전송 (원본과 동일)
    await sendReservations(hotelId, siteName, reservations);
    console.info(
      `[goodHotel] Reservations successfully saved for hotelId=${hotelId}, count=${reservations.length}`
    );
  } catch (err) {
    console.error(
      `[goodHotel] Scraping failed for ${siteName}:${hotelId}:`,
      err
    );
  } finally {
    // Puppeteer의 page.close() 대신, "탭 유지"라고 가정하므로 아무것도 안 함
    console.info(`[goodHotel] Done. (Tab remains open)`);
  }
}

/**
 * 2) 메시지 리스너
 *   - background에서 {action:'SCRAPE_GOOD_HOTEL', hotelId} 메시지를 보내면 동작
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'SCRAPE_GOOD_HOTEL') {
    const { hotelId } = msg;
    scrapeGoodChoiceHotel(hotelId, 'GoodHotel')
      .then(() => {
        console.log('[goodHotel.js] scrapeGoodChoiceHotel success');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[goodHotel.js] Scrape error:', error);
        sendResponse({ success: false, message: error.message });
      });
    return true;
  }
  return false;
});

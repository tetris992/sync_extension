import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { sendReservations } from '../utils/sendReservations.js';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

console.log('[coolStay.js] content script loaded (DOM-based)');

function buildUpdatedURL(startDate, endDate) {
  return `https://pms.coolstay.co.kr/motel-biz-pc/reservation?&page=1&searchType=ST602,ST608&searchExtra=${startDate}|${endDate},&sort=BOOK_DESC&tabState=0&selectSort=0&selectChannelOut=0&selectDateRange=customInput&selectEnterType=0`;
}

const statusMap = {
  B004: 'Confirmed',
};

function parseDomReservations(hotelId, siteName) {
  const container = document.querySelector('#Reservation-Container');
  if (!container) {
    console.warn('[coolStay.js] #Reservation-Container not found => stop');
    return;
  }
  const rawText = container.innerText || '';
  const lines = rawText.split('\n').map((line) => line.trim());

  const reservations = [];
  let current = null;

  lines.forEach((line) => {
    if (line === '복사') {
      if (current) {
        reservations.push(current);
      }
      current = {};
      return;
    }

    if (current) {
      if (!current.reservationNo) {
        current.reservationNo = line;
        return;
      }
      if (!current.customerName) {
        current.customerName = line;
        return;
      }
      if (!current.safeNumber) {
        current.safeNumber = line;
        return;
      }
      if (!current.roomInfo && line.includes('|') && line.includes('대실')) {
        current.roomInfo = line.replace('대실 | ', '').trim();
        return;
      }
      if (
        !current.checkIn &&
        line.includes('(입실)') &&
        line.includes('(퇴실)')
      ) {
        const splitted = line.split('~');
        if (splitted.length === 2) {
          const cIn = splitted[0].replace('(입실)', '').trim();
          const cOut = splitted[1].replace('(퇴실)', '').trim();
          current.checkIn = cIn;
          current.checkOut = cOut;
        }
        return;
      }
      if (!current.reservationDate && line.includes('(예약)')) {
        current.reservationDate = line.replace('(예약)', '').trim();
        return;
      }
      if (!current.price && line.match(/^\d{1,3}(,\d{3})*$/)) {
        const num = line.replace(/,/g, '');
        current.price = parseInt(num, 10);
        return;
      }
      if (
        !current.paymentMethod &&
        (line.includes('신용/체크카드') || line.includes('계좌이체'))
      ) {
        current.paymentMethod = line;
        return;
      }
    }
  });

  if (current) reservations.push(current);
  console.log('[coolStay.js] parsed reservations =>', reservations);

  const finalList = reservations.map((r) => {
    const checkInDayjs = dayjs(r.checkIn, 'YYYY.MM.DD HH:mm');
    const checkOutDayjs = dayjs(r.checkOut, 'YYYY.MM.DD HH:mm');
    const resDateDayjs = dayjs(r.reservationDate, 'YYYY.MM.DD HH:mm');

    return {
      reservationNo: r.reservationNo || '',
      customerName: r.customerName || '',
      roomInfo: r.roomInfo || '',
      checkIn: checkInDayjs.isValid()
        ? checkInDayjs.format('YYYY-MM-DD HH:mm')
        : '',
      checkOut: checkOutDayjs.isValid()
        ? checkOutDayjs.format('YYYY-MM-DD HH:mm')
        : '',
      reservationDate: resDateDayjs.isValid()
        ? resDateDayjs.format('YYYY-MM-DD HH:mm')
        : '',
      price: r.price || 0,
      paymentMethod: r.paymentMethod || 'Unknown',
      reservationStatus: statusMap['B004'] || 'Confirmed',
      siteName,
    };
  });

  // 서버 전송
  sendReservations(hotelId, siteName, finalList)
    .then(() => {
      console.info(
        `[coolStay.js] Sent ${finalList.length} DOM-based reservations.`
      );
    })
    .catch((err) => {
      console.error('[coolStay.js] DOM-based sendReservations error:', err);
    });
}

export async function scrapeCoolStay(hotelId, siteName = 'CoolStay') {
  console.log(
    `[coolStay.js] Starting DOM-based scrape for CoolStay => hotelId=${hotelId}, siteName=${siteName}`
  );

  if (window.location.pathname.includes('/login')) {
    throw new Error('로그인 필요: CoolStay');
  }

  if (!window.location.href.includes('pms.coolstay.co.kr')) {
    console.warn('[coolStay.js] Not on pms.coolstay.co.kr => skip');
    return;
  }

  // [1] 잠시 대기하여 현재 DOM/React 렌더링에 대한 여유 시간 확보
  console.log('[coolStay.js] Initial waiting 2s to ensure DOM is rendered...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // [2] 월단위 날짜 계산 (예: 이번 달 1일부터 말일)
  const startOfThisMonth = dayjs().startOf('month');
  const endOfThisMonth = dayjs().endOf('month');

  const startDate = startOfThisMonth.format('YYYYMMDD'); // 예: 20250101
  const endDate = endOfThisMonth.format('YYYYMMDD'); // 예: 20250131

  const updatedURL = buildUpdatedURL(startDate, endDate);

  // [3] 이동 여부 판단
  if (window.location.href === updatedURL) {
    // 이미 원하는 URL에 있다면, 추가로 한 번 더 대기 후 파싱
    console.log('[coolStay.js] Already on updatedURL => proceed parsing');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    parseDomReservations(hotelId, siteName);
  } else {
    // 아직 원하는 날짜가 반영된 URL이 아니라면, 페이지 이동 후 종료
    console.log('[coolStay.js] Navigating to updatedURL:', updatedURL);
    window.location.href = updatedURL;
    // 이동하면 content script가 다시 주입될 것이므로 여기서 return
  }
}

// (C) 메시지 리스너
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'SCRAPE_COOLSTAY') {
    const { hotelId, siteName } = msg;
    scrapeCoolStay(hotelId, siteName)
      .then(() => {
        console.log('[coolStay.js] DOM-based scrapeCoolStay done');
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error('[coolStay.js] DOM-based scrape error:', err);
        sendResponse({ success: false, message: err.message });
      });
    return true; // 비동기 응답
  }
  return false;
});

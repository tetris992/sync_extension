/**
 * chrome-extension/src/content-scripts/coolStay.js
 *
 * - "DOM 기반" 스크래핑 버전
 * - 이미 /motel-biz-pc/reservation 페이지에 들어와 있고,
 *   React가 렌더링한 예약목록을 #Reservation-Container에서 문자열로 파싱
 */

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import { sendReservations } from '../utils/sendReservations.js';

// dayjs 플러그인 등록
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

console.log('[coolStay.js] content script loaded (DOM-based)');

// 간단 예시: "B004" → "Confirmed" 식의 매핑이 필요하면 추가
const statusMap = {
  B004: 'Confirmed', // 예: "B004"가 'Confirmed' 상태
  // ... 필요 시 추가
};

// (A) DOM 파싱 함수
function parseDomReservations(hotelId, siteName) {
  // 1) 최상위 컨테이너 찾기
  const container = document.querySelector('#Reservation-Container');
  if (!container) {
    console.warn('[coolStay.js] #Reservation-Container not found => stop');
    return;
  }

  // 2) 전체 텍스트 추출
  const rawText = container.innerText || '';
  console.log('[coolStay.js] container innerText =>', rawText);

  // 3) 문자열 파싱 (예시는 정말 간단하게 split)
  //    실제로는 정규식 or 더 세분화된 로직이 필요함
  const lines = rawText.split('\n').map((line) => line.trim());

  // 예) lines 에 담긴 내용 (부분):
  // [
  //   "예약 내역",
  //   "예약 고객의 예약 정보를 일자별로 조회할 수 있습니다.",
  //   ...
  //   "복사",
  //   "225011201357",
  //   "박진오",
  //   "0504-****-7425",
  //   "0504-****-7425 | 차량",
  //   "대실 | 클래식 더블(5시간 대실)",
  //   "2025.01.12 13:30(입실) ~ 2025.01.12 18:30(퇴실)",
  //   "2025.01.12 13:23(예약)",
  //   "38,000",
  //   ...
  // ]

  const reservations = [];

  // 4) 대략적으로 "복사" 문자열이 예약 1건의 시작이라고 가정
  //    (예시 로직: 인덱스들 그룹화)
  let current = null;

  lines.forEach((line) => {
    if (line === '복사') {
      // 이전 current가 있으면 밀어넣기
      if (current) {
        reservations.push(current);
      }
      // 새 예약 오브젝트 시작
      current = {};
      return;
    }

    // 만약 current가 존재하면 해당 line을 처리
    if (current) {
      // 예: 첫 줄은 reservationNo
      if (!current.reservationNo) {
        current.reservationNo = line;
        return;
      }
      // 다음 줄은 customerName (등등 로직)
      if (!current.customerName) {
        current.customerName = line;
        return;
      }
      // 예시: safeNumber 등...
      if (!current.safeNumber) {
        current.safeNumber = line;
        return;
      }
      // ...
      // 대실 | 클래식 더블(5시간 대실) → roomType
      if (!current.roomInfo && line.includes('|') && line.includes('대실')) {
        current.roomInfo = line.replace('대실 | ', '').trim();
        return;
      }
      // 체크인/체크아웃 "2025.01.12 13:30(입실) ~ 2025.01.12 18:30(퇴실)"
      if (
        !current.checkIn &&
        line.includes('(입실)') &&
        line.includes('(퇴실)')
      ) {
        // 예: "2025.01.12 13:30(입실) ~ 2025.01.12 18:30(퇴실)"
        const splitted = line.split('~');
        if (splitted.length === 2) {
          const cIn = splitted[0].replace('(입실)', '').trim();
          const cOut = splitted[1].replace('(퇴실)', '').trim();
          current.checkIn = cIn;
          current.checkOut = cOut;
        }
        return;
      }
      // 예약일 "2025.01.12 13:23(예약)"
      if (!current.reservationDate && line.includes('(예약)')) {
        current.reservationDate = line.replace('(예약)', '').trim();
        return;
      }
      // 가격 "38,000"
      // 단순히 숫자만 추출
      if (!current.price && line.match(/^\d{1,3}(,\d{3})*$/)) {
        const num = line.replace(/,/g, '');
        current.price = parseInt(num, 10);
        return;
      }
      // 결제수단 "신용/체크카드"
      if (
        !current.paymentMethod &&
        (line.includes('신용/체크카드') || line.includes('계좌이체'))
      ) {
        current.paymentMethod = line;
        return;
      }
      // 예약 끝 / "판매완료" 등등...
      // ...
    }
  });

  // 마지막 current 처리
  if (current) reservations.push(current);

  console.log('[coolStay.js] parsed reservations =>', reservations);

  // 5) dayjs 파싱 + 추가 필드
  const finalList = reservations.map((r) => {
    // checkIn, checkOut, reservationDate → 표준 ISO로 변환
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
      // 추가 필드들(필요 시)
      reservationStatus: statusMap['B004'] || 'Confirmed', // 예시로 임의
      siteName,
    };
  });

  // 6) 서버 전송
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

// (B) 메인 함수
export async function scrapeCoolStay(hotelId, siteName = 'CoolStay') {
  console.log(
    `[coolStay.js] Starting DOM-based scrape for CoolStay => hotelId=${hotelId}, siteName=${siteName}`
  );

  if (window.location.pathname.includes('/login')) {
    // 여기서는 예시로 "/login"을 통해 "로그아웃 상태" 판별
    throw new Error('로그인 필요: CoolStay');
  }

  if (!window.location.href.includes('pms.coolstay.co.kr')) {
    console.warn('[coolStay.js] Not on pms.coolstay.co.kr => skip');
    return;
  }

  // 혹시 React 렌더링 시간이 필요하면 2~3초 정도 더 대기
  console.log('[coolStay.js] waiting 2s to ensure DOM is rendered...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  parseDomReservations(hotelId, siteName);
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
    return true; // 비동기
  }
  return false;
});

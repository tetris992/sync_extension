// chrome-extension/src/content-scripts/yanolja.js

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { sendReservations } from '../utils/sendReservations.js';

// Day.js 플러그인 등록
dayjs.extend(customParseFormat);

/**
 * [0] 콘솔 로그
 */
console.log('[yanolja.js] loaded!');

/**
 * [1] URL 생성 함수 (날짜 파라미터)
 */
function buildReservationURL(startDate, endDate) {
  return `https://partner.yanolja.com/reservation/search?type=DETAIL&startDate=${startDate}&endDate=${endDate}`;
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
async function parseYanoljaReservations(hotelId, siteName, endDate) {
  try {
    // (3.1) 테이블 로드 대기 (MutationObserver 사용)
    const waitForTable = () => {
      return new Promise((resolve, reject) => {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };
        let tableFound = false;

        // 테이블 셀렉터 (MuiDataGrid의 데이터 행)
        const tableSelector = 'div[role="row"]:not(:has(div[role="columnheader"]))';
        const cellSelector = 'div[role="cell"][data-field="reservationNo"]';
        const checkInOutSelector = 'div[role="cell"][data-field="checkInOut"]';

        // 이미 테이블이 존재하는지 확인
        const firstRow = document.querySelector(tableSelector);
        const firstCell = document.querySelector(cellSelector);
        const checkInOutCell = document.querySelector(checkInOutSelector);
        if (firstRow && firstCell && checkInOutCell) {
          tableFound = true;
          resolve(true);
          return;
        }

        // MutationObserver 설정
        const observer = new MutationObserver((mutations, obs) => {
          const firstRow = document.querySelector(tableSelector);
          const firstCell = document.querySelector(cellSelector);
          const checkInOutCell = document.querySelector(checkInOutSelector);
          if (firstRow && firstCell && checkInOutCell) {
            tableFound = true;
            obs.disconnect();
            resolve(true);
          }
        });

        observer.observe(targetNode, config);

        // 최대 30초 대기
        setTimeout(() => {
          if (!tableFound) {
            observer.disconnect();
            // 디버깅: HTML 구조 로깅
            const tableContainer = document.querySelector('div.MuiDataGrid-root');
            console.log('[yanolja] Table not found after 30 seconds. Table container exists:', !!tableContainer);
            if (tableContainer) {
              console.log('[yanolja] Table container HTML:', tableContainer.innerHTML);
            } else {
              console.log('[yanolja] Table container not found. Full HTML:', document.body.innerHTML);
            }
            reject(new Error('Table not found after 30 seconds'));
          }
        }, 30000);
      });
    };

    console.log('[yanolja] Waiting for table to load...');
    await waitForTable();
    console.log('[yanolja] Table detected. Start parsing...');

    // (3.2) 스크롤을 끝까지 이동시켜 모든 데이터 로드
    const scrollToBottom = async () => {
      const table = document.querySelector('div.MuiDataGrid-virtualScroller');
      if (table) {
        let lastHeight = table.scrollHeight;
        while (true) {
          table.scrollTop = table.scrollHeight;
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (table.scrollHeight === lastHeight) break;
          lastHeight = table.scrollHeight;
        }
      }
    };
    await scrollToBottom();

    // (3.3) 데이터 행만 가져오기
    const rows = document.querySelectorAll('div[role="row"]:not(:has(div[role="columnheader"]))');
    const reservations = [];

    for (const row of rows) {
      try {
        // 셀 가져오기
        const cells = row.querySelectorAll('div[role="cell"]');

        // 셀에서 data-field 속성을 기반으로 데이터 추출
        const getCellData = (field) => {
          const cell = Array.from(cells).find(cell => cell.getAttribute('data-field') === field);
          if (!cell) {
            console.warn(`Cell not found for data-field: ${field}, row HTML: ${row.innerHTML}`);
          }
          return cell;
        };

        // 예약번호
        const reservationNoCell = getCellData('reservationNo');
        let reservationNoRaw = reservationNoCell ? reservationNoCell.textContent.trim() : '';
        let reservationNo = reservationNoRaw.replace(/[^0-9]/g, ''); // 숫자만 남김
        let isAgoda = reservationNoRaw.includes('아고다'); // 아고다 경유 예약 여부 확인

        // 예약 상태
        const reservationStatusCell = getCellData('reservationStatus');
        const reservationStatus = reservationStatusCell ? reservationStatusCell.textContent.trim() : '';

        // 예약자 정보
        const visitorInfoCell = getCellData('visitorName');
        let customerName = '';
        let phoneNumber = '';
        let transportation = ''; // 차량/도보 정보 저장
        if (visitorInfoCell) {
          const visitorInfo = visitorInfoCell.textContent.trim();
          console.log(`[yanolja] visitorInfo for reservationNo ${reservationNo}: ${visitorInfo}`); // 디버깅 로그 추가

          // "안심번호 만료" 케이스 처리
          if (visitorInfo.includes('안심번호 만료')) {
            phoneNumber = ''; // 전화번호 없음
            const parts = visitorInfo.split('안심번호 만료');
            customerName = parts[0]?.trim() || '';
            transportation = parts[1]?.trim() || '';
            if (transportation) {
              customerName = `${customerName}(${transportation})`;
            }
          } else {
            // 아고다 경유 예약 여부에 따라 전화번호 형식 다르게 처리
            if (isAgoda) {
              // 아고다 경유 예약: 전화번호 형식이 "XXX-XXX-XX" (예: "164-413-46")
              const agodaPhonePattern = /\d{3}-\d{3}-\d{2}/;
              const agodaPhoneMatch = visitorInfo.match(agodaPhonePattern);
              if (agodaPhoneMatch) {
                phoneNumber = agodaPhoneMatch[0]; // 전화번호 추출 (예: "164-413-46")
                const parts = visitorInfo.split(phoneNumber);
                customerName = parts[0]?.trim() || ''; // 전화번호 앞부분: 이름
                transportation = parts[1]?.trim() || ''; // 전화번호 뒷부분: 차량/도보
              } else {
                console.warn(`[yanolja] No Agoda phone number found in visitorInfo for reservationNo ${reservationNo}`);
                customerName = visitorInfo;
                phoneNumber = '';
              }
            } else {
              // 일반 야놀자 예약: 전화번호 형식이 "0503-XXXX-XXXX" 또는 "0507-XXXX-XXXX"
              const phoneNumberPattern = /\d{4}-\d{4}-\d{4}/;
              let phoneMatch = visitorInfo.match(phoneNumberPattern);

              if (!phoneMatch) {
                // 하이픈 없는 경우 (예: "050350546373")를 처리
                const rawPhonePattern = /\d{12}/;
                const rawPhoneMatch = visitorInfo.match(rawPhonePattern);
                if (rawPhoneMatch) {
                  const rawPhone = rawPhoneMatch[0];
                  // 하이픈 추가: "050350546373" -> "0503-5054-6373"
                  phoneNumber = `${rawPhone.slice(0, 4)}-${rawPhone.slice(4, 8)}-${rawPhone.slice(8)}`;
                  const parts = visitorInfo.split(rawPhone);
                  customerName = parts[0]?.trim() || '';
                  transportation = parts[1]?.trim() || '';
                } else {
                  console.warn(`[yanolja] No phone number found in visitorInfo for reservationNo ${reservationNo}`);
                  customerName = visitorInfo;
                  phoneNumber = '';
                  // 차량/도보 정보 추출 시도
                  if (visitorInfo.includes('차량')) {
                    transportation = '차량';
                    customerName = visitorInfo.replace('차량', '').trim();
                  } else if (visitorInfo.includes('도보')) {
                    transportation = '도보';
                    customerName = visitorInfo.replace('도보', '').trim();
                  }
                }
              } else {
                phoneNumber = phoneMatch[0]; // 전화번호 추출 (예: "0503-5089-1322")
                const parts = visitorInfo.split(phoneNumber);
                customerName = parts[0]?.trim() || '';
                transportation = parts[1]?.trim() || '';
              }
            }

            // customerName에 (차량) 또는 (도보) 추가
            if (transportation) {
              customerName = `${customerName}(${transportation})`;
            }
          }

          // 추가 디버깅 로그
          console.log(`[yanolja] Parsed visitorInfo for reservationNo ${reservationNo}:`, {
            customerName,
            phoneNumber,
            transportation,
            rawVisitorInfo: visitorInfo
          });
        } else {
          console.warn(`visitorInfoCell not found for reservationNo: ${reservationNo}`);
        }

        // 객실정보
        const roomInfoCell = getCellData('roomInfo');
        const roomInfo = roomInfoCell ? roomInfoCell.textContent.trim() : '';

        // type 및 duration 설정
        let type = 'stay';
        let duration = null;
        if (roomInfo.includes('대실')) {
          type = 'dayUse';
          // "X시간" 패턴에서 시간 추출 (예: "8시간" → 8)
          const durationMatch = roomInfo.match(/(\d+)시간/);
          if (durationMatch) {
            duration = parseInt(durationMatch[1], 10);
          }
        }

        // 입실/퇴실일시
        let checkIn = '';
        let checkOut = '';
        const dateCell = getCellData('checkInOut');
        if (dateCell) {
          const spans = dateCell.querySelectorAll('span');
          if (spans.length >= 2) {
            checkIn = spans[0].textContent.trim();
            checkOut = spans[1].textContent.trim();
          } else {
            console.warn(`checkInOut spans not found for reservationNo: ${reservationNo}, innerHTML: ${dateCell.innerHTML}`);
            const dateText = dateCell.textContent.trim();
            const lines = dateText.split('\n').map((l) => l.trim());
            checkIn = lines[0] || '';
            checkOut = lines[1] || '';
          }
          if (checkIn) {
            const parsedCheckIn = dayjs(checkIn, 'YYYY.MM.DD(ddd) HH:mm');
            checkIn = parsedCheckIn.isValid() ? parsedCheckIn.format('YYYY-MM-DD HH:mm:ss') : checkIn;
          }
          if (checkOut) {
            const parsedCheckOut = dayjs(checkOut, 'YYYY.MM.DD(ddd) HH:mm');
            checkOut = parsedCheckOut.isValid() ? parsedCheckOut.format('YYYY-MM-DD HH:mm:ss') : checkOut;
          }
        }

        // 체크인/체크아웃이 없으면 예약을 스킵
        if (!checkIn || !checkOut) {
          console.warn(`Skipping reservation due to missing checkIn/checkOut: ${reservationNo}`);
          continue;
        }

        // 예약일시
        let reservationDate = '';
        const reservationDateCell = getCellData('reservationDate');
        if (reservationDateCell) {
          reservationDate = reservationDateCell.textContent.trim();
          const parsedReservationDate = dayjs(reservationDate, 'YYYY.MM.DD(ddd) HH:mm:ss');
          reservationDate = parsedReservationDate.isValid() ? parsedReservationDate.format('YYYY-MM-DD HH:mm:ss') : reservationDate;
        }

        // 금액 및 할인정보
        let price = 0;
        let couponInfo = [];
        const priceCell = getCellData('amountAndDiscountInfo');
        if (priceCell) {
          const priceText = priceCell.textContent.trim();
          const priceLines = priceText.split('\n').map((l) => l.trim());
          price = priceLines[0] ? parseInt(priceLines[0].replace('판매가 ', '').replace('원', '').replace(/,/g, ''), 10) || 0 : 0;
          for (let i = 2; i < priceLines.length; i += 2) {
            if (priceLines[i]?.startsWith('쿠폰')) {
              const couponAmount = priceLines[i].replace('쿠폰', '').replace('원', '').replace(/,/g, '');
              const couponName = priceLines[i + 1] || '';
              couponInfo.push({ amount: couponAmount, name: couponName });
            }
          }
        }

        // 결제 방법 (야놀자 사이트에서 직접 제공되지 않으므로 기본값 설정)
        const paymentMethod = 'OTA'; // 야놀자는 OTA로 간주

        const reservation = {
          reservationNo,
          reservationStatus,
          customerName,
          phoneNumber,
          roomInfo,
          checkIn,
          checkOut,
          reservationDate,
          price,
          couponInfo: couponInfo.length > 0 ? couponInfo : null,
          paymentMethod,
          isAgoda, // 아고다 경유 여부 추가
          type, // "stay" 또는 "dayUse"
          duration // null 또는 대실 시간 (예: 8)
        };

        if (reservation.reservationNo) {
          reservations.push(reservation);
        }
      } catch (rowError) {
        console.error(`[yanolja] Error parsing row for reservationNo ${reservationNo || 'unknown'}:`, rowError);
        continue; // 에러 발생 시 해당 행 스킵
      }
    }

    console.log('[yanolja] Extracted reservations:', reservations);

    if (!reservations.length) {
      console.log('[yanolja] No reservations found -> skip sending');
      return;
    }

    // (3.4) 예약 데이터 전송
    // _id를 생성하여 전송
    const reservationsWithId = reservations.map(reservation => ({
      ...reservation,
      _id: reservation.isAgoda
        ? `${siteName}-${reservation.reservationNo}(아고다)`
        : `${siteName}-${reservation.reservationNo}`
    }));

    await sendReservations(hotelId, siteName, reservationsWithId);
    console.log('[yanolja] Successfully sent reservations to server.');
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
  const startDate = dayjs().format('YYYY-MM-DD'); // 오늘 날짜
  const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD'); // 30일 후

  // (4.2) URL 이동
  const didNavigate = navigateToReservationURL(startDate, endDate);
  if (didNavigate) {
    return; // 페이지 이동 후 content script가 재주입될 것임
  }

  // (4.3) 예약 파싱 실행
  await parseYanoljaReservations(hotelId, siteName, endDate);
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
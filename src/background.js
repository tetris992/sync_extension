/****************************************
 * background.js (수정본, 전체 탭 나열 삭제)
 ****************************************/

// 확장 설치 시 로그 확인
chrome.runtime.onInstalled.addListener(() => {
  console.log('[background] extension installed');
});

function safeSendMessage(tabId, message, sendResponse, timeoutMs = 10000) {
  let responded = false;

  const timerId = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.error('[background] safeSendMessage TIMEOUT:', message.action);
      sendResponse({
        success: false,
        message: 'Content script 응답 타임아웃: ' + message.action,
      });
    }
  }, timeoutMs);

  chrome.tabs.sendMessage(tabId, message, (resp) => {
    if (responded) return;

    responded = true;
    clearTimeout(timerId);

    // chrome.runtime.lastError 체크
    if (chrome.runtime.lastError) {
      console.error(
        '[background] safeSendMessage lastError:',
        chrome.runtime.lastError.message
      );
      sendResponse({
        success: false,
        message: 'sendMessage error: ' + chrome.runtime.lastError.message,
      });
      return;
    }

    // content script 응답이 아예 없는 경우
    if (!resp) {
      console.error(
        '[background] safeSendMessage got empty resp:',
        message.action
      );
      sendResponse({
        success: false,
        message: 'No response from content script: ' + message.action,
      });
      return;
    }

    console.log('[background] safeSendMessage success resp:', resp);
    sendResponse({ success: true, ...resp });
  });
}

// (1) 외부(React 등)에서 오는 메시지 처리
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    // [A] 토큰 SET
    if (request.action === 'SET_TOKEN') {
      const { token } = request;
      console.log('[background] Received token from React:', token);

      chrome.storage.local.set({ accessToken: token }, () => {
        console.log('[background] accessToken stored in chrome.storage.local');
        sendResponse({ success: true });
      });

      return true;
    }

    // [B] "SET_OTA_TOGGLES" 액션 처리
    if (request.action === 'SET_OTA_TOGGLES') {
      const { toggles } = request;
      console.log('[background] Received SET_OTA_TOGGLES from React:', toggles);

      chrome.storage.local.set({ otaToggles: toggles }, () => {
        console.log('[background] otaToggles stored in chrome.storage.local');
        sendResponse({ success: true });
      });

      return true;
    }

    // [B1] 여기어때모텔
    else if (request.action === 'TRIGGER_GOODMOTEL_SCRAPE') {
      console.log('[background] Received TRIGGER_GOODMOTEL_SCRAPE:', request);
      const { hotelId } = request;

      // ad.goodchoice.kr 탭 찾기
      chrome.tabs.query({ url: 'https://ad.goodchoice.kr/*' }, (tabs) => {
        if (!tabs.length) {
          console.error(
            '[background] No active tab found for ad.goodchoice.kr/*'
          );
          sendResponse({
            success: false,
            message: '굿모텔(광고센터) 탭이 없거나 로그인 안됨',
          });
          return;
        }

        const targetTab = tabs[0];
        console.log('[background] Found GoodMotel tab:', targetTab.id);

        // safeSendMessage 사용
        safeSendMessage(
          targetTab.id,
          { action: 'SCRAPE_GOODMOTEL', hotelId },
          sendResponse
        );
      });
      return true;
    }

    // [B3] 굿호텔
    else if (request.action === 'TRIGGER_GOODHOTEL_SCRAPE') {
      console.log(
        '[background] Received TRIGGER_GOODHOTEL_SCRAPE action',
        request
      );
      const { hotelId } = request;

      // partner.goodchoice.kr 탭 찾기
      chrome.tabs.query(
        { url: 'https://partner.goodchoice.kr/*' },
        function (tabs) {
          if (!tabs.length) {
            console.error(
              '[background] No active tab found for partner.goodchoice.kr/*'
            );
            sendResponse({ success: false, message: 'No active tab found' });
            return;
          }

          const targetTab = tabs[0];
          console.log('[background] Found GoodHotel tab:', targetTab.id);

          chrome.tabs.sendMessage(
            targetTab.id,
            { action: 'SCRAPE_GOOD_HOTEL', hotelId },
            function (resp) {
              if (chrome.runtime.lastError) {
                console.error(
                  '[background] Error sending message to GoodHotel content script:',
                  chrome.runtime.lastError
                );
                sendResponse({
                  success: false,
                  message: chrome.runtime.lastError.message,
                });
              } else {
                console.log(
                  '[background] Response from GoodHotel content script:',
                  resp
                );
                sendResponse({ success: true, ...resp });
              }
            }
          );
        }
      );
      return true;
    }

    // [B4] 아고다(Agoda)
    else if (request.action === 'TRIGGER_AGODA_SCRAPE') {
      console.log('[background] TRIGGER_AGODA_SCRAPE:', request);
      const { hotelId, siteName, roomTypes } = request;

      // ycs.agoda.com/* 탭 찾기
      chrome.tabs.query({ url: 'https://ycs.agoda.com/*' }, (tabs) => {
        if (!tabs.length) {
          console.error('[background] No active tab found for ycs.agoda.com/*');
          sendResponse({
            success: false,
            message: '아고다(YCS) 탭이 없거나 로그인 안됨',
          });
          return;
        }

        const targetTab = tabs[0];
        console.log('[background] Found Agoda tab:', targetTab.id);

        safeSendMessage(
          targetTab.id,
          {
            action: 'SCRAPE_AGODA',
            hotelId,
            siteName: siteName || 'Agoda',
            roomTypes: roomTypes || [],
          },
          sendResponse
        );
      });
      return true;
    }

    // (★ 추가) [B4] 야놀자(Yanolja)
    else if (request.action === 'TRIGGER_YANOLJA_SCRAPE') {
      console.log('[background] TRIGGER_YANOLJA_SCRAPE:', request);
      const { hotelId } = request;

      // partner.yanolja.com 탭 찾기
      chrome.tabs.query({ url: 'https://partner.yanolja.com/*' }, (tabs) => {
        if (!tabs.length) {
          console.error(
            '[background] No active tab found for partner.yanolja.com/*'
          );
          sendResponse({
            success: false,
            message: '야놀자(제휴센터) 탭이 없거나 로그인 안됨',
          });
          return;
        }

        const targetTab = tabs[0];
        console.log('[background] Found Yanolja tab:', targetTab.id);

        safeSendMessage(
          targetTab.id,
          { action: 'SCRAPE_YANOLJA', hotelId },
          sendResponse
        );
      });
      return true;
    }

    // [B5] 부킹(Booking)
    else if (request.action === 'TRIGGER_BOOKING_SCRAPE') {
      console.log('[background] TRIGGER_BOOKING_SCRAPE:', request);
      const { hotelId, siteName, roomTypes } = request;

      // admin.booking.com/* 탭 찾기
      chrome.tabs.query({ url: 'https://admin.booking.com/*' }, (tabs) => {
        if (!tabs.length) {
          console.error(
            '[background] No active tab found for admin.booking.com/*'
          );
          sendResponse({
            success: false,
            message: '부킹(Booking) 탭이 없거나 로그인 안됨',
          });
          return;
        }

        const targetTab = tabs[0];
        console.log('[background] Found Booking tab:', targetTab.id);

        // (1) 이동할 URL 구성
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDateObj = new Date(today.getTime() + 30 * 86400000);
        const endDate = endDateObj.toISOString().split('T')[0];

        const finalURL =
          `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html` +
          `?upcoming_reservations=1&source=nav` +
          `&hotel_id=6876426` +
          `&lang=ko` +
          `&date_from=${startDate}` +
          `&date_to=${endDate}` +
          `&date_type=arrival`;

        // (2) 탭 이동
        chrome.tabs.update(targetTab.id, { url: finalURL }, (_updatedTab) => {
          if (chrome.runtime.lastError) {
            console.error(
              '[background] tabs.update error:',
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              message: chrome.runtime.lastError.message,
            });
            return;
          }

          // (3) onUpdated 리스너
          const handleUpdated = (tabId, changeInfo, tab) => {
            if (tabId === targetTab.id && changeInfo.status === 'complete') {
              console.log('[background] Booking tab fully loaded -> wait 3s');
              chrome.tabs.onUpdated.removeListener(handleUpdated);

              setTimeout(() => {
                safeSendMessage(
                  targetTab.id,
                  {
                    action: 'SCRAPE_BOOKING',
                    hotelId,
                    siteName: siteName || 'Booking',
                    roomTypes: roomTypes || [],
                  },
                  sendResponse
                );
              }, 3000);
            }
          };

          chrome.tabs.onUpdated.addListener(handleUpdated);
        });
      });
      return true;
    }

    // [B6] 익스피디아(Expedia)
    else if (request.action === 'TRIGGER_EXPEDIA_SCRAPE') {
      console.log('[background] TRIGGER_EXPEDIA_SCRAPE:', request);
      const { hotelId, siteName } = request;

      // 익스피디아 도메인 탭 찾기
      chrome.tabs.query(
        {
          url: [
            'https://www.expediapartnercentral.com/*',
            'https://apps.expediapartnercentral.com/*',
          ],
        },
        (tabs) => {
          if (!tabs.length) {
            console.error('[background] No tab found for Expedia domain');
            sendResponse({
              success: false,
              message: '익스피디아(Expedia) 탭이 없거나 로그인 안됨',
            });
            return;
          }

          const targetTab = tabs[0];
          console.log('[background] Found Expedia tab:', targetTab.id);

          // 예시 호텔 ID
          const fallbackExpediaId = '59872761';
          const finalExpediaURL = `https://apps.expediapartnercentral.com/lodging/bookings?htid=${fallbackExpediaId}`;

          // 탭 이동
          chrome.tabs.update(targetTab.id, { url: finalExpediaURL }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                '[background] tabs.update error:',
                chrome.runtime.lastError
              );
              sendResponse({
                success: false,
                message: chrome.runtime.lastError.message,
              });
              return;
            }

            // 로딩 완료 감지
            const handleUpdated = (tabId, changeInfo, tab) => {
              if (tabId === targetTab.id && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(handleUpdated);

                setTimeout(() => {
                  console.log(
                    '[background] Expedia page loaded => SCRAPE_EXPEDIA'
                  );
                  safeSendMessage(
                    targetTab.id,
                    { action: 'SCRAPE_EXPEDIA', hotelId, siteName },
                    sendResponse
                  );
                }, 3000);
              }
            };

            chrome.tabs.onUpdated.addListener(handleUpdated);
          });
        }
      );
      return true; // 비동기
    }

    // (★ 추가) [B7] 쿨스테이(CoolStay) 스크래핑
    else if (request.action === 'TRIGGER_COOLSTAY_SCRAPE') {
      console.log('[background] TRIGGER_COOLSTAY_SCRAPE:', request);
      const { hotelId, siteName } = request;

      // 1) pms.coolstay.co.kr 탭 찾기
      chrome.tabs.query({ url: 'https://pms.coolstay.co.kr/*' }, (tabs) => {
        if (!tabs.length) {
          console.error(
            '[background] No active tab found for pms.coolstay.co.kr/*'
          );
          sendResponse({
            success: false,
            message: '쿨스테이 탭이 없거나 로그인 안됨',
          });
          return;
        }

        const targetTab = tabs[0];
        console.log('[background] Found CoolStay tab:', targetTab.id);

        // 2) 이번 달 1일~말일을 구해 finalURL 생성
        const now = new Date();
        const startDate = formatYMD(
          new Date(now.getFullYear(), now.getMonth(), 1)
        );
        const endDate = formatYMD(
          new Date(now.getFullYear(), now.getMonth() + 1, 0)
        );

        const finalURL =
          `https://pms.coolstay.co.kr/motel-biz-pc/reservation?&page=1` +
          `&searchType=ST602,ST608` +
          `&searchExtra=${startDate}|${endDate},` +
          `&sort=BOOK_DESC&tabState=0` +
          `&selectSort=0&selectChannelOut=0` +
          `&selectDateRange=customInput&selectEnterType=0`;

        // 3) 탭 이동
        chrome.tabs.update(targetTab.id, { url: finalURL }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              '[background] tabs.update error:',
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              message: chrome.runtime.lastError.message,
            });
            return;
          }

          // 4) onUpdated 로딩 완료 감지
          const handleUpdated = (tabId, changeInfo, tab) => {
            if (tabId === targetTab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(handleUpdated);

              setTimeout(() => {
                safeSendMessage(
                  targetTab.id,
                  {
                    action: 'SCRAPE_COOLSTAY',
                    hotelId,
                    siteName: siteName || 'CoolStay',
                  },
                  sendResponse
                );
              }, 3000);
            }
          };
          chrome.tabs.onUpdated.addListener(handleUpdated);
        });
      });

      return true;
    }

    function formatYMD(dateObj) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    }

    return false;
  }
);

// (2) 내부 메시지 처리
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'GET_TOKEN') {
    chrome.storage.local.get('accessToken', (res) => {
      sendResponse({ accessToken: res.accessToken || '' });
    });
    return true;
  }

  if (req.action === 'GET_OTA_TOGGLES') {
    console.log('[background] GET_OTA_TOGGLES request received');
    chrome.storage.local.get(['otaToggles'], (res) => {
      sendResponse({ otaToggles: res.otaToggles || {} });
    });
    return true;
  }

  return false;
});

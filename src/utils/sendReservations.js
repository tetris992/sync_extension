// 파일: ota-scraper-extension/src/utils/sendReservations.js
/* global chrome */
// 토큰을 chrome.storage.local에서 읽는 함수
function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], (res) => {
      resolve(res.accessToken || '');
    });
  });
}

export async function sendReservations(hotelId, siteName, reservations) {
  const API_BASE_URL = process.env.BACKEND_API_URL; // ex) 'http://localhost:3003'

  // (1) chrome.storage.local에서 액세스 토큰 가져오기
  const accessToken = await getStoredToken();
  console.log('[sendReservations] using token:', accessToken);

  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`, // ← 헤더에 붙이기
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 혹시 쿠키 사용한다면
      body: JSON.stringify({
        siteName,
        reservations,
        hotelId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    console.log(
      `[sendReservations] Sent reservations to ${API_BASE_URL}, hotelId=${hotelId}`
    );
    return true;
  } catch (error) {
    console.error('[sendReservations] Failed:', error);
    return false;
  }
}

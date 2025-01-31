// 파일: ota-scraper-extension/src/utils/sendReservations.js
/* global chrome */
function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], (res) => {
      resolve(res.accessToken || '');
    });
  });
}

export async function sendReservations(hotelId, siteName, reservations) {
  const API_BASE_URL = process.env.BACKEND_API_URL; 
  const accessToken = await getStoredToken();
  console.log('[sendReservations] using token:', accessToken);

  if (siteName === 'Agoda') {
    reservations = reservations.map((r) => {
      if (r.checkIn instanceof Date) {
        const inTime = r.checkIn.getTime() + 9 * 60 * 60 * 1000;
        r.checkIn = new Date(inTime);
      }
      if (r.checkOut instanceof Date) {
        const outTime = r.checkOut.getTime() + 9 * 60 * 60 * 1000;
        r.checkOut = new Date(outTime);
      }
      return r;
    });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',

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

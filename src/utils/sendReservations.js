/* global chrome */
import { API_BASE_URL } from './config';

function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['accessToken'], (res) => {
      console.log('[sendReservations] Stored tokens:', res);
      resolve({ accessToken: res.accessToken || '' });
    });
  });
}

export async function sendReservations(
  hotelId,
  siteName,
  reservations,
  providedAccessToken = null
) {
  const { accessToken: storedAccessToken } = providedAccessToken
    ? { accessToken: providedAccessToken }
    : await getStoredToken();
  const accessToken = storedAccessToken;

  console.log('[sendReservations] Using token:', { accessToken });

  if (!accessToken) {
    console.error('[sendReservations] No access token available');
    throw new Error('No access token available. Please log in via frontend.');
  }

  try {
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

    const response = await fetch(`${API_BASE_URL}/api/reservations-extension`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ siteName, reservations, hotelId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        '[sendReservations] Server error:',
        response.status,
        errorText
      );
      throw new Error(
        `Server responded with status ${response.status}: ${errorText}`
      );
    }

    console.log(
      `[sendReservations] Sent reservations to ${API_BASE_URL}/api/reservations-extension, hotelId=${hotelId}`
    );
    return true;
  } catch (error) {
    console.error('[sendReservations] Failed:', error);
    return false;
  }
}

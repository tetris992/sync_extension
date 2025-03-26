export const API_BASE_URL =
  process.env.BACKEND_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3004'
    : 'https://staysync.org');

console.log('[config.js] API_BASE_URL:', API_BASE_URL);
console.log('[config.js] NODE_ENV:', process.env.NODE_ENV);
console.log('[config.js] BACKEND_API_URL:', process.env.BACKEND_API_URL);
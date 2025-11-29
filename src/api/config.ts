export const GOOGLE_SHEETS_API_SERVER_URL =
  process.env.GOOGLE_SHEETS_API_SERVER_URL ||
  (process.env.NODE_ENV === 'production' ? `http://localhost:${process.env.PORT || 3000}` : 'http://localhost:3001');


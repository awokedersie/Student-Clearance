import axios from 'axios';

/**
 * Central axios instance.
 * - In development: VITE_API_URL is unset → baseURL is '' → proxy in vite.config.ts handles it.
 * - In production (Vercel): baseURL is '' → all API calls go to the same origin.
 *   Vercel rewrites in vercel.json forward /admin/*, /login, /student/*, etc.
 *   to the backend, so cookies work same-origin.
 */
const api = axios.create({
  baseURL: '',
  withCredentials: true, // Send session cookies
});

export default api;

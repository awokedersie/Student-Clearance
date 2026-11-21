import axios from 'axios';

/**
 * Central axios instance.
 * - In development: VITE_API_URL is unset → baseURL is '' → proxy in vite.config.ts handles it.
 * - In production (Vercel): VITE_API_URL points to the Railway/Render backend URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Send session cookies cross-origin
});

export default api;

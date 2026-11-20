import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/student': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/admin': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/registrar': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/protector': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/uploads': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/forgot-password': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/verify-code': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
      '/reset-password': {
        target: 'http://localhost:3000',
        bypass: (req, res, options) => {
          if (req.headers.accept?.includes('text/html')) {
            return req.url;
          }
        }
      },
    }
  }
})

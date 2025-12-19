import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': 'http://localhost:3000',
      '/student': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/registrar': 'http://localhost:3000',
      '/protector': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/forgot-password': 'http://localhost:3000',
      '/verify-code': 'http://localhost:3000',
      '/reset-password': 'http://localhost:3000',
    }
  }
})

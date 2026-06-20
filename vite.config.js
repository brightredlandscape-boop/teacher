import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: (process.env.NODE_ENV === 'production' && !process.env.VERCEL) ? '/EduBridge/' : '/',
  plugins: [react()],
  server: {
    allowedHosts: ['.loca.lt', '.ngrok-free.app', '.ngrok-free.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    allowedHosts: ['.loca.lt', '.ngrok-free.app', '.ngrok-free.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

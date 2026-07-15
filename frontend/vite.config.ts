import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Forward all /api requests to the Bun backend in dev
      '/api': {
        target: 'https://campus-market-ttui.onrender.com/',
        changeOrigin: true,
      },
    },
  },
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/zlide/' : '/',
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
}))

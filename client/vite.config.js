import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    minify: 'esbuild',
    sourcemap: false, // Prevents easy inspection of frontend code in production
  },
  esbuild: {
    drop: ['console', 'debugger'], // Strips console logs and debuggers from prod builds
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})

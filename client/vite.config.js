import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false, // Prevents easy inspection of frontend code in production
  },
  server: {
    host: !!process.env.VITE_PROXY_URL,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_URL || 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 50,
        branches: 60,
        statements: 70
      }
    }
  },
  preview: {
    host: !!process.env.VITE_PROXY_URL,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['socket.io-client'],
    include: ['debug']
  }
})

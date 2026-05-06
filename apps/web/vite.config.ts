import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    proxy: {
      '/api/bus': {
        target: 'http://ws.bus.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bus/, '/api/rest'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})

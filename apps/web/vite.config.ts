import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), svgr()],
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
    env: {
      VITE_NAVER_MAP_CLIENT_ID: 'test-naver-client-id',
      VITE_BUS_API_SERVICE_KEY: 'test-bus-service-key',
      VITE_BUS_API_BASE_URL: 'http://localhost/api/bus',
    },
  },
});

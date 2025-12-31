import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy all /api requests to backend
      '/api': {
        target: 'https://server1.prolianceltd.com',
        changeOrigin: true,  // Changes origin header to match target (helps with CORS)
        secure: false,       // For HTTP in dev
        rewrite: (path) => path.replace(/^\/api/, '/api'),  // Keep /api prefix if needed
      },
    },
  },
});
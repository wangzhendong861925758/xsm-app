import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api/ai-proxy': {
        target: 'https://token.xinhankr.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-proxy/, ''),
      },
      '/api': {
        target: 'https://imaginative-axolotl-edc12e.netlify.app',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'word-parser': ['mammoth'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths()
  ],
})

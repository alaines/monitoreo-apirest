import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/core': path.resolve(__dirname, './src/core'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'apps.movingenia.com',
      'localhost',
      '192.168.18.230',
      '34.66.18.138'
    ],
    proxy: {
      '/api': {
        target: 'http://192.168.18.230:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.18.230:3001',
        ws: true,
      },
    },
  },
});

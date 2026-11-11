import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(currentDir, 'src'),
      // Общий с сервером модуль лежит рядом с клиентом и импортируется как исходники.
      '@shared': path.resolve(projectRoot, 'shared/src'),
    },
  },
  server: {
    port: 5173,
    // В dev фронт ходит в API через прокси — так не нужен CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    fs: {
      allow: [projectRoot],
    },
  },
});

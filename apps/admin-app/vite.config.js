import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uiu/ui': path.resolve(__dirname, '../../packages/ui')
    }
  },
  server: {
    port: 5174
  }
});


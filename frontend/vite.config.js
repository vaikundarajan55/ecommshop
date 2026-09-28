import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  // Build straight into the backend so it serves the website + admin on its own port
  build: {
    outDir: '../backend/dist',
    emptyOutDir: true,
  },
});

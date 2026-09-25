import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  // Production build goes straight into the backend, which serves it on its own port
  build: {
    outDir: '../backend/public',
    emptyOutDir: true,
  },
});

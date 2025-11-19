import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 8080,
    host: true,
    allowedHosts: ['cader-8kvsl.ondigitalocean.app', 'https://getcader.com'],
  },
});

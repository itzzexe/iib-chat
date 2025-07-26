import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'simple-peer',
      'webrtc-adapter',
      'react-big-calendar'
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'events': 'events',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process',
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      'os': 'os-browserify/browser',
      'path': 'path-browserify',
      'fs': false,
      'net': false,
      'tls': false,
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'simple-peer',
      'webrtc-adapter',
      'react-big-calendar',
      'events',
      'util',
      'buffer',
      'process',
      'stream-browserify',
      'crypto-browserify',
      'os-browserify',
      'path-browserify',
      'readable-stream'
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'events': 'events',
      'util': 'util',
      'buffer': 'buffer',
      'process': 'process/browser',
      'stream': 'stream-browserify',
      'crypto': 'crypto-browserify',
      'os': 'os-browserify/browser',
      'path': 'path-browserify',
      'fs': false,
      'net': false,
      'tls': false,
    },
  },
  define: {
    global: 'globalThis',
    'process.env': 'process.env',
    // Suppress util module warnings
    'process.env.NODE_DEBUG': 'false',
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        globals: {
          'util': 'util'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: [],
    include: [
      'simple-peer',
      'webrtc-adapter',
      'react-big-calendar',
      'events',
      'buffer',
      'util',
      'stream-browserify',
      'crypto-browserify',
      'os-browserify',
      'path-browserify'
    ],
  },
  server: {
    port: 5173,
    host: true,
  },
});

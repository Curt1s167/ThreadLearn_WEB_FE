import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      // REST API
      '/api':       { target: 'http://localhost:5000', changeOrigin: true },
      // Socket.IO handshake + transport (covers polling + websocket upgrade).
      // The namespace `/notifications` is sent in the handshake query — we do NOT
      // proxy `/notifications` itself because it collides with the FE route.
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
  build: {
    // Split heavy vendor chunks to keep main bundle under the 500 KB warning.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'monaco':          ['@monaco-editor/react'],
          'markdown':        ['react-markdown', 'remark-gfm', 'rehype-highlight'],
          'motion':          ['framer-motion'],
          'query':           ['@tanstack/react-query', 'axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

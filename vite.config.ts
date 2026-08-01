// vite.config.ts
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // ✅ Séparer les gros bundles
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('framer-motion')) {
              return 'animation';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }
            // Le reste
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});
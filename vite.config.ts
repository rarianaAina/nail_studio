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
    // ✅ Activer le code splitting CSS
    cssCodeSplit: true,
    // ✅ Minification
    minify: 'esbuild',
    // ✅ Sourcemap pour le debug
    sourcemap: false,
    rollupOptions: {
      output: {
        // ✅ Séparer le CSS critique du reste
        manualChunks: {
          // Regrouper les librairies tierces
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@/components/ui'],
        },
        // ✅ Nom des fichiers pour le cache
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // ✅ Compression des assets
    assetsInlineLimit: 4096,
    // ✅ Taille de chunk
    chunkSizeWarningLimit: 1000,
  },
  // ✅ Optimisation du serveur de dev
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});
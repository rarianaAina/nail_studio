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
        // Sans découpage explicite, Rollup regroupait Recharts avec le hook de
        // statistiques : ouvrir le tableau de bord téléchargeait 412 ko de
        // librairie graphique dans un fragment qui changeait à chaque
        // modification du code métier, invalidant le cache du navigateur.
        // Isoler les grosses librairies tierces leur donne un fragment stable,
        // conservé d'une mise en production à l'autre.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
          charts: ['recharts'],
        },
      },
    },
  },
});

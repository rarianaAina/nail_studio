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
        // Isoler les grosses librairies tierces leur donne un fragment stable,
        // conservé d'une mise en production à l'autre plutôt qu'invalidé à
        // chaque modification du code métier.
        //
        // Recharts en est volontairement exclu. Déclarer un fragment manuel le
        // fait entrer dans le graphe initial : Vite émet alors un
        // `modulepreload` dans index.html, et les 119 Ko de la librairie
        // graphique étaient téléchargés sur toutes les pages — y compris
        // l'accueil public, qui n'affiche aucun graphique. Laissé à Rollup, il
        // reste dans le fragment des pages d'administration, chargées à la
        // demande.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});

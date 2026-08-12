import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Le service worker se met à jour sans intervention : une praticienne ne
      // doit pas avoir à réinstaller l'application après chaque déploiement.
      registerType: 'autoUpdate',
      // Service worker écrit à la main : la génération automatique ne permet
      // pas d'ajouter les gestionnaires de notifications.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Harrys Studio — Salon d\'onglerie',
        short_name: 'Harrys Studio',
        description:
          'Prenez rendez-vous en ligne et suivez vos soins. Espace de gestion pour le salon.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f3',
        theme_color: '#b9834d',
        categories: ['beauty', 'lifestyle'],
        icons: [
          { src: '/icons/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icone-512.png', sizes: '512x512', type: 'image/png' },
          // Android rogne l'icône selon la forme du lanceur : la variante
          // « maskable » ménage une marge pour que le logo ne soit pas amputé.
          {
            src: '/icons/icone-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Prendre rendez-vous', url: '/reservation' },
          { name: 'Mon espace', url: '/mon-espace' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,png}'],
      },
      devOptions: { enabled: false },
    }),
  ],
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

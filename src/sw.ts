/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

/**
 * Service worker de l'application.
 *
 * Écrit à la main plutôt que généré : la génération automatique ne permet pas
 * d'ajouter les gestionnaires de notifications, qui sont l'objet même de ce
 * fichier. La partie mise en cache reproduit à l'identique le comportement
 * précédent.
 */

// La liste des fichiers à précharger est injectée à la construction.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Images du salon : elles changent rarement et pèsent lourd.
registerRoute(
  ({ url }) => /\.supabase\.co$/.test(url.hostname) && url.pathname.includes('/storage/'),
  new CacheFirst({
    cacheName: 'images-salon',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
);

// Polices : immuables une fois téléchargées.
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'polices',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
);

// Les appels à l'API ne sont volontairement jamais mis en cache : un créneau
// réservé doit disparaître immédiatement, et un rendez-vous servi depuis le
// cache induirait la praticienne en erreur.

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

interface ContenuNotification {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

self.addEventListener('push', (event) => {
  let contenu: ContenuNotification = {
    title: 'Harrys Studio',
    body: 'Vous avez une nouvelle notification.',
  };

  // Une charge utile illisible ne doit pas faire disparaître la notification :
  // mieux vaut un message générique que rien du tout.
  try {
    if (event.data) contenu = { ...contenu, ...(event.data.json() as ContenuNotification) };
  } catch {
    if (event.data) contenu.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(contenu.title, {
      body: contenu.body,
      icon: '/icons/icone-192.png',
      badge: '/icons/icone-192.png',
      // Deux réservations successives donnent deux notifications distinctes,
      // sauf si l'émetteur fournit lui-même une étiquette de regroupement.
      tag: contenu.tag,
      data: { url: contenu.url ?? '/admin/rendez-vous' },
      requireInteraction: false,
      // `vibrate` est pris en charge par Android mais absent des types du DOM.
      ...({ vibrate: [120, 60, 120] } as Record<string, unknown>),
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cible = (event.notification.data?.url as string) ?? '/';

  event.waitUntil(
    (async () => {
      const fenetres = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Réutiliser un onglet déjà ouvert plutôt que d'en empiler un nouveau.
      for (const fenetre of fenetres) {
        if (new URL(fenetre.url).origin === self.location.origin) {
          await fenetre.focus();
          if ('navigate' in fenetre) await fenetre.navigate(cible);
          return;
        }
      }

      await self.clients.openWindow(cible);
    })()
  );
});

// Le navigateur peut révoquer un abonnement : il faut alors se réabonner,
// sans quoi la praticienne cesse silencieusement d'être notifiée.
self.addEventListener('pushsubscriptionchange', (evenement) => {
  const event = evenement as ExtendableEvent & { oldSubscription?: PushSubscription };
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      clients.forEach((c) =>
        c.postMessage({ type: 'abonnement-push-perdu', ancien: event.oldSubscription?.endpoint })
      );
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

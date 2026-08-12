import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration partagée du cache de données.
 *
 * Les hooks rechargeaient leurs données à chaque montage, sans cache : ouvrir
 * la page de réservation déclenchait six requêtes simultanées, et chaque
 * navigation les rejouait à l'identique.
 *
 * Les valeurs ci-dessous sont calibrées pour un salon : le catalogue, les
 * horaires et les moyens de paiement changent quelques fois par mois, pas
 * quelques fois par minute.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Données considérées fraîches pendant 5 minutes : revenir sur une page
      // déjà visitée n'entraîne aucune requête.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,

      // Trois tentatives espacées. La connexion du salon coupe sous les
      // rafales de requêtes parallèles ; sans reprise, l'échec d'une seule
      // requête laissait une page vide définitivement.
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),

      // Éviter les rechargements surprises au retour sur l'onglet.
      refetchOnWindowFocus: false,
    },
  },
});

/** Clés de cache, centralisées pour éviter les divergences d'invalidation. */
export const queryKeys = {
  services: ['services'] as const,
  appointments: ['appointments'] as const,
  clients: ['clients'] as const,
  settings: ['settings'] as const,
  appointmentSettings: ['appointment-settings'] as const,
  paymentMethods: ['payment-methods'] as const,
  config: ['config'] as const,
  specialInfos: ['special-infos'] as const,
  gallery: ['gallery'] as const,
  reviews: ['reviews'] as const,
  stats: ['stats'] as const,
  reminders: ['reminders'] as const,
  reminderSettings: ['reminder-settings'] as const,
  loyalty: (userId?: string) => ['loyalty', userId] as const,
} as const;

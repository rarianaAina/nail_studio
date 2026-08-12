import { useMemo } from 'react';
import type { Appointment, ReferenceImage } from '@/types';
import { appointmentService } from '@/services/appointmentService';
import { useResource } from './useResource';

const EMPTY: Appointment[] = [];

export interface ClientHistory {
  appointments: Appointment[];
  /** Photos de toutes les visites, de la plus récente à la plus ancienne. */
  photos: Array<ReferenceImage & { appointmentId: string; date: string }>;
  completedCount: number;
  cancelledCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Historique d'une cliente : ses rendez-vous et les photos qu'elle a déposées
 * au fil des visites.
 *
 * Les photos étaient jusqu'ici enfermées dans le rendez-vous qui les portait.
 * Les rassembler donne à la praticienne la réponse à la question qu'elle pose
 * à chaque visite — « qu'est-ce que je vous avais fait la dernière fois ? ».
 *
 * La requête est passée par clé pour que chaque cliente ait son propre cache :
 * rouvrir une fiche déjà consultée n'entraîne aucun appel.
 */
export function useClientHistory(clientId?: string): ClientHistory {
  const { data: appointments, loading, error } = useResource(
    ['client-history', clientId ?? 'none'],
    () => (clientId ? appointmentService.getByClientId(clientId) : Promise.resolve(EMPTY)),
    EMPTY
  );

  const photos = useMemo(
    () =>
      appointments.flatMap((a) =>
        (a.referenceImages ?? []).map((img) => ({
          ...img,
          appointmentId: a.id,
          date: a.date,
        }))
      ),
    [appointments]
  );

  return {
    appointments,
    photos,
    completedCount: appointments.filter((a) => a.status === 'completed').length,
    cancelledCount: appointments.filter((a) => a.status === 'cancelled').length,
    loading: clientId ? loading : false,
    error,
  };
}

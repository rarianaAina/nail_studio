import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';
import { useResource } from './useResource';

const EMPTY: string[] = [];

/**
 * Créneaux réellement libres pour une date et une durée données.
 *
 * La durée conditionne la disponibilité : un créneau libre pour une manucure
 * de 30 min ne l'est pas forcément pour une pose de 2h30. C'est le serveur qui
 * tranche — `get_available_times` connaît les rendez-vous déjà pris, le temps
 * de préparation et les créneaux configurés pour cette date.
 *
 * Renvoie une liste vide sans date ni prestation : il n'y a alors rien à
 * demander au serveur.
 */
export function useAvailableSlots(date: string, dureeMinutes: number) {
  const { data, loading, error, refresh } = useResource(
    queryKeys.availableSlots(date, dureeMinutes),
    async () => {
      if (!date || dureeMinutes <= 0) return EMPTY;

      const { data, error } = await supabase.rpc('get_available_times', {
        p_date: date,
        p_duration_minutes: dureeMinutes,
      });
      if (error) throw error;

      return (data as { slot_label: string }[] | null)?.map((r) => r.slot_label) ?? EMPTY;
    },
    EMPTY,
    // La disponibilité change dès qu'une cliente réserve : un cache long
    // ferait proposer un créneau déjà pris, refusé ensuite à l'enregistrement.
    { staleTime: 15 * 1000, refetchOnMount: 'always' }
  );

  return { slots: data, loading, error, refresh };
}

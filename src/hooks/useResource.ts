import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

/**
 * Socle commun aux hooks de données.
 *
 * Tous suivaient le même motif — `useState` + `useEffect` rechargeant à chaque
 * montage — ce qui rejouait les mêmes requêtes à chaque navigation et
 * multipliait les appels lorsqu'une page utilisait plusieurs hooks.
 *
 * L'interface publique (`data`, `loading`, `error`, `refresh`) reproduit celle
 * des hooks précédents afin qu'aucune page n'ait à changer.
 */
interface ResourceOptions {
  /** Durée pendant laquelle la donnée est tenue pour fraîche, en millisecondes. */
  staleTime?: number;
  /** 'always' force une relecture à chaque montage, cache ou non. */
  refetchOnMount?: boolean | 'always';
}

export function useResource<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  fallback: T,
  options?: ResourceOptions
) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: key,
    queryFn: fetcher,
    ...options,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    data: data ?? fallback,
    loading: isPending,
    error: error ? (error instanceof Error ? error.message : 'Erreur de chargement') : null,
    refresh,
  };
}

/**
 * Applique le résultat d'une mutation directement dans le cache.
 *
 * Les hooks mettaient à jour leur état local après chaque écriture, sans
 * relire le serveur. Écrire dans le cache plutôt qu'invalider la clé conserve
 * ce comportement : aucune requête supplémentaire n'est déclenchée.
 */
export function useCacheWriter<T>(key: QueryKey, fallback: T) {
  const client = useQueryClient();
  return useMemo(
    () => (updater: (current: T) => T) => {
      client.setQueryData<T>(key, (current) => updater(current ?? fallback));
    },
    // La clé est un littéral stable défini dans queryKeys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client]
  );
}

/** Variante hors composant, pour les services appelés en dehors de React. */
export function writeCache<T>(key: QueryKey, updater: (current: T | undefined) => T) {
  queryClient.setQueryData<T>(key, (current) => updater(current));
}

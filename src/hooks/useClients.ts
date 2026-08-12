import type { Client, CreateClientDto } from '@/types';
import { clientService } from '@/services/clientService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

interface ClientAggregates {
  totalClients: number;
  totalVisits: number;
  totalRevenue: number;
}

interface UseClientsReturn {
  clients: Client[];
  aggregates: ClientAggregates;
  loading: boolean;
  error: string | null;
  createClient: (data: CreateClientDto) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

interface ClientsBundle {
  clients: Client[];
  aggregates: ClientAggregates;
}

const EMPTY: ClientsBundle = {
  clients: [],
  aggregates: { totalClients: 0, totalVisits: 0, totalRevenue: 0 },
};

export function useClients(): UseClientsReturn {
  const { data, loading, error, refresh } = useResource(
    queryKeys.clients,
    async (): Promise<ClientsBundle> => {
      const [clients, aggregates] = await Promise.all([
        clientService.getAll(),
        clientService.getAggregates(),
      ]);
      return { clients, aggregates };
    },
    EMPTY
  );
  const write = useCacheWriter<ClientsBundle>(queryKeys.clients, EMPTY);

  const createClient = async (data: CreateClientDto) => {
    const created = await clientService.create(data);
    write((prev) => ({ ...prev, clients: [...prev.clients, created] }));
    return created;
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    const updated = await clientService.update(id, data);
    write((prev) => ({
      ...prev,
      clients: prev.clients.map((c) => (c.id === id ? updated : c)),
    }));
  };

  const deleteClient = async (id: string) => {
    await clientService.delete(id);
    write((prev) => ({ ...prev, clients: prev.clients.filter((c) => c.id !== id) }));
  };

  return {
    clients: data.clients,
    aggregates: data.aggregates,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refresh,
  };
}

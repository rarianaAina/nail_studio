import { useCallback, useEffect, useState } from 'react';
import type { Client, CreateClientDto } from '@/types';
import { clientService } from '@/services/clientService';

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

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [aggregates, setAggregates] = useState<ClientAggregates>({
    totalClients: 0,
    totalVisits: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [data, agg] = await Promise.all([
        clientService.getAll(),
        clientService.getAggregates(),
      ]);
      setClients(data);
      setAggregates(agg);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createClient = async (data: CreateClientDto) => {
    const created = await clientService.create(data);
    setClients((prev) => [...prev, created]);
    return created;
  };

  const updateClient = async (id: string, data: Partial<Client>) => {
    const updated = await clientService.update(id, data);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const deleteClient = async (id: string) => {
    await clientService.delete(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    clients,
    aggregates,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refresh: load,
  };
}

import type { Client, CreateClientDto } from '@/types';
import { mockClients } from '@/data/mock/clients';

let store: Client[] = [...mockClients];

export const clientService = {
  /**
   * Fetch all clients.
   * Firebase: getDocs(collection(db, 'clients'))
   */
  getAll: async (): Promise<Client[]> => {
    return [...store];
  },

  /**
   * Fetch a single client by id.
   * Firebase: getDoc(doc(db, 'clients', id))
   */
  getById: async (id: string): Promise<Client | null> => {
    return store.find((c) => c.id === id) ?? null;
  },

  /**
   * Search clients by name or phone.
   * Firebase: query with startAt/endAt on name field
   */
  search: async (query: string): Promise<Client[]> => {
    const q = query.toLowerCase();
    return store.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  },

  /**
   * Create a new client.
   * Firebase: addDoc(collection(db, 'clients'), data)
   */
  create: async (data: CreateClientDto): Promise<Client> => {
    const client: Client = {
      ...data,
      id: 'c-' + Date.now(),
      lastVisit: new Date().toISOString().slice(0, 10),
      visitCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    store.push(client);
    return client;
  },

  /**
   * Update client fields.
   * Firebase: updateDoc(doc(db, 'clients', id), data)
   */
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Client ${id} not found`);
    store[idx] = { ...store[idx], ...data };
    return store[idx];
  },

  /**
   * Delete a client.
   * Firebase: deleteDoc(doc(db, 'clients', id))
   */
  delete: async (id: string): Promise<void> => {
    store = store.filter((c) => c.id !== id);
  },

  getAggregates: async (): Promise<{
    totalClients: number;
    totalVisits: number;
    totalRevenue: number;
  }> => {
    return {
      totalClients: store.length,
      totalVisits: store.reduce((s, c) => s + c.visitCount, 0),
      totalRevenue: store.reduce((s, c) => s + c.totalSpent, 0),
    };
  },
};

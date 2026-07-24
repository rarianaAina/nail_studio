import type { Service, CreateServiceDto } from '@/types';
import { mockServices } from '@/data/mock/services';

let store: Service[] = [...mockServices];

export const nailServiceService = {
  /**
   * Fetch all services.
   * Firebase: getDocs(collection(db, 'services'))
   */
  getAll: async (): Promise<Service[]> => {
    return [...store];
  },

  /**
   * Fetch only active / popular services.
   * Firebase: query(collection(db, 'services'), where('popular', '==', true))
   */
  getPopular: async (): Promise<Service[]> => {
    return store.filter((s) => s.popular);
  },

  /**
   * Fetch by category.
   * Firebase: query(collection(db, 'services'), where('category', '==', category))
   */
  getByCategory: async (category: string): Promise<Service[]> => {
    return store.filter((s) => s.category === category);
  },

  /**
   * Fetch a single service by id.
   * Firebase: getDoc(doc(db, 'services', id))
   */
  getById: async (id: string): Promise<Service | null> => {
    return store.find((s) => s.id === id) ?? null;
  },

  /**
   * Create a new service.
   * Firebase: addDoc(collection(db, 'services'), data)
   */
  create: async (data: CreateServiceDto): Promise<Service> => {
    const service: Service = {
      ...data,
      id: 'svc-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    store.push(service);
    return service;
  },

  /**
   * Update a service.
   * Firebase: updateDoc(doc(db, 'services', id), data)
   */
  update: async (id: string, data: Partial<Service>): Promise<Service> => {
    const idx = store.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Service ${id} not found`);
    store[idx] = { ...store[idx], ...data };
    return store[idx];
  },

  /**
   * Delete a service.
   * Firebase: deleteDoc(doc(db, 'services', id))
   */
  delete: async (id: string): Promise<void> => {
    store = store.filter((s) => s.id !== id);
  },
};

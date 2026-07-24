import type { SalonSettings } from '@/types';
import { mockSalonSettings } from '@/data/mock/settings';

let store: SalonSettings = { ...mockSalonSettings };

export const settingsService = {
  /**
   * Fetch salon settings.
   * Firebase: getDoc(doc(db, 'settings', 'salon'))
   */
  get: async (): Promise<SalonSettings> => {
    return { ...store };
  },

  /**
   * Update salon settings.
   * Firebase: setDoc(doc(db, 'settings', 'salon'), data, { merge: true })
   */
  update: async (data: Partial<SalonSettings>): Promise<SalonSettings> => {
    store = {
      ...store,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return { ...store };
  },
};

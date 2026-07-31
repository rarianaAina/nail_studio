// hooks/useLoyalty.ts
import { useCallback, useEffect, useState } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import type { LoyaltySettings } from '@/types';

interface UseLoyaltyReturn {
  points: number;
  settings: LoyaltySettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSettings: (pointsPerVisit: number) => Promise<void>;
}

export function useLoyalty(userId?: string): UseLoyaltyReturn {
  const [points, setPoints] = useState<number>(0);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les paramètres
      const settingsData = await loyaltyService.getSettings();
      setSettings(settingsData);

      // Charger les points si userId est fourni
      if (userId) {
        const pointsData = await loyaltyService.getClientPointsByUserId(userId);
        setPoints(pointsData);
      }

      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSettings = async (pointsPerVisit: number) => {
    try {
      const updated = await loyaltyService.updateSettings(pointsPerVisit);
      setSettings(updated);
    } catch (e) {
      throw e;
    }
  };

  return {
    points,
    settings,
    loading,
    error,
    refresh: load,
    updateSettings,
  };
}
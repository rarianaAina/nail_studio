import { useCallback, useEffect, useState } from 'react';
import type { PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '@/types/payment';
import { paymentService } from '@/services/paymentService';

interface UsePaymentMethodsReturn {
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPaymentMethod: (data: CreatePaymentMethodDto) => Promise<PaymentMethod>;
  updatePaymentMethod: (id: string, data: UpdatePaymentMethodDto) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
  toggleActive: (id: string, active: boolean) => Promise<PaymentMethod>;
  reorder: (ids: string[]) => Promise<void>;
}

export function usePaymentMethods(): UsePaymentMethodsReturn {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAll();
      setPaymentMethods(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPaymentMethod = async (data: CreatePaymentMethodDto) => {
    const created = await paymentService.create(data);
    setPaymentMethods((prev) => [...prev, created]);
    return created;
  };

  const updatePaymentMethod = async (id: string, data: UpdatePaymentMethodDto) => {
    const updated = await paymentService.update(id, data);
    setPaymentMethods((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePaymentMethod = async (id: string) => {
    await paymentService.delete(id);
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const updated = await paymentService.toggleActive(id, active);
    setPaymentMethods((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const reorder = async (ids: string[]) => {
    await paymentService.reorder(ids);
    await load(); // Recharger pour avoir le bon ordre
  };

  return {
    paymentMethods,
    loading,
    error,
    refresh: load,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
    reorder,
  };
}
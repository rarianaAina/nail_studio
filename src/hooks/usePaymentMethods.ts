import type { PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '@/types/payment';
import { paymentService } from '@/services/paymentService';
import { queryKeys } from '@/lib/queryClient';
import { useResource, useCacheWriter } from './useResource';

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

const EMPTY: PaymentMethod[] = [];

export function usePaymentMethods(): UsePaymentMethodsReturn {
  const { data: paymentMethods, loading, error, refresh } = useResource(
    queryKeys.paymentMethods,
    () => paymentService.getAll(),
    EMPTY
  );
  const write = useCacheWriter<PaymentMethod[]>(queryKeys.paymentMethods, EMPTY);

  const createPaymentMethod = async (data: CreatePaymentMethodDto) => {
    const created = await paymentService.create(data);
    write((prev) => [...prev, created]);
    return created;
  };

  const updatePaymentMethod = async (id: string, data: UpdatePaymentMethodDto) => {
    const updated = await paymentService.update(id, data);
    write((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deletePaymentMethod = async (id: string) => {
    await paymentService.delete(id);
    write((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = async (id: string, active: boolean) => {
    const updated = await paymentService.toggleActive(id, active);
    write((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const reorder = async (ids: string[]) => {
    await paymentService.reorder(ids);
    await refresh();
  };

  return {
    paymentMethods,
    loading,
    error,
    refresh,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    toggleActive,
    reorder,
  };
}

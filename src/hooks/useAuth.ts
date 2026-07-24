import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Convenience hook — exposes the auth state without requiring
 * consumers to know the context implementation.
 */
export function useAuth() {
  return useAuthContext();
}

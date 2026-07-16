import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export default function ProtectedRoute({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (user.role !== role) {
    return (
      <Navigate to={user.role === 'admin' ? '/admin' : '/mon-espace'} replace />
    );
  }

  return <>{children}</>;
}

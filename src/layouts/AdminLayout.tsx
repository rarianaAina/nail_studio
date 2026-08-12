import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import InstallPrompt from '@/components/InstallPrompt';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <main className="p-4 pb-20 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <InstallPrompt message="Installez l'application pour retrouver votre agenda en un geste, et recevoir les réservations directement sur votre téléphone." />
    </div>
  );
}

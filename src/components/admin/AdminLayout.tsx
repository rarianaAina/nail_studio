import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <main className="p-4 pb-20 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

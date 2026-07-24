import { Routes, Route } from 'react-router-dom';
import { PublicLayout, AdminLayout } from '@/layouts';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import Home from '@/pages/public/Home';
import Services from '@/pages/public/Services';
import Gallery from '@/pages/public/Gallery';
import Contact from '@/pages/public/Contact';
import Booking from '@/pages/public/Booking';

// Auth pages
import Auth from '@/pages/auth/Auth';

// Client pages
import ClientSpace from '@/pages/client/ClientSpace';

// Admin pages
import Dashboard from '@/pages/admin/Dashboard';
import Appointments from '@/pages/admin/Appointments';
import CalendarPage from '@/pages/admin/Calendar';
import Clients from '@/pages/admin/Clients';
import AdminServices from '@/pages/admin/AdminServices';
import Statistics from '@/pages/admin/Statistics';
import Settings from '@/pages/admin/Settings';
import Notifications from '@/pages/admin/Notifications';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/prestations" element={<Services />} />
        <Route path="/galerie" element={<Gallery />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/reservation" element={<Booking />} />
      </Route>

      {/* Auth */}
      <Route path="/connexion" element={<Auth />} />

      {/* Client (protected) */}
      <Route
        path="/mon-espace"
        element={
          <ProtectedRoute role="client">
            <ClientSpace />
          </ProtectedRoute>
        }
      />

      {/* Admin (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="rendez-vous" element={<Appointments />} />
        <Route path="calendrier" element={<CalendarPage />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="prestations" element={<AdminServices />} />
        <Route path="statistiques" element={<Statistics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="parametres" element={<Settings />} />
      </Route>
    </Routes>
  );
}

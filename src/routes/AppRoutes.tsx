// AppRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import { PublicLayout, AdminLayout } from '@/layouts';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import Home from '@/pages/public/Home';
import Services from '@/pages/public/Services';
import Gallery from '@/pages/public/Gallery';
import Contact from '@/pages/public/Contact';
import Booking from '@/pages/public/Booking';
import SpecialInfosSettings from '@/pages/admin/settings/SpecialInfos';

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
import SettingsLayout from '@/pages/admin/settings';
import Notifications from '@/pages/admin/Notifications';

// ✅ Sous-pages des paramètres
import GeneralSettings from '@/pages/admin/settings/General';
import HoursSettings from '@/pages/admin/settings/Hours';
import SocialSettings from '@/pages/admin/settings/Social';
import PaymentMethodsSettings from '@/pages/admin/settings/PaymentMethods';
import CancellationSettings from '@/pages/admin/settings/Cancellation';
import RemindersSettings from '@/pages/admin/settings/Reminders';
import ColorsSettings from '@/pages/admin/settings/Colors';
import CategoriesSettings from '@/pages/admin/settings/Categories';
import TimeSlotsSettings from '@/pages/admin/settings/TimeSlots';

import LoyaltySettings from '@/pages/admin/settings/Loyalty';

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
        
        {/* ✅ Paramètres avec sous-routes */}
        <Route path="parametres" element={<SettingsLayout />}>
          <Route index element={<GeneralSettings />} />
          <Route path="general" element={<GeneralSettings />} />
          <Route path="horaires" element={<HoursSettings />} />
          <Route path="reseaux" element={<SocialSettings />} />
          <Route path="paiements" element={<PaymentMethodsSettings />} />
          <Route path="annulation" element={<CancellationSettings />} />
          <Route path="rappels" element={<RemindersSettings />} />
          <Route path="fidelite" element={<LoyaltySettings />} />
          <Route path="couleurs" element={<ColorsSettings />} />
          <Route path="categories" element={<CategoriesSettings />} />
          <Route path="creneaux" element={<TimeSlotsSettings />} />
          <Route path="informations" element={<SpecialInfosSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}
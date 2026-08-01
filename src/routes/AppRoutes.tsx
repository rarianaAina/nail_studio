// AppRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout, AdminLayout } from '@/layouts';
import ProtectedRoute from '@/components/ProtectedRoute';

// ✅ Lazy loading des pages publiques
const Home = lazy(() => import('@/pages/public/Home'));
const Services = lazy(() => import('@/pages/public/Services'));
const Gallery = lazy(() => import('@/pages/public/Gallery'));
const Contact = lazy(() => import('@/pages/public/Contact'));
const Booking = lazy(() => import('@/pages/public/Booking'));

// Auth pages
const Auth = lazy(() => import('@/pages/auth/Auth'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// Client pages
const ClientSpace = lazy(() => import('@/pages/client/ClientSpace'));

// ✅ Lazy loading des pages admin
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Appointments = lazy(() => import('@/pages/admin/Appointments'));
const CalendarPage = lazy(() => import('@/pages/admin/Calendar'));
const Clients = lazy(() => import('@/pages/admin/Clients'));
const AdminServices = lazy(() => import('@/pages/admin/AdminServices'));
const Statistics = lazy(() => import('@/pages/admin/Statistics'));
const SettingsLayout = lazy(() => import('@/pages/admin/settings/index'));
const Notifications = lazy(() => import('@/pages/admin/Notifications'));
const GalleryManagement = lazy(() => import('@/pages/admin/GalleryManagement'));

// ✅ Lazy loading des sous-pages des paramètres
const GeneralSettings = lazy(() => import('@/pages/admin/settings/General'));
const HoursSettings = lazy(() => import('@/pages/admin/settings/Hours'));
const SocialSettings = lazy(() => import('@/pages/admin/settings/Social'));
const PaymentMethodsSettings = lazy(() => import('@/pages/admin/settings/PaymentMethods'));
const CancellationSettings = lazy(() => import('@/pages/admin/settings/Cancellation'));
const RemindersSettings = lazy(() => import('@/pages/admin/settings/Reminders'));
const ColorsSettings = lazy(() => import('@/pages/admin/settings/Colors'));
const CategoriesSettings = lazy(() => import('@/pages/admin/settings/Categories'));
const TimeSlotsSettings = lazy(() => import('@/pages/admin/settings/TimeSlots'));
const LoyaltySettings = lazy(() => import('@/pages/admin/settings/Loyalty'));
const SpecialInfosSettings = lazy(() => import('@/pages/admin/settings/SpecialInfos'));

// ✅ Composant de chargement
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
      <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reinitialisation" element={<ResetPassword />} />

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
            <Route path="galerie" element={<GalleryManagement />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
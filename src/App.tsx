import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicLayout from '@/components/public/PublicLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import Home from '@/pages/public/Home';
import Services from '@/pages/public/Services';
import Gallery from '@/pages/public/Gallery';
import Contact from '@/pages/public/Contact';
import Booking from '@/pages/public/Booking';
import Auth from '@/pages/auth/Auth';
import ClientSpace from '@/pages/client/ClientSpace';
import Dashboard from '@/pages/admin/Dashboard';
import Appointments from '@/pages/admin/Appointments';
import CalendarPage from '@/pages/admin/Calendar';
import Clients from '@/pages/admin/Clients';
import AdminServices from '@/pages/admin/AdminServices';
import Statistics from '@/pages/admin/Statistics';
import Settings from '@/pages/admin/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/prestations" element={<Services />} />
            <Route path="/galerie" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/reservation" element={<Booking />} />
          </Route>
          <Route path="/connexion" element={<Auth />} />
          <Route
            path="/mon-espace"
            element={
              <ProtectedRoute role="client">
                <ClientSpace />
              </ProtectedRoute>
            }
          />
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
            <Route path="parametres" element={<Settings />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import { Outlet } from 'react-router-dom';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import StructuredData from '@/components/StructuredData';
import { usePageTracking } from '@/hooks/usePageTracking';

export default function PublicLayout() {
  // Mesure d'audience anonyme, limitée aux pages publiques : l'administration
  // et l'espace cliente ne relèvent pas de la fréquentation du site.
  usePageTracking();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Décrit le salon au format schema.org sur toutes les pages publiques. */}
      <StructuredData />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

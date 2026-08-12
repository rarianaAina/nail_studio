import { Outlet } from 'react-router-dom';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import StructuredData from '@/components/StructuredData';

export default function PublicLayout() {
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

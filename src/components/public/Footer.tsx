import { Link } from 'react-router-dom';
import { CalendarHeart, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle } from 'lucide-react';
import { salonInfo } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                <CalendarHeart className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-semibold">Nida</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Nail Studio
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Salon d'onglerie haut de gamme à Antananarivo. Sublimez vos mains
              dans un cadre raffiné et apaisant.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold">Navigation</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ['/', 'Accueil'],
                ['/prestations', 'Prestations'],
                ['/galerie', 'Galerie'],
                ['/contact', 'Contact'],
                ['/reservation', 'Réservation'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>{salonInfo.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{salonInfo.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>{salonInfo.email}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold">Suivez-nous</h4>
            <div className="mt-4 flex gap-3">
              <a
                href={salonInfo.facebook}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={salonInfo.instagram}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={`https://wa.me/${salonInfo.whatsapp.replace(/\s/g, '')}`}
                className="grid h-10 w-10 place-items-center rounded-full bg-white text-foreground shadow-soft transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Nida Nail Studio. Tous droits réservés.</p>
          <p>Conçu avec soin à Antananarivo, Madagascar.</p>
        </div>
      </div>
    </footer>
  );
}

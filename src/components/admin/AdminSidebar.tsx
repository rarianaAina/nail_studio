import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Menu,
  X,
  CalendarHeart,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const items = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/rendez-vous', label: 'Rendez-vous', icon: CalendarDays },
  { to: '/admin/calendrier', label: 'Calendrier', icon: CalendarRange },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/prestations', label: 'Prestations', icon: Sparkles },
  { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export default function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    toast.success('Vous êtes déconnecté.');
    navigate('/');
  };

  const content = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2 px-5 py-5">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <CalendarHeart className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">NidaNail</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Admin
          </p>
        </div>
      </Link>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <div className="rounded-xl bg-secondary/60 p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground">
              {user?.name[0] ?? 'A'}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.name ?? 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? 'admin@nidanail.mg'}</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card lg:block">
        <div className="sticky top-0 h-screen">{content}</div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/60 bg-card px-4 py-3 lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
            <CalendarHeart className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">NidaNail Admin</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-glow lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-secondary"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

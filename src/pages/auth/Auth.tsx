import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarHeart,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Heart,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Mode = 'login' | 'register';

export default function Auth() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<UserRole>('client');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const u = await login(form.email, form.password, role);
        toast.success(`Bienvenue, ${u.name.split(' ')[0]} !`);
        navigate(u.role === 'admin' ? '/admin' : '/mon-espace');
      } else {
        const u = await register({ ...form, role });
        toast.success(`Compte créé. Bienvenue, ${u.name.split(' ')[0]} !`);
        navigate(u.role === 'admin' ? '/admin' : '/mon-espace');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r: UserRole) => {
    setRole(r);
    setMode('login');
    if (r === 'admin') {
      set('email', 'admin@nida.mg');
      set('password', 'admin123');
    } else {
      set('email', 'cliente@nida.mg');
      set('password', 'cliente123');
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — Brand panel */}
      <div className="relative hidden overflow-hidden gradient-rose lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -right-24 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-24 bottom-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative flex items-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
            <CalendarHeart className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold">Nida</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Nail Studio
            </p>
          </div>
        </div>

        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="font-display text-5xl font-semibold leading-tight text-foreground"
          >
            L'art des ongles,
            <span className="block italic text-primary">sublimé avec élégance</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 max-w-md text-foreground/70"
          >
            Connectez-vous pour réserver vos rendez-vous, suivre votre historique
            et profiter d'offres exclusives.
          </motion.p>

          <div className="mt-10 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">4.9/5</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-primary" /> +450 clientes
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> 8 ans d'expérience
            </div>
          </div>
        </div>

        <div className="relative text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nida Nail Studio — Antananarivo, Madagascar
        </div>
      </div>

      {/* Right — Form */}
      <div className="relative flex items-center justify-center overflow-y-auto bg-background px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid opacity-[0.15] lg:hidden" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-md"
        >
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-primary">
              <CalendarHeart className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">Nida</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Nail Studio
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft sm:p-8">
            {/* Tabs */}
            <div className="relative mb-6 grid grid-cols-2 rounded-full bg-secondary p-1 text-sm font-medium">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'relative z-10 rounded-full py-2 transition-colors',
                    mode === m
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                  {mode === m && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 -z-10 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="font-display text-2xl font-semibold">
                  {mode === 'login' ? 'Bon retour parmi nous' : 'Créez votre compte'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === 'login'
                    ? 'Connectez-vous pour accéder à votre espace.'
                    : 'Rejoignez Nida pour réserver en ligne.'}
                </p>

                {/* Role selector */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: 'client', label: 'Cliente', icon: Heart },
                      { v: 'admin', label: 'Administrateur', icon: ShieldCheck },
                    ] as { v: UserRole; label: string; icon: typeof Heart }[]
                  ).map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setRole(r.v)}
                      className={cn(
                        'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all',
                        role === r.v
                          ? 'border-primary bg-primary/5 text-primary shadow-glow'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <r.icon className="h-4 w-4" /> {r.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nom complet</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="name"
                          required
                          value={form.name}
                          onChange={(e) => set('name', e.target.value)}
                          placeholder="Votre nom"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="vous@email.com"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          required
                          value={form.phone}
                          onChange={(e) => set('phone', e.target.value)}
                          placeholder="+261 ..."
                          className="pl-9"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={(e) => set('password', e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                        aria-label={showPw ? 'Masquer' : 'Afficher'}
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={() => toast.info('Démo : utilisez un compte ci-dessous.')}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full rounded-full shadow-glow"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                        Veuillez patienter...
                      </span>
                    ) : (
                      <>
                        {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Demo accounts */}
                <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3">
                  <p className="text-center text-xs font-medium text-primary">
                    Comptes de démonstration
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => fillDemo('admin')}
                      className="rounded-lg bg-background px-3 py-2 text-left text-xs shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <p className="font-semibold text-foreground">Admin</p>
                      <p className="text-muted-foreground">admin@nida.mg</p>
                      <p className="text-muted-foreground">admin123</p>
                    </button>
                    <button
                      onClick={() => fillDemo('client')}
                      className="rounded-lg bg-background px-3 py-2 text-left text-xs shadow-soft transition-transform hover:-translate-y-0.5"
                    >
                      <p className="font-semibold text-foreground">Cliente</p>
                      <p className="text-muted-foreground">cliente@nida.mg</p>
                      <p className="text-muted-foreground">cliente123</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {mode === 'login' ? "Pas encore de compte ? " : 'Vous avez déjà un compte ? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-medium text-primary hover:underline"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

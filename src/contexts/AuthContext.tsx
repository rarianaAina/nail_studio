import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '@/types/user';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (data: RegisterDto) => Promise<User>;
  logout: () => Promise<void>;
}

interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string | null;
}

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? undefined,
    role: r.role as UserRole,
    avatarUrl: r.avatar_url ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) return null;
    if (!data) return null;
    return rowToUser(data as UserRow);
  };

  useEffect(() => {
    let mounted = true;

    // onAuthStateChange fires INITIAL_SESSION on mount. We use it as the
    // single source of truth for session state — getSession() is redundant
    // and can race with the callback. The guard prevents stale setState
    // after unmount.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        (async () => {
          if (!mounted) return;
          if (session?.user) {
            const profile = await fetchProfile(session.user.id);
            if (mounted) {
              setUser(profile);
              setLoading(false);
            }
          } else {
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
          }
        })();
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login: AuthState['login'] = async (email, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Identifiants incorrects.');

    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error('Profil introuvable.');
    if (profile.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`Ce compte n'est pas un compte ${role === 'admin' ? 'administratrice' : 'cliente'}.`);
    }
    setUser(profile);
    return profile;
  };

  const register: AuthState['register'] = async (data) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          phone: data.phone,
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!signUpData.user) throw new Error('Erreur lors de la création du compte.');

    const uid = signUpData.user.id;

    let profile = await fetchProfile(uid);

    if (!profile) {
      const { data: created, error: insertErr } = await supabase
        .from('users')
        .insert({
          id: uid,
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
        })
        .select()
        .single();
      if (insertErr) throw new Error('Erreur lors de la création du profil.');
      profile = rowToUser(created as UserRow);
    } else if (profile.role !== data.role) {
      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update({ role: data.role, name: data.name, phone: data.phone })
        .eq('id', uid)
        .select()
        .single();
      if (updateErr) throw new Error('Erreur lors de la mise à jour du profil.');
      profile = rowToUser(updated as UserRow);
    }

    // Pour un compte cliente : rattacher la fiche client et les rendez-vous
    // pris en anonyme. Fait côté serveur — l'enchaînement précédent (recherche
    // par email, création, mise à jour des rendez-vous) exigeait la lecture
    // publique de `clients` et l'écriture libre de `appointments`.
    // La fonction s'appuie sur `auth.email()` : un compte ne peut revendiquer
    // que les fiches correspondant à sa propre identité.
    if (data.role === 'client') {
      const { error: linkErr } = await supabase.rpc('link_client_account', {
        p_name: data.name,
        p_phone: data.phone,
      });
      if (linkErr) throw new Error('Erreur lors de la création du profil client.');
    }

    setUser(profile);
    return profile;
  };

  const logout: AuthState['logout'] = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}

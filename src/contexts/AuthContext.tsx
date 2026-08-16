import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

/**
 * Dernier profil connu, conservé à côté de la session Supabase.
 *
 * Supabase restaure la session hors ligne, mais pas le profil, qui vit dans
 * une table. Sans ce cache, une application lancée sans réseau afficherait la
 * page de connexion à une personne pourtant authentifiée — et cette connexion
 * échouerait elle aussi, faute de réseau.
 *
 * C'est un confort d'affichage, jamais une autorisation : le rôle qu'il porte
 * ne décide que de l'interface montrée. Toute lecture et toute écriture restent
 * arbitrées par les politiques RLS, qui interrogent `auth.uid()` côté serveur.
 */
const CLE_PROFIL = 'nida-profil';

function lireProfilEnCache(): User | null {
  try {
    const brut = localStorage.getItem(CLE_PROFIL);
    return brut ? (JSON.parse(brut) as User) : null;
  } catch {
    return null;
  }
}

function ecrireProfilEnCache(profil: User | null): void {
  try {
    if (profil) localStorage.setItem(CLE_PROFIL, JSON.stringify(profil));
    else localStorage.removeItem(CLE_PROFIL);
  } catch {
    // Navigation privée ou quota saturé : l'application fonctionne sans.
  }
}

/**
 * Une lecture de profil peut échouer de deux façons qu'il faut distinguer.
 *
 * `absent` — la ligne n'existe pas : le compte n'a réellement pas de profil,
 * il faut le déconnecter.
 * `indisponible` — la requête n'a pas abouti : on ne sait rien. Traiter ce cas
 * comme une absence déconnectait une personne dont la session était valide.
 */
type LectureProfil =
  | { statut: 'ok'; profil: User }
  | { statut: 'absent' }
  | { statut: 'indisponible' };

async function lireProfil(uid: string): Promise<LectureProfil> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error) return { statut: 'indisponible' };
  if (!data) return { statut: 'absent' };
  return { statut: 'ok', profil: rowToUser(data as UserRow) };
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Permet à l'abonnement de connaître le profil courant sans se réabonner à
  // chaque changement, ce qui rejouerait l'événement initial en boucle.
  const profilCourant = useRef<User | null>(null);

  const appliquerProfil = (profil: User | null) => {
    profilCourant.current = profil;
    setUser(profil);
    ecrireProfilEnCache(profil);
  };

  useEffect(() => {
    let monte = true;

    // `onAuthStateChange` émet `INITIAL_SESSION` au montage : il suffit comme
    // source unique de vérité, un `getSession()` en parallèle courrait avec lui.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (evenement, session) => {
        if (!monte) return;

        if (!session?.user) {
          appliquerProfil(null);
          setLoading(false);
          return;
        }

        // Le rafraîchissement du jeton survient environ toutes les heures et ne
        // change rien au profil. Le relire à cette occasion n'apportait aucune
        // information et offrait, à chaque fois, une nouvelle occasion d'échouer.
        if (evenement === 'TOKEN_REFRESHED' && profilCourant.current) {
          setLoading(false);
          return;
        }

        // Afficher sans attendre le profil déjà connu : la session est valide,
        // rien ne justifie un écran de chargement le temps d'un aller-retour.
        const cache = lireProfilEnCache();
        if (cache && cache.id === session.user.id) {
          profilCourant.current = cache;
          setUser(cache);
          setLoading(false);
        }

        // L'appel est délibérément lancé sans être attendu : le client Supabase
        // détient un verrou pendant l'exécution de ce rappel, et toute requête
        // attendue à l'intérieur l'interbloquerait.
        (async () => {
          const lecture = await lireProfil(session.user.id);
          if (!monte) return;

          if (lecture.statut === 'ok') {
            appliquerProfil(lecture.profil);
          } else if (lecture.statut === 'absent') {
            appliquerProfil(null);
          }
          // `indisponible` : on conserve ce que l'on a. La session reste
          // valide ; déconnecter ici serait une erreur de diagnostic.

          setLoading(false);
        })();
      }
    );

    return () => {
      monte = false;
      subscription.unsubscribe();
    };
  }, []);

  const login: AuthState['login'] = async (email, password, role) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Identifiants incorrects.');

    const lecture = await lireProfil(data.user.id);
    if (lecture.statut === 'indisponible') {
      throw new Error('Connexion impossible pour le moment. Réessayez dans un instant.');
    }
    if (lecture.statut === 'absent') throw new Error('Profil introuvable.');

    const profil = lecture.profil;
    if (profil.role !== role) {
      await supabase.auth.signOut();
      throw new Error(`Ce compte n'est pas un compte ${role === 'admin' ? 'administratrice' : 'cliente'}.`);
    }
    appliquerProfil(profil);
    return profil;
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

    const lecture = await lireProfil(uid);
    let profile = lecture.statut === 'ok' ? lecture.profil : null;

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

    appliquerProfil(profile);
    return profile;
  };

  const logout: AuthState['logout'] = async () => {
    await supabase.auth.signOut();
    appliquerProfil(null);
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

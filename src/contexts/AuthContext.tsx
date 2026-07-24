import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '@/types/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (data: RegisterDto) => Promise<User>;
  logout: () => void;
}

interface RegisterDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

// ---------------------------------------------------------------------------
// Mock user store — replace with Firebase Auth + Firestore profile doc
// ---------------------------------------------------------------------------

const mockUsers: (User & { password: string })[] = [
  {
    id: 'u-admin',
    name: 'Admin Nida',
    email: 'admin@nida.mg',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'u-client',
    name: 'Hanta Rakotoarison',
    email: 'cliente@nida.mg',
    phone: '+261 34 11 22 33',
    password: 'cliente123',
    role: 'client',
  },
];

const STORAGE_KEY = 'nida.auth';
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  // Firebase equivalent: onAuthStateChanged(auth, handler)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      // ignore malformed data
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
  };

  // Firebase equivalent: signInWithEmailAndPassword(auth, email, password)
  const login: AuthState['login'] = async (email, password, role) => {
    await delay(700);
    const found = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === role
    );
    if (!found) throw new Error('Identifiants incorrects pour ce rôle.');
    const { password: _pw, ...safe } = found;
    persist(safe);
    return safe;
  };

  // Firebase equivalent: createUserWithEmailAndPassword + setDoc profile
  const register: AuthState['register'] = async (data) => {
    await delay(700);
    const exists = mockUsers.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (exists) throw new Error('Un compte existe déjà avec cet email.');
    const newUser: User = {
      id: 'u-' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push({ ...newUser, password: data.password });
    persist(newUser);
    return newUser;
  };

  // Firebase equivalent: signOut(auth)
  const logout = () => persist(null);

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

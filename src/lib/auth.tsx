import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRole } from './types';

interface AuthState {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
  }) => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = 'nida.auth';

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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (u: User | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
  };

  const login: AuthState['login'] = async (email, password, role) => {
    await delay(700);
    const found = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role === role
    );
    if (!found) {
      throw new Error('Identifiants incorrects pour ce rôle.');
    }
    const { password: _pw, ...safe } = found;
    persist(safe);
    return safe;
  };

  const register: AuthState['register'] = async (data) => {
    await delay(700);
    const exists = mockUsers.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (exists) {
      throw new Error('Un compte existe déjà avec cet email.');
    }
    const newUser: User = {
      id: 'u-' + Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    mockUsers.push({ ...newUser, password: data.password });
    persist(newUser);
    return newUser;
  };

  const logout = () => persist(null);

  const value = useMemo<AuthState>(
    () => ({ user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

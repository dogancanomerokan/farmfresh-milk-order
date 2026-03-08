import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth-user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem("auth-user", JSON.stringify(u));
    else localStorage.removeItem("auth-user");
  };

  const login = async (email: string, password: string) => {
    // TODO: Replace with your backend API call
    const users = JSON.parse(localStorage.getItem("registered-users") || "[]");
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) throw new Error("E-posta veya şifre hatalı");
    const { password: _, ...userData } = found;
    persist(userData);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }) => {
    // TODO: Replace with your backend API call
    const users = JSON.parse(localStorage.getItem("registered-users") || "[]");
    if (users.find((u: any) => u.email === data.email)) {
      throw new Error("Bu e-posta adresi zaten kayıtlı");
    }
    const newUser = { id: crypto.randomUUID(), ...data };
    users.push(newUser);
    localStorage.setItem("registered-users", JSON.stringify(users));
    const { password: _, ...userData } = newUser;
    persist(userData);
  };

  const logout = () => persist(null);

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    persist(updated);
    // Also update in registered-users store
    const users = JSON.parse(localStorage.getItem("registered-users") || "[]");
    const idx = users.findIndex((u: any) => u.id === updated.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
      localStorage.setItem("registered-users", JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

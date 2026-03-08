import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

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
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const mapSupabaseUserToAppUser = async (authUser: any): Promise<User | null> => {
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile?.full_name || authUser.user_metadata?.full_name || "",
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    address: profile?.address || "",
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (session?.user) {
        const appUser = await mapSupabaseUserToAppUser(session.user);
        if (mounted) setUser(appUser);
      } else {
        setUser(null);
      }

      if (mounted) setIsLoading(false);
    };

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const appUser = await mapSupabaseUserToAppUser(session.user);
        if (mounted) setUser(appUser);
      } else {
        if (mounted) setUser(null);
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        throw new Error("Lütfen önce e-posta adresinizi doğrulayın.");
      }
      throw new Error(error.message);
    }

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const appUser = await mapSupabaseUserToAppUser(authUser);
    setUser(appUser);
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: data.name,
          phone: data.phone || null,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    const payload = {
      id: user.id,
      full_name: data.name ?? user.name,
      phone: data.phone ?? user.phone ?? null,
      address: data.address ?? user.address ?? null,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      throw new Error(error.message);
    }

    setUser({
      ...user,
      name: payload.full_name,
      phone: payload.phone || "",
      address: payload.address || "",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

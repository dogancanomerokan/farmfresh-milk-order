import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
}

export type AdminRole = "operations_admin" | "super_admin" | null;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  adminRole: AdminRole;
  adminRoleLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
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

const getAdminRoleByAuthUserId = async (
  authUserId: string
): Promise<AdminRole> => {
  const { data, error } = await supabase
    .from("admin_users")
    .select("role")
    .eq("auth_user_id", authUserId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Admin rolü alınamadı:", error);
    return null;
  }

  return (data?.role as AdminRole) ?? null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [adminRoleLoading, setAdminRoleLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          const [appUser, role] = await Promise.all([
            mapSupabaseUserToAppUser(session.user),
            getAdminRoleByAuthUserId(session.user.id),
          ]);

          if (!isMounted) return;

          setUser(appUser);
          setAdminRole(role);
        } else {
          setUser(null);
          setAdminRole(null);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (isMounted) {
          setUser(null);
          setAdminRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setAdminRoleLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      void (async () => {
        try {
          if (isMounted) {
            setAdminRoleLoading(true);
          }

          if (session?.user) {
            const [appUser, role] = await Promise.all([
              mapSupabaseUserToAppUser(session.user),
              getAdminRoleByAuthUserId(session.user.id),
            ]);

            if (!isMounted) return;

            setUser(appUser);
            setAdminRole(role);
          } else {
            if (!isMounted) return;

            setUser(null);
            setAdminRole(null);
          }
        } catch (error) {
          console.error("Auth state error:", error);
          if (isMounted) {
            setUser(null);
            setAdminRole(null);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
            setAdminRoleLoading(false);
          }
        }
      })();
    });

    return () => {
      isMounted = false;
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

    if (authUser) {
      const [appUser, role] = await Promise.all([
        mapSupabaseUserToAppUser(authUser),
        getAdminRoleByAuthUserId(authUser.id),
      ]);

      setUser(appUser);
      setAdminRole(role);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
    if (error) throw new Error(error.message);

    setUser(null);
    setAdminRole(null);
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
    if (error) throw new Error(error.message);

    setUser({
      ...user,
      name: payload.full_name,
      phone: payload.phone || "",
      address: payload.address || "",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        adminRole,
        adminRoleLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

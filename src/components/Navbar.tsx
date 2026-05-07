import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Milk,
  User,
  LogIn,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

type AdminRole = "operations_admin" | "super_admin" | null;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [adminRoleLoading, setAdminRoleLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const loadAdminRole = async () => {
      try {
        setAdminRoleLoading(true);

        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setAdminRole(null);
          return;
        }

        const { data, error } = await supabase
          .from("admin_users")
          .select("role")
          .eq("auth_user_id", authUser.id)
          .eq("is_active", true)
          .maybeSingle();

        if (error) {
          console.error("Admin rolü alınamadı:", error);
          setAdminRole(null);
          return;
        }

        setAdminRole((data?.role as AdminRole) ?? null);
      } catch (error) {
        console.error("Navbar admin rolü hatası:", error);
        setAdminRole(null);
      } finally {
        setAdminRoleLoading(false);
      }
    };

    loadAdminRole();
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Milk className="h-8 w-8 text-primary" />

          <span
            className="text-xl font-bold font-heading text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Sade Süt
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Ana Sayfa
          </Link>

          <Link
            to="/order"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Sipariş Ver
          </Link>

          {/* ADMIN DROPDOWN */}
          {!adminRoleLoading && adminRole && (
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsAdminMenuOpen((prev) => !prev)
                }
                className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Admin
                <ChevronDown className="h-4 w-4" />
              </button>

              {isAdminMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-xl p-2 z-50">
                  {adminRole === "super_admin" && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() =>
                          setIsAdminMenuOpen(false)
                        }
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                      >
                        Kullanıcı Yönetimi
                      </Link>

                      <Link
                        to="/admin-campaigns"
                        onClick={() =>
                          setIsAdminMenuOpen(false)
                        }
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                      >
                        Kampanya Yönetimi
                      </Link>
                    </>
                  )}

                  <Link
                    to="/order-manage"
                    onClick={() =>
                      setIsAdminMenuOpen(false)
                    }
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                  >
                    Sipariş Yönetimi
                  </Link>

                  <Link
                    to="/dispatch"
                    onClick={() =>
                      setIsAdminMenuOpen(false)
                    }
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:text-primary transition-colors"
                  >
                    Dağıtım
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* USER */}
          {user ? (
            <Link
              to="/member"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              {(user.name || "Üye").split(" ")[0]}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <LogIn className="h-4 w-4" />
              Giriş Yap
            </Link>
          )}

          {/* CTA */}
          <Link to="/order">
            <Button variant="default" size="sm">
              Süt Rezerve Et
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border px-4 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2"
          >
            Ana Sayfa
          </Link>

          <Link
            to="/order"
            onClick={() => setIsOpen(false)}
            className="block text-sm font-medium text-foreground py-2"
          >
            Sipariş Ver
          </Link>

          {/* MOBILE ADMIN */}
          {!adminRoleLoading && adminRole && (
            <div className="border-t border-border pt-3 mt-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground px-1 mb-2">
                Admin
              </p>

              {adminRole === "super_admin" && (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm font-medium text-foreground py-2 pl-3"
                  >
                    Kullanıcı Yönetimi
                  </Link>

                  <Link
                    to="/admin-campaigns"
                    onClick={() => setIsOpen(false)}
                    className="block text-sm font-medium text-foreground py-2 pl-3"
                  >
                    Kampanya Yönetimi
                  </Link>
                </>
              )}

              <Link
                to="/order-manage"
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium text-foreground py-2 pl-3"
              >
                Sipariş Yönetimi
              </Link>

              <Link
                to="/dispatch"
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium text-foreground py-2 pl-3"
              >
                Dağıtım
              </Link>
            </div>
          )}

          {/* USER */}
          {user ? (
            <Link
              to="/member"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-foreground py-2 flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              {(user.name || "Üye").split(" ")[0]}
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-foreground py-2 flex items-center gap-1"
            >
              <LogIn className="h-4 w-4" />
              Giriş Yap
            </Link>
          )}

          <Link
            to="/order"
            onClick={() => setIsOpen(false)}
          >
            <Button
              variant="default"
              size="sm"
              className="w-full mt-2"
            >
              Süt Rezerve Et
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

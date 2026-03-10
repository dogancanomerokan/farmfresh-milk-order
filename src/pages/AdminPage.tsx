import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { LogOut, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";
import { supabase } from "@/lib/supabaseClient";

type AdminRole = "operations_admin" | "super_admin";

type AdminUserRow = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
};

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserRow | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] =
    useState<AdminRole>("operations_admin");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const loadAdminUsers = async () => {
    setAdminsLoading(true);

    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAdminUsers(data || []);
    } catch (error: any) {
      console.error("Admin kullanıcılar alınamadı:", error);
      toast.error(error.message || "Admin kullanıcılar yüklenemedi");
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      setLoading(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setAuthorized(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }

        if (!user.email_confirmed_at) {
          setAuthorized(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("auth_user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminError) throw adminError;

        if (!adminData) {
          setAuthorized(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }

        setAdminUser(adminData);
        setAuthorized(true);
        await loadAdminUsers();
      } catch (error: any) {
        console.error("Admin yetki kontrolü hatası:", error);
        toast.error(error.message || "Yetki kontrolü yapılamadı");
        setAuthorized(false);
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Çıkış yapıldı");
    window.location.href = "/";
  };

  const createAdminUser = async () => {
    if (adminUser?.role !== "super_admin") {
      toast.error("Bu işlem için yetkiniz yok");
      return;
    }

    if (!newAdminEmail.trim()) {
      toast.error("E-posta adresi gerekli");
      return;
    }

    setCreatingAdmin(true);

    try {
      const { error } = await supabase.rpc("add_admin_user_by_email", {
        target_email: newAdminEmail.trim().toLowerCase(),
        target_full_name: newAdminName.trim(),
        target_role: newAdminRole,
      });

      if (error) throw error;

      toast.success("Admin kullanıcı eklendi");
      setNewAdminEmail("");
      setNewAdminName("");
      setNewAdminRole("operations_admin");
      await loadAdminUsers();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Admin kullanıcı eklenemedi");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const updateAdminRole = async (id: string, role: AdminRole) => {
    if (adminUser?.role !== "super_admin") {
      toast.error("Bu işlem için yetkiniz yok");
      return;
    }

    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ role })
        .eq("id", id);

      if (error) throw error;

      setAdminUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u))
      );

      toast.success("Admin rolü güncellendi");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Rol güncellenemedi");
    }
  };

  const toggleAdminActive = async (id: string, isActive: boolean) => {
    if (adminUser?.role !== "super_admin") {
      toast.error("Bu işlem için yetkiniz yok");
      return;
    }

    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      setAdminUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !isActive } : u))
      );

      toast.success("Admin durumu güncellendi");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Durum güncellenemedi");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center min-h-[80vh]">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!authorized || !adminUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center min-h-[80vh] px-4">
          <div
            className="w-full max-w-md bg-card rounded-2xl p-8 text-center"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2
              className="text-2xl font-bold text-foreground mb-2"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Yetkisiz Erişim
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Bu sayfayı görüntülemek için yetkili admin hesabıyla giriş
              yapmanız gerekiyor.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => (window.location.href = "/login")}>
                Giriş Yap
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Ana Sayfa
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-1">
                Yönetim
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Yönetim Paneli
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Giriş yapan yetkili:{" "}
                <span className="font-medium">
                  {adminUser.full_name || adminUser.email}
                </span>{" "}
                ·{" "}
                <span className="font-medium">
                  {adminUser.role === "super_admin"
                    ? "Super Admin"
                    : "Operations Admin"}
                </span>
              </p>
            </div>

            <div className="flex gap-2 self-start">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAdminUsers}
                disabled={adminsLoading}
              >
                {adminsLoading ? "Yükleniyor..." : "Yenile"}
              </Button>
            </div>
          </div>

          {adminUser.role === "super_admin" && (
            <div
              className="bg-card rounded-xl p-5 md:p-6"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <h2
                    className="text-2xl font-bold text-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Admin Kullanıcı Yönetimi
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Yeni admin ekleyin, rollerini değiştirin veya pasife alın.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3 mb-6">
                <Input
                  placeholder="E-posta"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <Input
                  placeholder="Ad Soyad"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
                <Select
                  value={newAdminRole}
                  onValueChange={(v) => setNewAdminRole(v as AdminRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations_admin">
                      Operations Admin
                    </SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={createAdminUser} disabled={creatingAdmin}>
                  {creatingAdmin ? "Ekleniyor..." : "Admin Ekle"}
                </Button>
              </div>

              <div className="space-y-3">
                {adminsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Admin kullanıcılar yükleniyor...
                  </p>
                ) : adminUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Henüz admin kullanıcı bulunmuyor.
                  </p>
                ) : (
                  adminUsers.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-border rounded-lg p-4"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {admin.full_name || "İsimsiz Admin"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {admin.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Oluşturulma:{" "}
                          {format(parseISO(admin.created_at), "d MMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        </p>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <Select
                          value={admin.role}
                          onValueChange={(v) =>
                            updateAdminRole(admin.id, v as AdminRole)
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operations_admin">
                              Operations Admin
                            </SelectItem>
                            <SelectItem value="super_admin">
                              Super Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant={admin.is_active ? "outline" : "default"}
                          onClick={() =>
                            toggleAdminActive(admin.id, admin.is_active)
                          }
                        >
                          {admin.is_active ? "Pasife Al" : "Aktif Et"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {adminUser.role === "super_admin" && (
            <div className="mt-10">
              <DeliveryZoneManager />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;

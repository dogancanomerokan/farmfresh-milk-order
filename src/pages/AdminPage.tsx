import { useState, useEffect } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarIcon,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Filter,
  RefreshCw,
  Download,
  LogOut,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";
import { supabase } from "@/lib/supabaseClient";

type OrderStatus =
  | "pending"
  | "approved"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

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

type OrderRow = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  il: string;
  ilce: string;
  mahalle: string | null;
  address: string;
  delivery_date: string;
  time_slot: string;
  notes: string | null;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  volume_snapshot: string | null;
  unit_snapshot: string | null;
  unit_price: number | null;
  quantity: number;
  line_total: number | null;
  created_at: string;
};

type AdminOrder = OrderRow & {
  items: OrderItemRow[];
};

const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
const [adminsLoading, setAdminsLoading] = useState(false);

const [newAdminEmail, setNewAdminEmail] = useState("");
const [newAdminName, setNewAdminName] = useState("");
const [newAdminRole, setNewAdminRole] = useState<AdminRole>("operations_admin");
const [creatingAdmin, setCreatingAdmin] = useState(false);

const loadAdminUsers = async () => {
  if (adminUser?.role !== "super_admin") return;

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

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Beklemede", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  approved: { label: "Onaylandı", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  preparing: { label: "Hazırlanıyor", icon: Package, color: "bg-blue-100 text-blue-800 border-blue-200" },
  delivering: { label: "Yolda", icon: Truck, color: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Teslim Edildi", icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "İptal", icon: XCircle, color: "bg-red-100 text-red-800 border-red-200" },
};

const exportToCSV = (orders: AdminOrder[]) => {
  const headers = [
    "Sipariş ID",
    "Ad Soyad",
    "E-posta",
    "Telefon",
    "İl",
    "İlçe",
    "Mahalle",
    "Adres",
    "Ürünler",
    "Toplam",
    "Teslimat Tarihi",
    "Teslimat Saati",
    "Durum",
    "Notlar",
    "Oluşturulma",
  ];

  const rows = orders.map((o) => {
    const productsText = o.items
      .map((item) => {
        const total = Number(item.line_total || 0);
        return `${item.product_name_snapshot} ${item.volume_snapshot || ""} ${item.unit_snapshot || ""} x${item.quantity} (${total} TL)`.trim();
      })
      .join(" | ");

    return [
      o.id,
      o.guest_name || "",
      o.guest_email || "",
      o.guest_phone || "",
      o.il || "",
      o.ilce || "",
      o.mahalle || "",
      `"${(o.address || "").replace(/"/g, '""')}"`,
      `"${productsText.replace(/"/g, '""')}"`,
      `${o.total_amount || 0} TL`,
      format(parseISO(o.delivery_date), "d MMMM yyyy", { locale: tr }),
      o.time_slot,
      statusConfig[o.status]?.label || o.status,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
      format(parseISO(o.created_at), "d MMM yyyy HH:mm", { locale: tr }),
    ].join(",");
  });

  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siparisler_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV dosyası indirildi");
};

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserRow | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const loadOrders = async () => {
    setOrdersLoading(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const orderIds = (ordersData || []).map((o) => o.id);

      let itemsData: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        const { data: fetchedItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });

        if (itemsError) throw itemsError;

        itemsData = fetchedItems || [];
      }

      const mergedOrders: AdminOrder[] = (ordersData || []).map((order) => ({
        ...order,
        items: itemsData.filter((item) => item.order_id === order.id),
      }));

      setOrders(mergedOrders);
    } catch (error: any) {
      console.error("Siparişler yüklenemedi:", error);
      toast.error(error.message || "Siparişler yüklenemedi");
    } finally {
      setOrdersLoading(false);
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

        if (adminError) {
          throw adminError;
        }

        if (!adminData) {
          setAuthorized(false);
          setAdminUser(null);
          setLoading(false);
          return;
        }

        setAdminUser(adminData);
        setAuthorized(true);
        if (adminData.role === "super_admin") {
  await loadAdminUsers();
}
        useEffect(() => {
  if (authorized && adminUser?.role === "super_admin") {
    loadAdminUsers();
  }
}, [authorized, adminUser?.role]);
        await loadOrders();
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
    const { data: profileMatches, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("id", "%");

    if (profileError) throw profileError;

    const { data: authUserResult, error: authLookupError } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", newAdminEmail.trim().toLowerCase());

    if (authLookupError) throw authLookupError;

    const alreadyExists = (authUserResult || []).some(
      (item) => item.email.toLowerCase() === newAdminEmail.trim().toLowerCase()
    );

    if (alreadyExists) {
      throw new Error("Bu kullanıcı zaten admin listesinde");
    }

    throw new Error("Bu adım için kullanıcıyı auth.users ile eşleyen güvenli bir backend fonksiyon kurmamız gerekiyor.");
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || "Admin kullanıcı eklenemedi");
  } finally {
    setCreatingAdmin(false);
  }
};

  if (!newAdminEmail.trim()) {
    toast.error("E-posta adresi gerekli");
    return;
  }

  setCreatingAdmin(true);

  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) throw authError;

    const matchedUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === newAdminEmail.trim().toLowerCase()
    );

    if (!matchedUser) {
      throw new Error("Bu e-posta ile kayıtlı bir kullanıcı bulunamadı");
    }

    const { error: insertError } = await supabase.from("admin_users").upsert({
      auth_user_id: matchedUser.id,
      email: matchedUser.email,
      full_name: newAdminName || matchedUser.user_metadata?.full_name || null,
      role: newAdminRole,
      is_active: true,
    });

    if (insertError) throw insertError;

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
  
  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      );

      toast.success(`Sipariş durumu "${statusConfig[status].label}" olarak güncellendi`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Durum güncellenemedi");
    }
  };

  const deleteOrder = async (id: string) => {
    if (adminUser?.role !== "super_admin") {
      toast.error("Bu işlem için yetkiniz yok");
      return;
    }

    const confirmed = window.confirm("Bu siparişi silmek istediğinize emin misiniz?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Sipariş silindi");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Sipariş silinemedi");
    }
  };

  const filtered = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => {
      if (!dateFrom && !dateTo) return true;
      const orderDate = parseISO(o.delivery_date);
      if (dateFrom && dateTo) {
        return isWithinInterval(orderDate, {
          start: startOfDay(dateFrom),
          end: endOfDay(dateTo),
        });
      }
      if (dateFrom) return orderDate >= startOfDay(dateFrom);
      if (dateTo) return orderDate <= endOfDay(dateTo);
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivering: orders.filter((o) => o.status === "delivering" || o.status === "preparing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
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
          <div className="w-full max-w-md bg-card rounded-2xl p-8 text-center" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Yetkisiz Erişim
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Bu sayfayı görüntülemek için yetkili admin hesabıyla giriş yapmanız gerekiyor.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => (window.location.href = "/login")}>Giriş Yap</Button>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
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
              <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-1">Yönetim</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                Sipariş Paneli
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Giriş yapan yetkili: <span className="font-medium">{adminUser.full_name || adminUser.email}</span> ·{" "}
                <span className="font-medium">
                  {adminUser.role === "super_admin" ? "Super Admin" : "Operations Admin"}
                </span>
              </p>
            </div>

            <div className="flex gap-2 self-start">
              <Button variant="outline" size="sm" onClick={loadOrders} disabled={ordersLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {ordersLoading ? "Yükleniyor..." : "Yenile"}
              </Button>

              <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)}>
                <Download className="h-4 w-4 mr-2" /> CSV İndir
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Çıkış
              </Button>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Toplam Sipariş", value: stats.total, color: "text-foreground" },
              { label: "Beklemede", value: stats.pending, color: "text-yellow-600" },
              { label: "Hazırlanan / Yolda", value: stats.delivering, color: "text-blue-600" },
              { label: "Teslim Edildi", value: stats.delivered, color: "text-green-600" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtreler */}
          <div
            className="bg-card rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-end"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtrele:
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-sm", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {dateFrom ? format(dateFrom, "d MMM", { locale: tr }) : "Başlangıç"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("text-sm", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {dateTo ? format(dateTo, "d MMM", { locale: tr }) : "Bitiş"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Sipariş listesi */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Sipariş bulunamadı</p>
              <p className="text-sm mt-1">Henüz sipariş yok veya filtreleri değiştirin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const cfg = statusConfig[order.status];
                const StatusIcon = cfg.icon;

                const itemsSummary = order.items.map((item) => {
                  const lineTotal = Number(item.line_total || 0);
                  return {
                    label: `${item.product_name_snapshot}${item.volume_snapshot ? ` - ${item.volume_snapshot}` : ""}${item.unit_snapshot ? ` ${item.unit_snapshot}` : ""} × ${item.quantity}`,
                    lineTotal,
                  };
                });

                return (
                  <div key={order.id} className="bg-card rounded-xl p-5 md:p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{order.guest_name || "Misafir Siparişi"}</h3>
                          <Badge variant="outline" className={cn("text-xs border", cfg.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <div className="sm:col-span-2">
                            {itemsSummary.map((item, index) => (
                              <p key={index}>
                                📦 {item.label} = <span className="font-semibold text-primary">{item.lineTotal} ₺</span>
                              </p>
                            ))}
                          </div>

                          <p>📅 {format(parseISO(order.delivery_date), "d MMMM yyyy", { locale: tr })} · {order.time_slot}</p>
                          <p>📞 {order.guest_phone || "—"}</p>
                          <p>✉️ {order.guest_email || "—"}</p>
                          <p className="sm:col-span-2">
                            📍 {order.il} / {order.ilce}
                            {order.mahalle ? ` / ${order.mahalle}` : ""} — {order.address}
                          </p>
                          {order.notes && <p className="sm:col-span-2 italic">💬 {order.notes}</p>}
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                          Toplam: {Number(order.total_amount || 0)} TL
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Oluşturulma: {format(parseISO(order.created_at), "d MMM yyyy HH:mm", { locale: tr })}
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col gap-2">
                        <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, c]) => (
                              <SelectItem key={key} value={key}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {adminUser.role === "super_admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOrder(order.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Siparişi Sil
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Teslimat Bölgesi Yönetimi */}
          <div className="mt-10">
            <DeliveryZoneManager />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;

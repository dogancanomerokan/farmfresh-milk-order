import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  addDays,
} from "date-fns";
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
  Users,
  Hand,
  MapPinned,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  claimed_by_admin_id: string | null;
  claimed_at: string | null;
  delivered_by_admin_id: string | null;
  delivered_at: string | null;
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

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: "Beklemede",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  approved: {
    label: "Onaylandı",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  preparing: {
    label: "Hazırlanıyor",
    icon: Package,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  delivering: {
    label: "Yolda",
    icon: Truck,
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  delivered: {
    label: "Teslim Edildi",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "İptal",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
  },
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
    "Siparişi Alan",
    "Teslim Eden",
    "Notlar",
    "Oluşturulma",
  ];

  const rows = orders.map((o) => {
    const productsText = o.items
      .map((item) => {
        const total = Number(item.line_total || 0);
        return `${item.product_name_snapshot} ${item.volume_snapshot || ""} ${
          item.unit_snapshot || ""
        } x${item.quantity} (${total} TL)`.trim();
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
      o.claimed_by_admin_id || "",
      o.delivered_by_admin_id || "",
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

  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminRole, setNewAdminRole] =
    useState<AdminRole>("operations_admin");
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const getAdminNameById = (adminId: string | null) => {
    if (!adminId) return "—";
    const found = adminUsers.find((a) => a.id === adminId);
    return found?.full_name || found?.email || "Bilinmiyor";
  };

  const getFullAddress = (order: AdminOrder) => {
  return [order.address, order.mahalle, order.ilce, order.il, "Türkiye"]
    .filter(Boolean)
    .join(", ");
};

const openAddressInMap = (order: AdminOrder) => {
  const fullAddress = getFullAddress(order);

  if (!fullAddress.trim()) {
    toast.error("Adres bulunamadı");
    return;
  }

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  window.open(mapUrl, "_blank", "noopener,noreferrer");
};

    if (!fullAddress.trim()) {
      toast.error("Adres bulunamadı");
      return;
    }

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fullAddress
    )}`;

    window.open(mapUrl, "_blank", "noopener,noreferrer");
  };

  const canEditOrder = (order: AdminOrder) => {
    if (!adminUser) return false;
    if (adminUser.role === "super_admin") return true;
    if (!order.claimed_by_admin_id) return true;
    return order.claimed_by_admin_id === adminUser.id;
  };

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

  useEffect(() => {
    if (authorized && adminUser) {
      loadAdminUsers();
    }
  }, [authorized, adminUser?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Çıkış yapıldı");
    window.location.href = "/";
  };

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      const targetOrder = orders.find((o) => o.id === id);
      if (!targetOrder) return;

      if (adminUser?.role !== "super_admin") {
        if (
          targetOrder.claimed_by_admin_id &&
          targetOrder.claimed_by_admin_id !== adminUser?.id
        ) {
          toast.error("Bu sipariş başka bir operasyon adminin üzerinde.");
          return;
        }
      }

      const updatePayload: Partial<OrderRow> = {
        status,
      };

      if (status === "delivered" && adminUser) {
        updatePayload.delivered_by_admin_id = adminUser.id;
        updatePayload.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("orders")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                delivered_by_admin_id:
                  status === "delivered" && adminUser
                    ? adminUser.id
                    : o.delivered_by_admin_id,
                delivered_at:
                  status === "delivered"
                    ? new Date().toISOString()
                    : o.delivered_at,
              }
            : o
        )
      );

      toast.success(
        `Sipariş durumu "${statusConfig[status].label}" olarak güncellendi`
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Durum güncellenemedi");
    }
  };

  const claimOrder = async (orderId: string) => {
    if (!adminUser) return;

    try {
      const targetOrder = orders.find((o) => o.id === orderId);
      if (!targetOrder) return;

      if (
        targetOrder.claimed_by_admin_id &&
        targetOrder.claimed_by_admin_id !== adminUser.id
      ) {
        toast.error("Bu sipariş başka bir admin tarafından alınmış.");
        return;
      }

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          claimed_by_admin_id: adminUser.id,
          claimed_at: now,
        })
        .eq("id", orderId)
        .is("claimed_by_admin_id", null);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                claimed_by_admin_id: adminUser.id,
                claimed_at: now,
              }
            : o
        )
      );

      toast.success("Sipariş üzerinize alındı");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Sipariş alınamadı");
    }
  };

  const unclaimOrder = async (orderId: string) => {
    if (!adminUser) return;

    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const canUnclaim =
      adminUser.role === "super_admin" ||
      targetOrder.claimed_by_admin_id === adminUser.id;

    if (!canUnclaim) {
      toast.error("Bu siparişi bırakma yetkiniz yok");
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          claimed_by_admin_id: null,
          claimed_at: null,
        })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                claimed_by_admin_id: null,
                claimed_at: null,
              }
            : o
        )
      );

      toast.success("Sipariş boşa çıkarıldı");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Sipariş boşa çıkarılamadı");
    }
  };

  const deleteOrder = async (id: string) => {
    if (adminUser?.role !== "super_admin") {
      toast.error("Bu işlem için yetkiniz yok");
      return;
    }

    const confirmed = window.confirm(
      "Bu siparişi silmek istediğinize emin misiniz?"
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("orders").delete().eq("id", id);

      if (error) throw error;

      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Sipariş silindi");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Sipariş silinemedi");
    }
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
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivering: orders.filter(
      (o) => o.status === "delivering" || o.status === "preparing"
    ).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const today = new Date();
  const tomorrow = addDays(new Date(), 1);

  const todaysOrders = orders.filter((o) =>
    isSameDay(parseISO(o.delivery_date), today)
  );

  const tomorrowsOrders = orders.filter((o) =>
    isSameDay(parseISO(o.delivery_date), tomorrow)
  );

  const myDeliveredOrders = adminUser
    ? orders.filter(
        (o) =>
          o.status === "delivered" &&
          o.delivered_by_admin_id === adminUser.id
      )
    : [];

  const claimedOrders = adminUser
    ? orders.filter((o) => o.claimed_by_admin_id === adminUser.id)
    : [];

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
                Sipariş Paneli
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
                onClick={loadOrders}
                disabled={ordersLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {ordersLoading ? "Yükleniyor..." : "Yenile"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(filtered)}
              >
                <Download className="h-4 w-4 mr-2" /> CSV İndir
              </Button>

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Çıkış
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Toplam Sipariş",
                value: stats.total,
                color: "text-foreground",
              },
              {
                label: "Bugün Teslimat",
                value: todaysOrders.length,
                color: "text-primary",
              },
              {
                label: "Beklemede",
                value: stats.pending,
                color: "text-yellow-600",
              },
              {
                label: "Teslim Edildi",
                value: stats.delivered,
                color: "text-green-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-card rounded-xl p-4 text-center"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div
              className="bg-card rounded-xl p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2
                className="text-lg font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Üzerimdeki Siparişler
              </h2>
              <p className="text-3xl font-bold text-primary">
                {claimedOrders.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Şu anda üzerinizde olan sipariş sayısı
              </p>
            </div>

            <div
              className="bg-card rounded-xl p-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h2
                className="text-lg font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Teslim Ettiklerim
              </h2>
              <p className="text-3xl font-bold text-green-600">
                {myDeliveredOrders.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tarafınızdan teslim edilen sipariş sayısı
              </p>
            </div>
          </div>

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
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-sm",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {dateFrom
                      ? format(dateFrom, "d MMM", { locale: tr })
                      : "Başlangıç"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-sm",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {dateTo
                      ? format(dateTo, "d MMM", { locale: tr })
                      : "Bitiş"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(startOfDay(new Date()));
                  setDateTo(endOfDay(new Date()));
                }}
              >
                Bugün
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextDay = addDays(new Date(), 1);
                  setDateFrom(startOfDay(nextDay));
                  setDateTo(endOfDay(nextDay));
                }}
              >
                Yarın
              </Button>

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

          <div
            className="mb-8 bg-card rounded-xl p-5 md:p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h2
              className="text-xl font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Bugün Teslim Edilecek Siparişler
            </h2>

            {todaysOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bugün için planlanan teslimat yok.
              </p>
            ) : (
              <div className="space-y-3">
                {todaysOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-border rounded-lg p-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {order.guest_name || "Misafir Siparişi"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.time_slot} · {order.il} / {order.ilce}
                        {order.mahalle ? ` / ${order.mahalle}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Üzerinde: {getAdminNameById(order.claimed_by_admin_id)}
                      </p>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs border",
                        statusConfig[order.status].color
                      )}
                    >
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Sipariş bulunamadı</p>
              <p className="text-sm mt-1">
                Henüz sipariş yok veya filtreleri değiştirin.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const cfg = statusConfig[order.status];
                const StatusIcon = cfg.icon;

                const itemsSummary = order.items.map((item) => {
                  const lineTotal = Number(item.line_total || 0);
                  return {
                    label: `${item.product_name_snapshot}${
                      item.volume_snapshot ? ` - ${item.volume_snapshot}` : ""
                    }${item.unit_snapshot ? ` ${item.unit_snapshot}` : ""} × ${
                      item.quantity
                    }`,
                    lineTotal,
                  };
                });

                return (
                  <div
                    key={order.id}
                    className="bg-card rounded-xl p-5 md:p-6"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {order.guest_name || "Misafir Siparişi"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("text-xs border", cfg.color)}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <div className="sm:col-span-2">
                            {itemsSummary.map((item, index) => (
                              <p key={index}>
                                📦 {item.label} ={" "}
                                <span className="font-semibold text-primary">
                                  {item.lineTotal} ₺
                                </span>
                              </p>
                            ))}
                          </div>

                          <p>
                            📅{" "}
                            {format(parseISO(order.delivery_date), "d MMMM yyyy", {
                              locale: tr,
                            })}{" "}
                            · {order.time_slot}
                          </p>
                          <p>📞 {order.guest_phone || "—"}</p>
                          <p>✉️ {order.guest_email || "—"}</p>

                          <div className="sm:col-span-2 flex items-start justify-between gap-3">
                            <p className="min-w-0">
                              📍 {order.il} / {order.ilce}
                              {order.mahalle ? ` / ${order.mahalle}` : ""} —{" "}
                              {order.address}
                            </p>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => openAddressInMap(order)}
                              title="Haritada aç"
                              aria-label="Haritada aç"
                            >
                              <MapPinned className="h-4 w-4" />
                            </Button>
                          </div>

                          {order.notes && (
                            <p className="sm:col-span-2 italic">
                              💬 {order.notes}
                            </p>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                          Toplam: {Number(order.total_amount || 0)} TL
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Oluşturulma:{" "}
                          {format(parseISO(order.created_at), "d MMM yyyy HH:mm", {
                            locale: tr,
                          })}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Üzerinde: {getAdminNameById(order.claimed_by_admin_id)}
                          {order.claimed_at
                            ? ` · ${format(parseISO(order.claimed_at), "d MMM yyyy HH:mm", {
                                locale: tr,
                              })}`
                            : ""}
                        </p>

                        {order.delivered_by_admin_id && (
                          <p className="text-xs text-muted-foreground">
                            Teslim Eden:{" "}
                            {getAdminNameById(order.delivered_by_admin_id)}
                            {order.delivered_at
                              ? ` · ${format(parseISO(order.delivered_at), "d MMM yyyy HH:mm", {
                                  locale: tr,
                                })}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col gap-2">
                        {!order.claimed_by_admin_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => claimOrder(order.id)}
                          >
                            <Hand className="h-4 w-4 mr-2" />
                            Üzerime Al
                          </Button>
                        )}

                        {order.claimed_by_admin_id === adminUser.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unclaimOrder(order.id)}
                          >
                            Siparişi Bırak
                          </Button>
                        )}

                        <Select
                          value={order.status}
                          onValueChange={(v) =>
                            updateStatus(order.id, v as OrderStatus)
                          }
                          disabled={!canEditOrder(order)}
                        >
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

          {adminUser.role === "super_admin" && (
            <div
              className="mt-10 bg-card rounded-xl p-5 md:p-6"
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
                          {format(
                            parseISO(admin.created_at),
                            "d MMM yyyy HH:mm",
                            { locale: tr }
                          )}
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Package, LogOut, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  address?: string | null;
  created_at?: string;
};

type AuthUser = {
  id: string;
  email: string;
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
  status: string;
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
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
};

type MemberOrder = OrderRow & {
  items: OrderItemRow[];
};

const MemberPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<MemberOrder[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const loadMemberData = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login");
        return;
      }

      if (!user.email_confirmed_at) {
        toast.error("Lütfen önce e-posta adresinizi doğrulayın.");
        await supabase.auth.signOut();
        navigate("/login");
        return;
      }

      setAuthUser({
        id: user.id,
        email: user.email || "",
      });

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profil alınamadı:", profileError.message);
      }

      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || "",
          phone: user.user_metadata?.phone || "",
          address: "",
        });
      }

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      const orderIds = (ordersData || []).map((o) => o.id);

      let itemsData: OrderItemRow[] = [];
      if (orderIds.length > 0) {
        const { data: fetchedItems, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });

        if (itemsError) {
          throw itemsError;
        }

        itemsData = fetchedItems || [];
      }

      const mergedOrders: MemberOrder[] = (ordersData || [])
        .map((order) => ({
          ...order,
          items: itemsData.filter((item) => item.order_id === order.id),
        }))
        .filter((order) => order.items.length > 0);

      setOrders(mergedOrders);
    } catch (error: any) {
      console.error("Member page load error:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberData(true);
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMemberData(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled"),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "delivered"),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === "cancelled"),
    [orders]
  );

  const startEdit = () => {
    setFormData({
      name: profile?.full_name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!authUser) return;

    try {
      const payload = {
        id: authUser.id,
        full_name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      const { error } = await supabase.from("profiles").upsert(payload);

      if (error) throw error;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              full_name: formData.name,
              phone: formData.phone || null,
              address: formData.address || null,
            }
          : {
              id: authUser.id,
              full_name: formData.name,
              phone: formData.phone || null,
              address: formData.address || null,
            }
      );

      setEditing(false);
      toast.success("Profil güncellendi");
    } catch (error: any) {
      toast.error(error.message || "Profil güncellenemedi");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Çıkış yapıldı");
    navigate("/");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Teslim Edildi";
      case "cancelled":
        return "İptal";
      case "delivering":
        return "Yolda";
      case "preparing":
        return "Hazırlanıyor";
      case "approved":
        return "Onaylandı";
      default:
        return "Beklemede";
    }
  };

  const getStatusClass = (status: string) => {
    if (status === "delivered") return "bg-green-100 text-green-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    if (status === "delivering") return "bg-blue-100 text-blue-800";
    if (status === "preparing") return "bg-orange-100 text-orange-800";
    if (status === "approved") return "bg-emerald-100 text-emerald-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const renderOrderCard = (order: MemberOrder) => (
    <div key={order.id} className="bg-card rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="space-y-1">
            {order.items.map((item) => (
              <p key={item.id} className="font-semibold text-foreground">
                {item.product_name_snapshot}
                {item.volume_snapshot ? ` - ${item.volume_snapshot}` : ""}
                {item.unit_snapshot ? ` ${item.unit_snapshot}` : ""} × {item.quantity}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">
              📅 {format(parseISO(order.delivery_date), "d MMMM yyyy", { locale: tr })} · {order.time_slot}
            </p>
            <p className="text-sm text-muted-foreground">
              ⏱ Oluşturulma: {format(parseISO(order.created_at), "d MMMM yyyy HH:mm", { locale: tr })}
            </p>
            <p className="text-sm text-muted-foreground">
              📍 {order.il} / {order.ilce}
              {order.mahalle ? ` / ${order.mahalle}` : ""} — {order.address}
            </p>
            {order.notes && (
              <p className="text-sm text-muted-foreground">📝 {order.notes}</p>
            )}
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Toplam:</span>{" "}
            <span className="font-semibold text-foreground">{order.total_amount} TL</span>
          </div>
        </div>

        <span className={`inline-flex items-center whitespace-nowrap shrink-0 self-start text-xs font-medium px-3 py-1 rounded-full ${getStatusClass(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container mx-auto px-4 max-w-4xl">
          <div className="bg-card rounded-2xl p-8 text-center" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!authUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 container mx-auto px-4 max-w-4xl">
        {/* Profile Section */}
        <div className="bg-card rounded-2xl p-6 md:p-8 mb-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {profile?.full_name || "Üye"}
                </h1>
                <p className="text-sm text-muted-foreground">{authUser.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  <Edit3 className="h-4 w-4 mr-1" /> Düzenle
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Çıkış
              </Button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Teslimat adresiniz"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveProfile}>
                  <Save className="h-4 w-4 mr-1" /> Kaydet
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 mr-1" /> İptal
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Telefon:</span>{" "}
                <span className="text-foreground font-medium">{profile?.phone || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Adres:</span>{" "}
                <span className="text-foreground font-medium">{profile?.address || "—"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Active Orders */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Aktif Siparişlerim
            </h2>
            <span className="text-sm text-muted-foreground">({activeOrders.length})</span>
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-muted-foreground">Aktif siparişiniz yok</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/order")}>
                Yeni Sipariş Ver
              </Button>
            </div>
          ) : (
            <div className="space-y-3">{activeOrders.map(renderOrderCard)}</div>
          )}
        </div>

        {/* Completed Orders */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Tamamlanan Siparişler
            </h2>
            <span className="text-sm text-muted-foreground">({completedOrders.length})</span>
          </div>

          {completedOrders.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-muted-foreground">Tamamlanan siparişiniz yok</p>
            </div>
          ) : (
            <div className="space-y-3">{completedOrders.map(renderOrderCard)}</div>
          )}
        </div>

        {/* Cancelled Orders */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              İptal Edilen Siparişler
            </h2>
            <span className="text-sm text-muted-foreground">({cancelledOrders.length})</span>
          </div>

          {cancelledOrders.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-muted-foreground">İptal edilen siparişiniz yok</p>
            </div>
          ) : (
            <div className="space-y-3">{cancelledOrders.map(renderOrderCard)}</div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberPage;

import { useEffect, useState } from "react";
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

type OrderItem = {
  id: string;
  email?: string;
  product: string;
  quantity: string;
  date: string;
  timeSlot: string;
  status?: string;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  Volume: string;
  unit: string;
  price: number;
  active: boolean;
};

const MemberPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);

  useEffect(() => {
    const loadMemberData = async () => {
      setLoading(true);

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

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) {
        console.error("Ürünler alınamadı:", productsError.message);
      } else {
        setProducts(productsData || []);
      }

      const allOrders = JSON.parse(localStorage.getItem("milk-orders") || "[]");
      const filteredOrders = allOrders.filter((o: any) => o.email === user.email);
      setMyOrders(filteredOrders);

      setLoading(false);
    };

    loadMemberData();
  }, [navigate]);

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

    const payload = {
      id: authUser.id,
      full_name: formData.name,
      phone: formData.phone || null,
      address: formData.address || null,
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    if (error) {
      toast.error("Profil güncellenemedi");
      console.error(error);
      return;
    }

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
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Çıkış yapıldı");
    navigate("/");
  };

  const getProductLabel = (productId: string) => {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return productId;
    return `${product.name} - ${product.Volume} ${product.unit}`;
  };

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
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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

        {/* Orders Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Siparişlerim
            </h2>
            <span className="text-sm text-muted-foreground">({myOrders.length})</span>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">Henüz siparişiniz yok</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/order")}>
                İlk Siparişinizi Verin
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((order: any) => (
                  <div key={order.id} className="bg-card rounded-xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {getProductLabel(order.product)} × {order.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          📅 {format(parseISO(order.date), "d MMMM yyyy", { locale: tr })} · {order.timeSlot}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "delivered"
                          ? "Teslim Edildi"
                          : order.status === "cancelled"
                          ? "İptal"
                          : order.status === "delivering"
                          ? "Yolda"
                          : order.status === "preparing"
                          ? "Hazırlanıyor"
                          : "Beklemede"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MemberPage;

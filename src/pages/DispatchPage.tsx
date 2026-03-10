import { useState, useEffect, type ElementType } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Hand,
  MapPinned
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import {
  ACTIVE_ORDER_STATUSES,
  buildGoogleMapsDirectionsUrl
} from "@/lib/routes";

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
  product_name_snapshot: string;
  volume_snapshot: string | null;
  unit_snapshot: string | null;
  quantity: number;
  line_total: number | null;
};

type AdminOrder = OrderRow & {
  items: OrderItemRow[];
};

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: ElementType; color: string }
> = {
  pending: {
    label: "Beklemede",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200"
  },
  approved: {
    label: "Onaylandı",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  preparing: {
    label: "Hazırlanıyor",
    icon: Package,
    color: "bg-blue-100 text-blue-800 border-blue-200"
  },
  delivering: {
    label: "Yolda",
    icon: Truck,
    color: "bg-purple-100 text-purple-800 border-purple-200"
  },
  delivered: {
    label: "Teslim Edildi",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800 border-green-200"
  },
  cancelled: {
    label: "İptal",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200"
  }
};

const DispatchPage = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserRow | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const myRouteOrders = orders.filter(
    (order) =>
      order.claimed_by_admin_id === adminUser?.id &&
      ACTIVE_ORDER_STATUSES.includes(order.status as any) &&
      order.address
  );

  const getAdminNameById = (adminId: string | null) => {
    if (!adminId) return "—";
    if (adminUser?.id === adminId)
      return adminUser.full_name || adminUser.email;
    return "Admin";
  };

  const loadOrders = async () => {
    setOrdersLoading(true);

    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Siparişler yüklenemedi");
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const { data: adminData } = await supabase
          .from("admin_users")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!adminData) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        setAdminUser(adminData);
        setAuthorized(true);

        await loadOrders();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const claimOrder = async (orderId: string) => {
    if (!adminUser) return;

    const { error } = await supabase
      .from("orders")
      .update({
        claimed_by_admin_id: adminUser.id,
        claimed_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (!error) {
      loadOrders();
      toast.success("Sipariş üzerinize alındı");
    }
  };

  const unclaimOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({
        claimed_by_admin_id: null,
        claimed_at: null
      })
      .eq("id", orderId);

    if (!error) {
      loadOrders();
      toast.success("Sipariş boşa çıkarıldı");
    }
  };

  const handleOpenBulkRoute = () => {
    const url = buildGoogleMapsDirectionsUrl(myRouteOrders);

    if (!url) {
      toast.error("Rota için uygun sipariş bulunamadı.");
      return;
    }

    window.open(url, "_blank");
  };

  const today = new Date();

  const todaysOrders = orders.filter(
    (o) =>
      isSameDay(parseISO(o.delivery_date), today) &&
      o.status !== "cancelled" &&
      o.status !== "delivered"
  );

  const claimedOrders = adminUser
    ? orders.filter((o) => o.claimed_by_admin_id === adminUser.id)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">Yükleniyor...</div>
        <Footer />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <ShieldAlert className="mx-auto mb-4" />
          Yetkisiz erişim
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-bold">Dağıtım Paneli</h1>

          <div className="flex gap-2">
            <Button onClick={handleOpenBulkRoute} disabled={!myRouteOrders.length}>
              <MapPinned className="h-4 w-4 mr-2" />
              Benim Rotam
            </Button>

            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </div>

        {claimedOrders.map((order) => {
          const cfg = statusConfig[order.status];
          const StatusIcon = cfg.icon;

          return (
            <div
              key={order.id}
              className="bg-card rounded-xl p-5 mb-4"
            >
              <div className="flex justify-between">

                <div>
                  <h3 className="font-semibold">
                    {order.guest_name || "Misafir"}
                  </h3>

                  <p className="text-sm">
                    {order.il} / {order.ilce}
                  </p>

                  <p className="text-sm">{order.address}</p>
                </div>

                <Badge className={cn("border", cfg.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>

              </div>

              <div className="flex gap-2 mt-4">

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

                {order.claimed_by_admin_id === adminUser?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unclaimOrder(order.id)}
                  >
                    Siparişi Bırak
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const address = [
                      order.address,
                      order.mahalle,
                      order.ilce,
                      order.il,
                      "Türkiye"
                    ]
                      .filter(Boolean)
                      .join(", ");

                    const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      address
                    )}`;

                    window.open(navUrl, "_blank");
                  }}
                >
                  Navigasyon
                </Button>

              </div>
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
};

export default DispatchPage;

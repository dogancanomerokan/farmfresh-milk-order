import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Package,
  LogOut,
  Edit3,
  Save,
  X,
  Gift,
  Trophy,
  ChevronRight,
  Clock,
} from "lucide-react";
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

type MonthlyProgress = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  total_liters: number;
  reward_claimed: boolean;
  vip_level: string | null;
};

type CustomerReward = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  reward_type: string;
  reward_value: number;
  status: string;
  earned_at: string;
  used_at: string | null;
  expires_at: string | null;
};

type ActiveVipLevel = {
  id: string;
  user_id: string;
  source_year: number;
  source_month: number;
  active_year: number;
  active_month: number;
  vip_level: string;
  total_liters: number;
};

type LoyaltyCampaign = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  campaign_rule_types?: {
    code: string;
    name: string;
  } | null;
  campaign_conditions?: {
    condition_key: string;
    condition_value: string;
  }[];
  campaign_rewards?: {
    reward_type: string;
    reward_value: number;
    reward_unit: string | null;
  }[];
};

const MemberPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState<
    "active" | "completed" | "cancelled"
  >("active");

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<MemberOrder[]>([]);
  const [monthlyProgress, setMonthlyProgress] =
    useState<MonthlyProgress | null>(null);
  const [customerRewards, setCustomerRewards] = useState<CustomerReward[]>([]);
  const [loyaltyCampaign, setLoyaltyCampaign] =
    useState<LoyaltyCampaign | null>(null);
  const [activeVipLevel, setActiveVipLevel] =
  useState<ActiveVipLevel | null>(null);

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

      const mergedOrders: MemberOrder[] = (ordersData || [])
        .map((order) => ({
          ...order,
          items: itemsData.filter((item) => item.order_id === order.id),
        }))
        .filter((order) => order.items.length > 0);

      setOrders(mergedOrders);

      const now = new Date();
      const today = now.toISOString().slice(0, 10);

      const { data: activeVipData, error: activeVipError } = await supabase
  .from("customer_active_vip_levels")
  .select("*")
  .eq("user_id", user.id)
  .eq("active_year", now.getFullYear())
  .eq("active_month", now.getMonth() + 1)
  .maybeSingle();

if (activeVipError) {
  console.error("Aktif VIP seviyesi alınamadı:", activeVipError.message);
}

setActiveVipLevel(activeVipData || null);
      
      const { data: progressData } = await supabase
        .from("customer_monthly_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("year", now.getFullYear())
        .eq("month", now.getMonth() + 1)
        .maybeSingle();

      setMonthlyProgress(progressData || null);

      const { data: rewardData } = await supabase
        .from("customer_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      setCustomerRewards(rewardData || []);

      const { data: loyaltyCampaignData, error: loyaltyCampaignError } =
        await supabase
          .from("campaigns")
          .select(`
            id,
            title,
            description,
            start_date,
            end_date,
            campaign_rule_types!inner (
              code,
              name
            ),
            campaign_conditions (
              condition_key,
              condition_value
            ),
            campaign_rewards (
              reward_type,
              reward_value,
              reward_unit
            )
          `)
          .eq("is_active", true)
          .eq("is_archived", false)
          .lte("start_date", today)
          .gte("end_date", today)
          .in("campaign_rule_types.code", [
            "monthly_volume_gift",
            "monthly_volume_reward",
          ])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (loyaltyCampaignError) {
        console.error(
          "Aktif sadakat kampanyası alınamadı:",
          loyaltyCampaignError.message
        );
      }

      setLoyaltyCampaign((loyaltyCampaignData || null) as LoyaltyCampaign | null);
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
    () =>
      orders.filter(
        (o) => o.status !== "delivered" && o.status !== "cancelled"
      ),
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

  const selectedOrders =
    activeOrderTab === "active"
      ? activeOrders
      : activeOrderTab === "completed"
      ? completedOrders
      : cancelledOrders;

  const loyaltyTarget = Number(
    loyaltyCampaign?.campaign_conditions?.find(
      (condition) => condition.condition_key === "monthly_volume_gte"
    )?.condition_value || 0
  );

  const loyaltyReward = loyaltyCampaign?.campaign_rewards?.[0];
  const loyaltyRewardValue = Number(loyaltyReward?.reward_value || 0);
  const loyaltyRewardUnit = loyaltyReward?.reward_unit || "L";

  const hasActiveLoyaltyCampaign = Boolean(
    loyaltyCampaign && loyaltyTarget > 0 && loyaltyRewardValue > 0
  );

  const currentLiters = Number(monthlyProgress?.total_liters || 0);

  const currentVipLevel = activeVipLevel?.vip_level || "Standart";

const vipRanges: Record<string, string> = {
  Standart: "0 - 99 L / Ay",
  Silver: "100 - 249 L / Ay",
  Gold: "250 - 499 L / Ay",
  Platinum: "500+ L / Ay",
};

const vipNextTargets: Record<string, { next: string; target: number } | null> = {
  Standart: { next: "Silver", target: 100 },
  Silver: { next: "Gold", target: 250 },
  Gold: { next: "Platinum", target: 500 },
  Platinum: null,
};

const nextVip = vipNextTargets[currentVipLevel];
const nextVipProgressPercent = nextVip
  ? Math.min((currentLiters / nextVip.target) * 100, 100)
  : 100;
  
  const progressPercent = hasActiveLoyaltyCampaign
    ? Math.min((currentLiters / loyaltyTarget) * 100, 100)
    : 0;

  const remainingLiters = hasActiveLoyaltyCampaign
    ? Math.max(loyaltyTarget - currentLiters, 0)
    : 0;

  const circleRadius = 102;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const arcRatio = 0.78;
  const arcLength = circleCircumference * arcRatio;
  const arcProgressLength = arcLength * (progressPercent / 100);

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

  const renderRewardTitle = (reward: CustomerReward) => {
    if (reward.reward_type === "free_liter") {
      return `${reward.reward_value}${loyaltyRewardUnit} Hediye Süt`;
    }

    return `${reward.reward_value} TL İndirim`;
  };

  const renderOrderRow = (order: MemberOrder) => {
    const firstItem = order.items[0];

    return (
      <div
        key={order.id}
        className="grid gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[1.4fr_1.4fr_1fr_auto]"
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-semibold text-foreground">
              {firstItem?.product_name_snapshot || "Sipariş"}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.items
                .map(
                  (item) =>
                    `${item.product_name_snapshot}${
                      item.volume_snapshot ? ` - ${item.volume_snapshot}` : ""
                    }${item.unit_snapshot ? ` ${item.unit_snapshot}` : ""} × ${
                      item.quantity
                    }`
                )
                .join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Durum: {getStatusLabel(order.status)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Tahmini Teslimat</p>
          <p className="font-medium text-foreground">
            {format(parseISO(order.delivery_date), "d MMMM yyyy", {
              locale: tr,
            })}
          </p>
          <p className="text-sm text-muted-foreground">{order.time_slot}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Toplam Tutar</p>
          <p className="font-semibold text-foreground">{order.total_amount} TL</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="self-center rounded-full"
          onClick={() => navigate(`/member/orders/${order.id}`)}
        >
          Siparişi Görüntüle <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-5xl px-4 pb-20 pt-28">
          <div
            className="rounded-2xl bg-card p-8 text-center"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
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

      <div className="container mx-auto max-w-6xl px-4 pb-20 pt-28">
        <div className="mb-8">
          <h1
            className="text-4xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Üye Alanım
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ana Sayfa › <span className="text-primary">Üye Alanım</span>
          </p>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.7fr]">
          <div
            className="rounded-2xl bg-card p-6"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-5">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-14 w-14 text-primary" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Merhaba,</p>
                <h2
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {profile?.full_name || "Üye"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    Üye
                  </span>
                  <span className="break-all">{authUser.email}</span>
                </div>
                {profile?.created_at && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Üyelik Tarihi:{" "}
                    {format(parseISO(profile.created_at), "dd.MM.yyyy")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl bg-card"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between border-b border-border p-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Profil Bilgilerim
                </h2>
                <p className="text-sm text-muted-foreground">
                  Kişisel bilgilerinizi güncelleyebilirsiniz.
                </p>
              </div>

              <div className="flex gap-2">
                {!editing && (
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Edit3 className="mr-1 h-4 w-4" /> Düzenle
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" /> Çıkış
                </Button>
              </div>
            </div>

            <div className="p-6">
              {editing ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Adres</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-2 md:col-span-3">
                    <Button size="sm" onClick={saveProfile}>
                      <Save className="mr-1 h-4 w-4" /> Kaydet
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(false)}
                    >
                      <X className="mr-1 h-4 w-4" /> İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Ad Soyad</p>
                    <p className="font-medium text-foreground">
                      {profile?.full_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="font-medium text-foreground">
                      {profile?.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adres</p>
                    <p className="font-medium text-foreground">
                      {profile?.address || "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="mb-8 rounded-2xl bg-card p-5 md:p-6"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="mb-5 flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Üye Alanım ve Kampanyalarım
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div
              className={`rounded-2xl border border-border bg-background p-5 ${
                !hasActiveLoyaltyCampaign ? "opacity-70" : ""
              }`}
            >
              <h3 className="font-bold text-foreground">
                Aylık Sadakat İlerlemesi
              </h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveLoyaltyCampaign
                  ? loyaltyCampaign?.title
                  : "Bu türde aktif kampanya yok"}
              </p>

              <div className="relative mx-auto mt-5 flex h-72 w-72 max-w-full items-center justify-center">
                <svg className="absolute inset-0 h-full w-full">
                  <circle
                    cx="50%"
                    cy="50%"
                    r={circleRadius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcLength} ${circleCircumference}`}
                    strokeDashoffset="0"
                    transform="rotate(130 144 144)"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r={circleRadius}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${arcProgressLength} ${circleCircumference}`}
                    strokeDashoffset="0"
                    transform="rotate(130 144 144)"
                  />
                </svg>

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <img
                    src="/icons/milk-glass-transparent.png"
                    alt="Süt Bardağı"
                    className="h-28 w-auto object-contain drop-shadow-md"
                  />

                  <p className="mt-3 text-2xl font-bold text-muted-foreground">
                    {hasActiveLoyaltyCampaign
                      ? `${currentLiters}/${loyaltyTarget}`
                      : "—"}
                  </p>

                  <p className="text-sm text-muted-foreground">Litre</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm">
                {!hasActiveLoyaltyCampaign ? (
                  <>
                    <p className="text-muted-foreground">
                      Bu türde bir kampanya henüz tanımlı değil.
                    </p>
                    <p className="font-semibold text-primary">
                      Yeni kampanya tanımlandığında burada görünecek.
                    </p>
                  </>
                ) : remainingLiters > 0 ? (
                  <>
                    <p className="text-muted-foreground">
                      Bu ay {remainingLiters} L daha alım yaparak
                    </p>
                    <p className="font-semibold text-primary">
                      {loyaltyRewardValue}
                      {loyaltyRewardUnit} hediye süt kazanabilirsiniz.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Tebrikler! Hedefi tamamladınız.
                    </p>
                    <p className="font-semibold text-primary">
                      Hediyeniz hazır 🎁
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background p-5">
              <h3 className="font-bold text-foreground">Kazanılan Ödüller</h3>
              <p className="text-sm text-muted-foreground">
                Kullanılabilir ödülleriniz
              </p>

              <div className="mt-5 space-y-3">
                {customerRewards.length === 0 ? (
                  <div className="rounded-xl border border-border p-5 text-sm text-muted-foreground">
                    Henüz kazanılmış ödülünüz yok.
                  </div>
                ) : (
                  customerRewards.slice(0, 3).map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {renderRewardTitle(reward)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Kazanım:{" "}
                          {format(parseISO(reward.earned_at), "dd.MM.yyyy")}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            reward.status === "earned"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {reward.status === "earned"
                            ? "Kullanılabilir"
                            : "Kullanıldı"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-lg font-bold">
                          {reward.reward_value}
                        </span>
                        <span className="text-sm">
                          {reward.reward_type === "free_liter"
                            ? loyaltyRewardUnit
                            : "TL"}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {customerRewards.length > 3 && (
                <button className="mx-auto mt-5 flex items-center gap-1 text-sm font-semibold text-primary">
                  Tüm ödülleri gör <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-background p-5">
              <h3 className="font-bold text-foreground">Üyelik Segmentiniz</h3>
              <p className="text-sm text-muted-foreground">Sadakat seviyeniz</p>

              <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center rounded-full border-4 border-primary bg-primary/5">
                <div className="text-center">
                  <img
                    src="/icons/cow-head-transparent.png"
                    alt="Üyelik Segmenti"
                    className="mx-auto mb-3 h-20 w-20 object-contain"
                  />
                  <p className="text-2xl font-bold text-primary">
                    {monthlyProgress?.vip_level || "Standart"}
                  </p>
                  <p className="text-sm text-muted-foreground">0 - 99 L / Ay</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-muted/40 p-4">
                <p className="font-semibold text-foreground">
                  Sonraki seviye: Silver
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Bu ay 50 L kazanarak Silver seviyesine yükselebilirsiniz.
                </p>

                <div className="mt-4 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="mt-2 text-right text-sm text-muted-foreground">
                  {currentLiters} / {hasActiveLoyaltyCampaign ? loyaltyTarget : 50} L
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl bg-card p-5 md:p-6"
          style={{ boxShadow: "var(--shadow-elevated)" }}
        >
          <div className="mb-5 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Siparişlerim
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <Button
              variant={activeOrderTab === "active" ? "default" : "outline"}
              onClick={() => setActiveOrderTab("active")}
              className="rounded-full"
            >
              Aktif Siparişler ({activeOrders.length})
            </Button>

            <Button
              variant={activeOrderTab === "completed" ? "default" : "outline"}
              onClick={() => setActiveOrderTab("completed")}
              className="rounded-full"
            >
              Tamamlanan Siparişler ({completedOrders.length})
            </Button>

            <Button
              variant={activeOrderTab === "cancelled" ? "default" : "outline"}
              onClick={() => setActiveOrderTab("cancelled")}
              className="rounded-full"
            >
              İptal Edilen Siparişler ({cancelledOrders.length})
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            {selectedOrders.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-muted-foreground">Bu alanda sipariş yok.</p>
                {activeOrderTab === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/order")}
                  >
                    Yeni Sipariş Ver
                  </Button>
                )}
              </div>
            ) : (
              selectedOrders.map(renderOrderRow)
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MemberPage;

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { X } from "lucide-react";
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
import { supabase } from "@/lib/supabaseClient";

type CustomerOverviewRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  profile_created_at: string | null;
  is_frozen: boolean;
  frozen_reason: string | null;
  frozen_at: string | null;
  total_orders: number | null;
  total_spent: number | null;
  last_order_at: string | null;
  last_delivery_date: string | null;
  pending_orders: number | null;
  approved_orders: number | null;
  preparing_orders: number | null;
  delivering_orders: number | null;
  delivered_orders: number | null;
  cancelled_orders: number | null;
};

type OrderHistoryItem = {
  order_id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  il: string | null;
  ilce: string | null;
  mahalle: string | null;
  address: string | null;
  delivery_date: string;
  time_slot: string | null;
  notes: string | null;
  status:
    | "pending"
    | "approved"
    | "preparing"
    | "delivering"
    | "delivered"
    | "cancelled";
  total_amount: number | null;
  created_at: string;
  items: Array<{
    id: string;
    product_name_snapshot: string;
    volume_snapshot: string | null;
    unit_snapshot: string | null;
    quantity: number;
    line_total: number | null;
  }> | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  customer: CustomerOverviewRow | null;
  adminId: string;
  onUpdated?: () => Promise<void> | void;
};

type OrderFilter =
  | "active"
  | "all"
  | "pending"
  | "approved"
  | "preparing"
  | "delivering"
  | "delivered"
  | "cancelled";

export default function CustomerDetailDrawer({
  open,
  onClose,
  customer,
  adminId,
  onUpdated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("active");

  const [freezeReason, setFreezeReason] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [savingFreeze, setSavingFreeze] = useState(false);
  const [savingCancel, setSavingCancel] = useState(false);

  const loadCustomerData = async () => {
    if (!customer?.user_id) return;

    setLoading(true);
    try {
      const [{ data: controlData, error: controlError }, { data: orderData, error: orderError }] =
        await Promise.all([
          supabase
            .from("customer_account_controls")
            .select("*")
            .eq("user_id", customer.user_id)
            .maybeSingle(),
          supabase
            .from("customer_order_history")
            .select("*")
            .eq("user_id", customer.user_id)
            .order("created_at", { ascending: false }),
        ]);

      if (controlError) throw controlError;
      if (orderError) throw orderError;

      setIsFrozen(Boolean(controlData?.is_frozen ?? customer.is_frozen));
      setFreezeReason(controlData?.frozen_reason || customer.frozen_reason || "");
      setOrders((orderData as OrderHistoryItem[]) || []);
      setSelectedOrderId(null);
      setCancelReason("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Müşteri detayları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer?.user_id) {
      loadCustomerData();
    }
  }, [open, customer?.user_id]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "active") {
      return orders.filter(
        (o) => o.status !== "cancelled" && o.status !== "delivered"
      );
    }

    if (orderFilter === "all") return orders;

    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.order_id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const handleFreezeToggle = async () => {
    if (!customer?.user_id) return;

    setSavingFreeze(true);
    try {
      const nextFrozen = !isFrozen;

      const payload = {
        user_id: customer.user_id,
        is_frozen: nextFrozen,
        frozen_reason: nextFrozen ? freezeReason.trim() || null : null,
        frozen_by_admin_id: nextFrozen ? adminId : null,
        frozen_at: nextFrozen ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("customer_account_controls")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      setIsFrozen(nextFrozen);
      toast.success(nextFrozen ? "Hesap donduruldu" : "Hesap tekrar aktifleştirildi");
      await onUpdated?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Hesap durumu güncellenemedi");
    } finally {
      setSavingFreeze(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) {
      toast.error("Önce bir sipariş seçin");
      return;
    }

    if (!cancelReason.trim()) {
      toast.error("İptal nedeni gerekli");
      return;
    }

    setSavingCancel(true);
    try {
      const { error: insertError } = await supabase
        .from("order_cancellations")
        .insert({
          order_id: selectedOrder.order_id,
          cancelled_by_admin_id: adminId,
          cancellation_reason: cancelReason.trim(),
          email_sent: false,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", selectedOrder.order_id);

      if (updateError) throw updateError;

      toast.success("Sipariş iptal edildi");
      setSelectedOrderId(null);
      setCancelReason("");
      await loadCustomerData();
      await onUpdated?.();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Sipariş iptal edilemedi");
    } finally {
      setSavingCancel(false);
    }
  };

  if (!open || !customer) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-[60]"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-[820px] bg-background z-[70] border-l border-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              {customer.full_name || "İsimsiz Müşteri"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {customer.phone || "Telefon yok"} · {customer.address || "Adres yok"}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <div className="text-sm text-muted-foreground">Yükleniyor...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="bg-card rounded-xl p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-sm text-muted-foreground">Toplam Sipariş</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {customer.total_orders || 0}
                  </p>
                </div>

                <div
                  className="bg-card rounded-xl p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-sm text-muted-foreground">Toplam Harcama</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {Number(customer.total_spent || 0)} TL
                  </p>
                </div>

                <div
                  className="bg-card rounded-xl p-4"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <p className="text-sm text-muted-foreground">Hesap Durumu</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      isFrozen ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isFrozen ? "Dondurulmuş" : "Aktif"}
                  </p>
                </div>
              </div>

              <div
                className="bg-card rounded-xl p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h4 className="text-xl font-bold text-foreground mb-4">
                  Hesap İşlemleri
                </h4>

                <div className="space-y-3">
                  <Input
                    placeholder="Dondurma nedeni"
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                  />

                  <Button
                    variant={isFrozen ? "outline" : "destructive"}
                    onClick={handleFreezeToggle}
                    disabled={savingFreeze}
                  >
                    {savingFreeze
                      ? "İşleniyor..."
                      : isFrozen
                      ? "Hesabı Aktif Et"
                      : "Hesabı Dondur"}
                  </Button>
                </div>
              </div>

              <div
                className="bg-card rounded-xl p-5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-foreground">
                      Sipariş Geçmişi
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Filtrelenmiş sipariş toplamı: {filteredOrders.length} adet ·{" "}
                      {filteredOrders.reduce(
                        (sum, order) => sum + Number(order.total_amount || 0),
                        0
                      )}{" "}
                      TL
                    </p>
                  </div>

                  <Select
                    value={orderFilter}
                    onValueChange={(v) => setOrderFilter(v as OrderFilter)}
                  >
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif Siparişler</SelectItem>
                      <SelectItem value="all">Tüm Siparişler</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="approved">Onaylandı</SelectItem>
                      <SelectItem value="preparing">Hazırlanıyor</SelectItem>
                      <SelectItem value="delivering">Yolda</SelectItem>
                      <SelectItem value="delivered">Teslim Edildi</SelectItem>
                      <SelectItem value="cancelled">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Bu filtreye uygun sipariş bulunamadı.
                    </p>
                  ) : (
                    filteredOrders.map((order) => (
                      <label
                        key={order.order_id}
                        className="block border border-border rounded-xl p-5 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="font-semibold text-foreground">
                              Sipariş #{order.order_id.slice(0, 8)}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(order.created_at), "d MMM yyyy HH:mm", {
                                locale: tr,
                              })}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              📅{" "}
                              {format(parseISO(order.delivery_date), "d MMMM yyyy", {
                                locale: tr,
                              })}{" "}
                              · {order.time_slot}
                            </p>

                            <p className="text-sm text-muted-foreground">
                              📍 {order.il} / {order.ilce}
                              {order.mahalle ? ` / ${order.mahalle}` : ""} —{" "}
                              {order.address}
                            </p>

                            <p className="text-sm font-semibold text-foreground">
                              Toplam: {Number(order.total_amount || 0)} TL
                            </p>

                            {order.items?.length ? (
                              <div className="space-y-1">
                                {order.items.map((item) => (
                                  <p
                                    key={item.id}
                                    className="text-sm text-foreground"
                                  >
                                    • {item.product_name_snapshot}
                                    {item.volume_snapshot
                                      ? ` - ${item.volume_snapshot}`
                                      : ""}
                                    {item.unit_snapshot
                                      ? ` ${item.unit_snapshot}`
                                      : ""}{" "}
                                    × {item.quantity}
                                  </p>
                                ))}
                              </div>
                            ) : null}

                            <div className="pt-1">
                              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="radio"
                                  name="selected-order"
                                  checked={selectedOrderId === order.order_id}
                                  onChange={() => setSelectedOrderId(order.order_id)}
                                />
                                Bu siparişi seç
                              </label>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                              order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status === "pending" && "Beklemede"}
                            {order.status === "approved" && "Onaylandı"}
                            {order.status === "preparing" && "Hazırlanıyor"}
                            {order.status === "delivering" && "Yolda"}
                            {order.status === "delivered" && "Teslim Edildi"}
                            {order.status === "cancelled" && "İptal"}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <Input
                    placeholder="İptal nedeni"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />

                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={!selectedOrderId || savingCancel}
                  >
                    {savingCancel ? "İşleniyor..." : "Siparişi İptal Et"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

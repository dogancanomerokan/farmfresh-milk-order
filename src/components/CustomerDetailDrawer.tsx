import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
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
import type {
    CustomerOverviewRow,
    CustomerOrderHistoryRow,
} from "@/lib/customerService";
import {
    cancelCustomerOrder,
    freezeCustomer,
    getCustomerOrders,
    unfreezeCustomer,
} from "@/lib/customerService";

type Props = {
    open: boolean;
    onClose: () => void;
    customer: CustomerOverviewRow | null;
    adminId: string;
    onUpdated: () => Promise<void> | void;
};

const statusOptions = [
    { value: "all", label: "Tüm Siparişler" },
    { value: "pending", label: "Beklemede" },
    { value: "approved", label: "Onaylandı" },
    { value: "preparing", label: "Hazırlanıyor" },
    { value: "delivering", label: "Yolda" },
    { value: "delivered", label: "Teslim Edildi" },
    { value: "cancelled", label: "İptal" },
];

const getStatusBadgeClass = (status: string) => {
    if (status === "delivered") return "bg-green-100 text-green-800 border-green-200";
    if (status === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    if (status === "delivering") return "bg-purple-100 text-purple-800 border-purple-200";
    if (status === "preparing") return "bg-blue-100 text-blue-800 border-blue-200";
    if (status === "approved") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
};

export default function CustomerDetailDrawer({
    open,
    onClose,
    customer,
    adminId,
    onUpdated,
}: Props) {
    const [orders, setOrders] = useState<CustomerOrderHistoryRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [freezeReason, setFreezeReason] = useState("");
    const [cancelReason, setCancelReason] = useState("");
    const [selectedOrderId, setSelectedOrderId] = useState("");

    const loadOrders = async () => {
        if (!customer) return;
        setLoading(true);
        try {
            const data = await getCustomerOrders(customer.user_id, statusFilter);
            setOrders(data);
        } catch (error: any) {
            toast.error(error.message || "Sipariş geçmişi alınamadı");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && customer) {
            loadOrders();
            setFreezeReason(customer.frozen_reason || "");
            setCancelReason("");
            setSelectedOrderId("");
        }
    }, [open, customer?.user_id, statusFilter]);

    const totalOrderAmount = useMemo(
        () => orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        [orders]
    );

    const handleFreezeToggle = async () => {
        if (!customer) return;

        try {
            if (customer.is_frozen) {
                await unfreezeCustomer(customer.user_id);
                toast.success("Müşteri hesabı yeniden aktif edildi");
            } else {
                await freezeCustomer(customer.user_id, freezeReason, adminId);
                toast.success("Müşteri hesabı donduruldu");
            }

            await onUpdated();
            await loadOrders();
        } catch (error: any) {
            toast.error(error.message || "Hesap durumu güncellenemedi");
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId) {
            toast.error("Önce iptal edilecek siparişi seçin");
            return;
        }

        const confirmed = window.confirm("Bu siparişi iptal etmek istediğinize emin misiniz?");
        if (!confirmed) return;

        try {
            await cancelCustomerOrder(selectedOrderId, adminId, cancelReason);
            toast.success("Sipariş iptal edildi. Mail gönderildi.");
            await onUpdated();
            await loadOrders();
            setCancelReason("");
        } catch (error: any) {
            toast.error(error.message || "Sipariş iptal edilemedi");
        }
    };

    if (!open || !customer) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/40">
            <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-background shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{customer.full_name || "İsimsiz Müşteri"}</h2>
                        <p className="text-sm text-muted-foreground">
                            {customer.phone || "Telefon yok"} · {customer.address || "Adres yok"}
                        </p>
                    </div>

                    <Button variant="ghost" onClick={onClose}>
                        Kapat
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-xs text-muted-foreground">Toplam Sipariş</p>
                            <p className="text-2xl font-bold">{customer.total_orders}</p>
                        </div>
                        <div className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-xs text-muted-foreground">Toplam Harcama</p>
                            <p className="text-2xl font-bold">{Number(customer.total_spent || 0)} TL</p>
                        </div>
                        <div className="bg-card rounded-xl p-4" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-xs text-muted-foreground">Hesap Durumu</p>
                            <p className={`text-lg font-bold ${customer.is_frozen ? "text-red-600" : "text-green-600"}`}>
                                {customer.is_frozen ? "Donduruldu" : "Aktif"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-card rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                        <h3 className="text-lg font-bold text-foreground">Hesap İşlemleri</h3>

                        <Input
                            placeholder="Dondurma nedeni"
                            value={freezeReason}
                            onChange={(e) => setFreezeReason(e.target.value)}
                        />

                        <Button
                            variant={customer.is_frozen ? "default" : "destructive"}
                            onClick={handleFreezeToggle}
                        >
                            {customer.is_frozen ? "Hesabı Yeniden Aktif Et" : "Hesabı Dondur"}
                        </Button>

                        {customer.frozen_reason && (
                            <p className="text-sm text-muted-foreground">
                                Mevcut neden: {customer.frozen_reason}
                            </p>
                        )}
                    </div>

                    <div className="bg-card rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h3 className="text-lg font-bold text-foreground">Sipariş Geçmişi</h3>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            Filtrelenmiş sipariş toplamı: {orders.length} adet · {totalOrderAmount} TL
                        </p>

                        {loading ? (
                            <p className="text-sm text-muted-foreground">Siparişler yükleniyor...</p>
                        ) : orders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sipariş bulunamadı.</p>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <div
                                        key={order.order_id}
                                        className="border border-border rounded-xl p-4 space-y-2"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-foreground">Sipariş #{order.order_id.slice(0, 8)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(parseISO(order.created_at), "d MMM yyyy HH:mm", { locale: tr })}
                                                </p>
                                            </div>

                                            <Badge variant="outline" className={`border ${getStatusBadgeClass(order.status)}`}>
                                                {statusOptions.find((x) => x.value === order.status)?.label || order.status}
                                            </Badge>
                                        </div>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p>
                                                📅 {format(parseISO(order.delivery_date), "d MMMM yyyy", { locale: tr })} · {order.time_slot}
                                            </p>
                                            <p>
                                                📍 {order.il} / {order.ilce}
                                                {order.mahalle ? ` / ${order.mahalle}` : ""} — {order.address}
                                            </p>
                                            <p>Toplam: <span className="font-semibold text-foreground">{Number(order.total_amount || 0)} TL</span></p>
                                            {order.notes && <p>📝 {order.notes}</p>}
                                        </div>

                                        <div className="space-y-1">
                                            {order.items?.map((item) => (
                                                <p key={item.id} className="text-sm text-foreground">
                                                    • {item.product_name_snapshot}
                                                    {item.volume_snapshot ? ` - ${item.volume_snapshot}` : ""}
                                                    {item.unit_snapshot ? ` ${item.unit_snapshot}` : ""} × {item.quantity}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="pt-2">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="radio"
                                                    name="selectedOrder"
                                                    checked={selectedOrderId === order.order_id}
                                                    onChange={() => setSelectedOrderId(order.order_id)}
                                                />
                                                Bu siparişi seç
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card rounded-xl p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
                        <h3 className="text-lg font-bold text-foreground">Seçili Siparişi İptal Et</h3>

                        <Input
                            placeholder="İptal nedeni"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />

                        <Button variant="destructive" onClick={handleCancelOrder}>
                            Siparişi İptal Et
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            Mail gönderimini sonraki adımda Resend veya Brevo ile bağlayacağız.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, Package, Clock, CheckCircle2, Truck, XCircle, Filter, RefreshCw, Download, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";

// ⚠️ Basit şifre koruması — production'da backend auth kullanılmalı
const ADMIN_PASSWORD = "sadesut2024";

type OrderStatus = "pending" | "preparing" | "delivering" | "delivered" | "cancelled";

interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  product: string;
  quantity: string;
  timeSlot: string;
  notes: string;
  date: string;
  createdAt: string;
  status?: OrderStatus;
}

const productNames: Record<string, string> = {
  "glass-1l": "1L Cam Şişe",
  "pet-3l": "3L PET Şişe",
  "pet-5l": "5L PET Şişe",
};

const productPrices: Record<string, number> = {
  "glass-1l": 100,
  "pet-3l": 130,
  "pet-5l": 200,
};

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Beklemede", icon: Clock, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  preparing: { label: "Hazırlanıyor", icon: Package, color: "bg-blue-100 text-blue-800 border-blue-200" },
  delivering: { label: "Yolda", icon: Truck, color: "bg-purple-100 text-purple-800 border-purple-200" },
  delivered: { label: "Teslim Edildi", icon: CheckCircle2, color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "İptal", icon: XCircle, color: "bg-red-100 text-red-800 border-red-200" },
};

/* ─── CSV Export ─── */
const exportToCSV = (orders: Order[]) => {
  const headers = ["ID", "Ad Soyad", "E-posta", "Telefon", "Adres", "Ürün", "Adet", "Birim Fiyat", "Toplam", "Teslimat Tarihi", "Teslimat Saati", "Durum", "Notlar", "Oluşturulma"];
  const rows = orders.map((o) => {
    const unitPrice = productPrices[o.product] || 0;
    const total = unitPrice * parseInt(o.quantity);
    return [
      o.id,
      o.name,
      o.email,
      o.phone,
      `"${o.address.replace(/"/g, '""')}"`,
      productNames[o.product] || o.product,
      o.quantity,
      `${unitPrice} ₺`,
      `${total} ₺`,
      format(parseISO(o.date), "d MMMM yyyy", { locale: tr }),
      o.timeSlot,
      statusConfig[o.status as OrderStatus]?.label || o.status,
      `"${(o.notes || "").replace(/"/g, '""')}"`,
      format(parseISO(o.createdAt), "d MMM yyyy HH:mm", { locale: tr }),
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

/* ─── Login Screen ─── */
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin-auth", "true");
      onLogin();
    } else {
      setError(true);
      toast.error("Yanlış şifre!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-sm bg-card rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <div className="text-center mb-6">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Yönetici Girişi
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Panele erişmek için şifrenizi girin</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pw">Şifre</Label>
              <Input
                id="admin-pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">Şifre hatalı, tekrar deneyin.</p>}
            </div>
            <Button type="submit" className="w-full">Giriş Yap</Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

/* ─── Admin Dashboard ─── */
const AdminPage = () => {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem("admin-auth") === "true");
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const loadOrders = () => {
    const raw = JSON.parse(localStorage.getItem("milk-orders") || "[]") as Order[];
    setOrders(raw.map((o) => ({ ...o, status: o.status || "pending" })));
  };

  useEffect(() => { if (authenticated) loadOrders(); }, [authenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin-auth");
    setAuthenticated(false);
    toast.info("Çıkış yapıldı");
  };

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  const updateStatus = (id: string, status: OrderStatus) => {
    const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(updated);
    localStorage.setItem("milk-orders", JSON.stringify(updated));
    toast.success(`Sipariş durumu "${statusConfig[status].label}" olarak güncellendi`);
  };

  const filtered = orders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .filter((o) => {
      if (!dateFrom && !dateTo) return true;
      const orderDate = parseISO(o.date);
      if (dateFrom && dateTo) return isWithinInterval(orderDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      if (dateFrom) return orderDate >= startOfDay(dateFrom);
      if (dateTo) return orderDate <= endOfDay(dateTo);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivering: orders.filter((o) => o.status === "delivering" || o.status === "preparing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-1">Yönetim</p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Sipariş Paneli
              </h1>
            </div>
            <div className="flex gap-2 self-start">
              <Button variant="outline" size="sm" onClick={loadOrders}>
                <RefreshCw className="h-4 w-4 mr-2" /> Yenile
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
              <div key={s.label} className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filtreler */}
          <div className="bg-card rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-end" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" /> Filtrele:
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
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
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  Temizle
                </Button>
              )}
            </div>
          </div>

          {/* Sipariş Listesi */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Sipariş bulunamadı</p>
              <p className="text-sm mt-1">Henüz sipariş yok veya filtreleri değiştirin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const cfg = statusConfig[order.status as OrderStatus];
                const StatusIcon = cfg.icon;
                const unitPrice = productPrices[order.product] || 0;
                const total = unitPrice * parseInt(order.quantity);

                return (
                  <div key={order.id} className="bg-card rounded-xl p-5 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{order.name}</h3>
                          <Badge variant="outline" className={cn("text-xs border", cfg.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          <p>📦 {productNames[order.product] || order.product} × {order.quantity} = <span className="font-semibold text-primary">{total} ₺</span></p>
                          <p>📅 {format(parseISO(order.date), "d MMMM yyyy", { locale: tr })} · {order.timeSlot}</p>
                          <p>📞 {order.phone}</p>
                          <p>✉️ {order.email}</p>
                          <p className="sm:col-span-2">📍 {order.address}</p>
                          {order.notes && <p className="sm:col-span-2 italic">💬 {order.notes}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Oluşturulma: {format(parseISO(order.createdAt), "d MMM yyyy HH:mm", { locale: tr })}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, c]) => (
                              <SelectItem key={key} value={key}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

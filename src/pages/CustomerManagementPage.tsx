import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import CustomerDetailDrawer from "@/components/admin/customers/CustomerDetailDrawer";
import {
    getCustomers,
    type CustomerOverviewRow,
} from "@/lib/customerService";

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

export default function CustomerManagementPage() {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [adminUser, setAdminUser] = useState<AdminUserRow | null>(null);

    const [customersLoading, setCustomersLoading] = useState(false);
    const [customers, setCustomers] = useState<CustomerOverviewRow[]>([]);
    const [search, setSearch] = useState("");
    const [frozenFilter, setFrozenFilter] = useState("all");

    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOverviewRow | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const loadCustomers = async () => {
        setCustomersLoading(true);
        try {
            const data = await getCustomers(search, frozenFilter);
            setCustomers(data);
        } catch (error: any) {
            toast.error(error.message || "Müşteriler yüklenemedi");
        } finally {
            setCustomersLoading(false);
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

                if (authError || !user || !user.email_confirmed_at) {
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
                await loadCustomers();
            } catch (error: any) {
                toast.error(error.message || "Yetki kontrolü yapılamadı");
                setAuthorized(false);
                setAdminUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAdminAccess();
    }, []);

    const filteredStats = useMemo(() => {
        return {
            total: customers.length,
            frozen: customers.filter((c) => c.is_frozen).length,
            active: customers.filter((c) => !c.is_frozen).length,
            withOrders: customers.filter((c) => Number(c.total_orders || 0) > 0).length,
        };
    }, [customers]);

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
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Yetkisiz Erişim
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Bu sayfayı görüntülemek için yetkili admin hesabıyla giriş yapmanız gerekiyor.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => (window.location.href = "/login")}>
                                Giriş Yap
                            </Button>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-6 w-6 text-primary" />
                                <h1 className="text-3xl font-bold text-foreground">Müşteri Yönetimi</h1>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Müşterileri görüntüleyin, geçmiş siparişlerini inceleyin, hesabı dondurun ve sipariş iptal edin.
                            </p>
                        </div>

                        <Button variant="outline" onClick={loadCustomers} disabled={customersLoading}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {customersLoading ? "Yükleniyor..." : "Yenile"}
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-2xl font-bold text-foreground">{filteredStats.total}</p>
                            <p className="text-xs text-muted-foreground mt-1">Toplam Müşteri</p>
                        </div>
                        <div className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-2xl font-bold text-green-600">{filteredStats.active}</p>
                            <p className="text-xs text-muted-foreground mt-1">Aktif Hesap</p>
                        </div>
                        <div className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-2xl font-bold text-red-600">{filteredStats.frozen}</p>
                            <p className="text-xs text-muted-foreground mt-1">Dondurulmuş</p>
                        </div>
                        <div className="bg-card rounded-xl p-4 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
                            <p className="text-2xl font-bold text-primary">{filteredStats.withOrders}</p>
                            <p className="text-xs text-muted-foreground mt-1">Siparişli Müşteri</p>
                        </div>
                    </div>

                    <div
                        className="bg-card rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3"
                        style={{ boxShadow: "var(--shadow-card)" }}
                    >
                        <Input
                            placeholder="Ad, telefon veya adres ile ara"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <Select value={frozenFilter} onValueChange={setFrozenFilter}>
                            <SelectTrigger className="w-full md:w-[220px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Hesaplar</SelectItem>
                                <SelectItem value="active">Sadece Aktif</SelectItem>
                                <SelectItem value="frozen">Sadece Dondurulmuş</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={loadCustomers}>Uygula</Button>
                    </div>

                    {customersLoading ? (
                        <div className="text-center py-16 text-muted-foreground">
                            Müşteriler yükleniyor...
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            Müşteri bulunamadı.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customers.map((customer) => (
                                <div
                                    key={customer.user_id}
                                    className="bg-card rounded-xl p-5 md:p-6"
                                    style={{ boxShadow: "var(--shadow-card)" }}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-foreground">
                                                {customer.full_name || "İsimsiz Müşteri"}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {customer.phone || "Telefon yok"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {customer.address || "Adres yok"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Toplam sipariş: {customer.total_orders} · Toplam harcama: {Number(customer.total_spent || 0)} TL
                                            </p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <span
                                                className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${customer.is_frozen
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {customer.is_frozen ? "Donduruldu" : "Aktif"}
                                            </span>

                                            <Button
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setDrawerOpen(true);
                                                }}
                                            >
                                                Detayları Gör
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CustomerDetailDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                customer={selectedCustomer}
                adminId={adminUser.id}
                onUpdated={loadCustomers}
            />

            <Footer />
        </div>
    );
}
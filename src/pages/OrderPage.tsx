import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderSummary from "@/components/OrderSummary";
import { getDeliveryZones, isAddressAllowed, DeliveryZone } from "@/lib/delivery-zones";
import { getIller, getIlceler } from "@/lib/turkey-data";
import { getMahalleler } from "@/lib/mahalle-data";
import { supabase } from "@/lib/supabaseClient";

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
];

type Product = {
  id: string;
  name: string;
  Volume: string;
  unit: string;
  price: number;
  active: boolean;
};

const OrderPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [date, setDate] = useState<Date>();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [addressWarning, setAddressWarning] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    il: "",
    ilce: "",
    mahalle: "",
    address: "",
    product: "",
    timeSlot: "",
    quantity: "1",
    notes: "",
  });

  useEffect(() => {
    setZones(getDeliveryZones());
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);

      if (error) {
        console.error("Ürünler alınamadı:", error.message);
        toast.error("Ürünler yüklenemedi");
        setProducts([]);
      } else {
        const sortedProducts = (data || []).sort(
          (a, b) => Number(b.Volume) - Number(a.Volume)
        );
        setProducts(sortedProducts);
      }

      setLoadingProducts(false);
    };

    loadProducts();
  }, []);

  const hasZones = zones.length > 0;

  const availableIller = hasZones
    ? [...new Set(zones.map((z) => z.il))].sort((a, b) => a.localeCompare(b, "tr"))
    : getIller();

  const availableIlceler = hasZones
    ? [...new Set(zones.filter((z) => z.il === form.il).map((z) => z.ilce))].sort((a, b) => a.localeCompare(b, "tr"))
    : getIlceler(form.il);

  const adminMahalleler = hasZones
    ? zones.filter((z) => z.il === form.il && z.ilce === form.ilce).flatMap((z) => z.mahalleler)
    : [];

  const dataMahalleler = form.il && form.ilce ? getMahalleler(form.il, form.ilce) : [];
  const availableMahalleler = adminMahalleler.length > 0 ? adminMahalleler : dataMahalleler;
  const showMahalle = availableMahalleler.length > 0;

  useEffect(() => {
    if (availableIller.length === 1 && form.il !== availableIller[0]) {
      setForm((prev) => ({ ...prev, il: availableIller[0], ilce: "", mahalle: "" }));
    }
  }, [availableIller, form.il]);

  useEffect(() => {
    if (!form.il) return;
    if (availableIlceler.length === 1 && form.ilce !== availableIlceler[0]) {
      setForm((prev) => ({ ...prev, ilce: availableIlceler[0], mahalle: "" }));
    }
  }, [form.il, form.ilce, availableIlceler]);

  useEffect(() => {
    if (!form.ilce || !showMahalle) return;
    if (availableMahalleler.length === 1 && form.mahalle !== availableMahalleler[0]) {
      setForm((prev) => ({ ...prev, mahalle: availableMahalleler[0] }));
    }
  }, [form.ilce, form.mahalle, availableMahalleler, showMahalle]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "il") {
        next.ilce = "";
        next.mahalle = "";
      }

      if (field === "ilce") {
        next.mahalle = "";
      }

      return next;
    });

    setAddressWarning("");
  };

  const selectedProduct = products.find((p) => String(p.id) === String(form.product));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.il ||
      !form.ilce ||
      !form.address ||
      !form.product ||
      !form.timeSlot ||
      !date
    ) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    if (hasZones && !isAddressAllowed(form.il, form.ilce, form.mahalle)) {
      setAddressWarning("Seçtiğiniz bölgeye teslimat yapılmamaktadır.");
      toast.error("Bu bölgeye teslimat yapılmamaktadır");
      return;
    }

    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const quantityNumber = Number(form.quantity || 1);
      const unitPrice = Number(selectedProduct.price || 0);
      const totalAmount = unitPrice * quantityNumber;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          guest_name: form.name,
          guest_email: form.email,
          guest_phone: form.phone,
          il: form.il,
          ilce: form.ilce,
          mahalle: form.mahalle || null,
          address: form.address,
          delivery_date: date.toISOString().split("T")[0],
          time_slot: form.timeSlot,
          notes: form.notes || null,
          status: "pending",
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: orderData.id,
        product_id: selectedProduct.id,
        product_name_snapshot: selectedProduct.name,
        volume_snapshot: selectedProduct.Volume,
        unit_snapshot: selectedProduct.unit,
        unit_price: unitPrice,
        quantity: quantityNumber,
        line_total: totalAmount,
      });

      if (itemError) {
        throw itemError;
      }

      setSubmitted(true);
      toast.success("Rezervasyonunuz başarıyla oluşturuldu!");
    } catch (err: any) {
      console.error("Sipariş oluşturma hatası:", err);
      toast.error(err.message || "Sipariş oluşturulamadı");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container mx-auto px-4 flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Rezervasyon Onaylandı!
            </h2>
            <p className="text-muted-foreground mb-8">
              Siparişiniz için teşekkür ederiz. Taze sütünüz{" "}
              <strong>{date && format(date, "d MMMM yyyy", { locale: tr })}</strong> tarihinde{" "}
              <strong>{form.timeSlot}</strong> saatleri arasında teslim edilecektir.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  il: "",
                  ilce: "",
                  mahalle: "",
                  address: "",
                  product: "",
                  timeSlot: "",
                  quantity: "1",
                  notes: "",
                });
                setDate(undefined);
              }}
            >
              Yeni Sipariş Ver
            </Button>
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
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-3">Rezervasyon</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Taze Sütünüzü Rezerve Edin
            </h1>
            <p className="text-muted-foreground mt-3">Bilgilerinizi doldurun, biz kapınıza kadar getirelim.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-card rounded-2xl p-6 md:p-10" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  Kişisel Bilgileriniz
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad *</Label>
                    <Input id="name" placeholder="Ahmet Yılmaz" value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi *</Label>
                    <Input id="email" type="email" placeholder="ahmet@ornek.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası *</Label>
                  <Input id="phone" type="tel" placeholder="+90 555 123 4567" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>İl *</Label>
                    <Select value={form.il} onValueChange={(v) => updateField("il", v)}>
                      <SelectTrigger><SelectValue placeholder="İl seçin" /></SelectTrigger>
                      <SelectContent>
                        {availableIller.map((il) => (
                          <SelectItem key={il} value={il}>{il}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>İlçe *</Label>
                    <Select value={form.ilce} onValueChange={(v) => updateField("ilce", v)} disabled={!form.il}>
                      <SelectTrigger><SelectValue placeholder="İlçe seçin" /></SelectTrigger>
                      <SelectContent>
                        {availableIlceler.map((ilce) => (
                          <SelectItem key={ilce} value={ilce}>{ilce}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mahalle *</Label>
                    <Select
                      value={form.mahalle}
                      onValueChange={(v) => updateField("mahalle", v)}
                      disabled={!form.ilce || availableMahalleler.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !form.ilce
                              ? "Önce ilçe seçin"
                              : availableMahalleler.length === 0
                              ? "Mahalle verisi yok"
                              : "Mahalle seçin"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMahalleler.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {addressWarning && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {addressWarning}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Açık Adres *</Label>
                  <Textarea
                    id="address"
                    placeholder="Sokak, bina no, daire no vb."
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    required
                    rows={2}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  Ürün & Teslimat
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ürün *</Label>
                    <Select value={form.product} onValueChange={(v) => updateField("product", v)}>
                      <SelectTrigger><SelectValue placeholder="Ürün seçin" /></SelectTrigger>
                      <SelectContent>
                        {loadingProducts ? (
                          <SelectItem value="loading" disabled>
                            Ürünler yükleniyor...
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            Ürün bulunamadı
                          </SelectItem>
                        ) : (
                          products.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} - {p.Volume} {p.unit} / {p.price} TL
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Adet</Label>
                    <Select value={form.quantity} onValueChange={(v) => updateField("quantity", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teslimat Tarihi *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "d MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(d) => d < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Teslimat Saati *</Label>
                    <Select value={form.timeSlot} onValueChange={(v) => updateField("timeSlot", v)}>
                      <SelectTrigger><SelectValue placeholder="Saat seçin" /></SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notlar (isteğe bağlı)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Özel talimatlarınız varsa yazın..."
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full py-6 text-base font-semibold">
                Rezervasyonu Tamamla
              </Button>
              <p className="text-xs text-muted-foreground text-center">Ödeme gerekli değildir. Kapıda ödeme yapılır.</p>
            </form>

            <div className="lg:col-span-1">
              <OrderSummary product={selectedProduct} quantity={form.quantity} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderPage;

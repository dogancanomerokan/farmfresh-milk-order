import { useState, useEffect, useMemo } from "react";
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
import { getMahalleler } from "@/lib/mahalle-data";
import { supabase } from "@/lib/supabaseClient";
import { evaluateCampaigns } from "@/lib/campaigns/campaignEngine";
import type { CampaignEvaluationResult } from "@/lib/campaigns/types";

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
  "22:00 - 00:00",
];

const weekdayAllowedSlots = [
  "18:00 - 20:00",
  "20:00 - 22:00",
  "22:00 - 00:00",
];

const isWeekday = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 5;
};

const getDisabledSlots = (date?: Date) => {
  if (!date) return [];

  if (isWeekday(date)) {
    return timeSlots.filter((slot) => !weekdayAllowedSlots.includes(slot));
  }

  return [];
};

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
  const [submitting, setSubmitting] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);

  const [campaignResult, setCampaignResult] =
    useState<CampaignEvaluationResult | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    il: "",
    ilce: "",
    mahalle: "",
    address: "",
    product: "",
    product2: "",
    quantity: "1",
    quantity2: "1",
    deliveryDate: "",
    timeSlot: "",
    notes: "",
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setPrefillLoading(true);

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          setPrefillLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, phone, address, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        setForm((prev) => ({
          ...prev,
          name: prev.name || profile?.full_name || "",
          email: prev.email || profile?.email || user.email || "",
          phone: prev.phone || profile?.phone || "",
          address: prev.address || profile?.address || "",
        }));
      } catch (error: any) {
        console.error("Profil bilgileri yüklenemedi:", error);
      } finally {
        setPrefillLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const disabledSlots = useMemo(() => {
    return getDisabledSlots(date);
  }, [date]);

  useEffect(() => {
    if (form.timeSlot && disabledSlots.includes(form.timeSlot)) {
      setForm((prev) => ({ ...prev, timeSlot: "" }));
    }
  }, [date, form.timeSlot, disabledSlots]);

  useEffect(() => {
    const loadZones = async () => {
      const data = await getDeliveryZones();
      setZones(data);
    };

    loadZones();
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
    ? [...new Set(zones.map((z) => z.il))].sort((a, b) =>
        a.localeCompare(b, "tr")
      )
    : [];

  const availableIlceler = hasZones
    ? [
        ...new Set(
          zones.filter((z) => z.il === form.il).map((z) => z.ilce)
        ),
      ].sort((a, b) => a.localeCompare(b, "tr"))
    : [];

  const adminMahalleler = hasZones
    ? zones
        .filter((z) => z.il === form.il && z.ilce === form.ilce)
        .flatMap((z) => z.mahalleler)
    : [];

  const dataMahalleler =
    form.il && form.ilce ? getMahalleler(form.il, form.ilce) : [];

  const availableMahalleler =
    adminMahalleler.length > 0 ? adminMahalleler : dataMahalleler;

  const showMahalle = availableMahalleler.length > 0;

  useEffect(() => {
    if (availableIller.length === 1 && form.il !== availableIller[0]) {
      setForm((prev) => ({
        ...prev,
        il: availableIller[0],
        ilce: "",
        mahalle: "",
      }));
    }
  }, [availableIller, form.il]);

  useEffect(() => {
    if (!form.il) return;

    if (availableIlceler.length === 1 && form.ilce !== availableIlceler[0]) {
      setForm((prev) => ({
        ...prev,
        ilce: availableIlceler[0],
        mahalle: "",
      }));
    }
  }, [form.il, form.ilce, availableIlceler]);

  useEffect(() => {
    if (!form.ilce || !showMahalle) return;

    if (
      availableMahalleler.length === 1 &&
      form.mahalle !== availableMahalleler[0]
    ) {
      setForm((prev) => ({
        ...prev,
        mahalle: availableMahalleler[0],
      }));
    }
  }, [form.ilce, form.mahalle, availableMahalleler, showMahalle]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => {
      const normalizedValue =
        field === "product2" && value === "__none__" ? "" : value;

      const next = { ...prev, [field]: normalizedValue };

      if (field === "il") {
        next.ilce = "";
        next.mahalle = "";
      }

      if (field === "ilce") {
        next.mahalle = "";
      }

      if (field === "product" && !normalizedValue) {
        next.product2 = "";
        next.quantity2 = "1";
      }

      return next;
    });

    setAddressWarning("");
  };

  const selectedProduct = products.find(
    (p) => String(p.id) === String(form.product)
  );

  const selectedProduct2 = products.find(
    (p) => String(p.id) === String(form.product2)
  );

  const summaryItems = [
    selectedProduct
      ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          Volume: selectedProduct.Volume,
          unit: selectedProduct.unit,
          price: selectedProduct.price,
          quantity: form.quantity,
        }
      : null,
    selectedProduct2
      ? {
          id: selectedProduct2.id,
          name: selectedProduct2.name,
          Volume: selectedProduct2.Volume,
          unit: selectedProduct2.unit,
          price: selectedProduct2.price,
          quantity: form.quantity2,
        }
      : null,
  ].filter(Boolean);

  const subtotal = useMemo(() => {
    const quantityNumber = selectedProduct ? Number(form.quantity || 1) : 0;
    const total1 = selectedProduct
      ? Number(selectedProduct.price || 0) * quantityNumber
      : 0;

    const quantityNumber2 = selectedProduct2 ? Number(form.quantity2 || 1) : 0;
    const total2 = selectedProduct2
      ? Number(selectedProduct2.price || 0) * quantityNumber2
      : 0;

    return total1 + total2;
  }, [selectedProduct, selectedProduct2, form.quantity, form.quantity2]);

  const campaignOrderItems = useMemo(() => {
    return [
      selectedProduct
        ? {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            quantity: Number(form.quantity || 1),
            unitPrice: Number(selectedProduct.price || 0),
            volume: Number(selectedProduct.Volume || 0),
            unit: selectedProduct.unit,
          }
        : null,
      selectedProduct2
        ? {
            productId: selectedProduct2.id,
            productName: selectedProduct2.name,
            quantity: Number(form.quantity2 || 1),
            unitPrice: Number(selectedProduct2.price || 0),
            volume: Number(selectedProduct2.Volume || 0),
            unit: selectedProduct2.unit,
          }
        : null,
    ].filter(Boolean) as {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      volume: number;
      unit: string;
    }[];
  }, [selectedProduct, selectedProduct2, form.quantity, form.quantity2]);

  const campaignDependencyKey = useMemo(() => {
    return JSON.stringify({
      date: date ? format(date, "yyyy-MM-dd") : null,
      email: form.email,
      subtotal,
      items: campaignOrderItems,
    });
  }, [date, form.email, subtotal, campaignOrderItems]);

  useEffect(() => {
    const runCampaignEvaluation = async () => {
      if (!date || campaignOrderItems.length === 0 || subtotal <= 0) {
        setCampaignResult(null);
        return;
      }

      try {
        setCampaignLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const result = await evaluateCampaigns({
          userId: user?.id || null,
          userEmail: user?.email || form.email || null,
          deliveryDate: format(date, "yyyy-MM-dd"),
          subtotal,
          items: campaignOrderItems,
        });

        setCampaignResult(result);
      } catch (error) {
        console.error("Kampanya hesaplama hatası:", error);
        setCampaignResult(null);
      } finally {
        setCampaignLoading(false);
      }
    };

    runCampaignEvaluation();
  }, [campaignDependencyKey]);

  const campaignDiscount = campaignResult?.totalDiscount || 0;
  const finalTotal = campaignResult?.finalTotal ?? subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = String(form.email || "").trim().toLowerCase();
    const cleanedEmail = normalizedEmail.replace(/\s+/g, "");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(cleanedEmail)) {
      toast.error("Geçerli bir e-posta adresi giriniz");
      return;
    }

    if (submitting) return;

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

    const addressAllowed = await isAddressAllowed(
      form.il,
      form.ilce,
      form.mahalle
    );

    if (hasZones && !addressAllowed) {
      setAddressWarning("Seçtiğiniz bölgeye teslimat yapılmamaktadır.");
      toast.error("Bu bölgeye teslimat yapılmamaktadır");
      return;
    }

    if (!selectedProduct) {
      toast.error("Lütfen bir ürün seçin");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: freezeRow, error: freezeError } = await supabase
          .from("customer_account_controls")
          .select("is_frozen")
          .eq("user_id", user.id)
          .maybeSingle();

        if (freezeError) {
          throw freezeError;
        }

        if (freezeRow?.is_frozen) {
          toast.error("Hesabınız geçici olarak işlem yapmaya kapatılmıştır.");
          return;
        }
      }

      const quantityNumber = Number(form.quantity || 1);
      const unitPrice = Number(selectedProduct.price || 0);
      const total1 = unitPrice * quantityNumber;

      const quantityNumber2 = selectedProduct2
        ? Number(form.quantity2 || 1)
        : 0;
      const unitPrice2 = selectedProduct2
        ? Number(selectedProduct2.price || 0)
        : 0;
      const total2 = unitPrice2 * quantityNumber2;

      const totalAmount = total1 + total2;

      let latestCampaignResult: CampaignEvaluationResult | null = null;

      try {
        latestCampaignResult = await evaluateCampaigns({
          userId: user?.id || null,
          userEmail: user?.email || cleanedEmail || null,
          deliveryDate: format(date, "yyyy-MM-dd"),
          subtotal: totalAmount,
          items: campaignOrderItems,
        });
      } catch (campaignError) {
        console.error("Sipariş öncesi kampanya hesaplama hatası:", campaignError);
      }

      const finalTotalForOrder =
        latestCampaignResult?.finalTotal ?? campaignResult?.finalTotal ?? totalAmount;

      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        user_id: user?.id ?? null,
        guest_name: form.name,
        guest_email: cleanedEmail,
        guest_phone: form.phone,
        il: form.il,
        ilce: form.ilce,
        mahalle: form.mahalle || null,
        address: form.address,
        delivery_date: format(date, "yyyy-MM-dd"),
        time_slot: form.timeSlot,
        notes: form.notes || null,
        status: "pending",
        total_amount: finalTotalForOrder,
      });

      if (orderError) {
        throw orderError;
      }

      const orderItems = [
        {
          order_id: orderId,
          product_id: selectedProduct.id,
          product_name_snapshot: selectedProduct.name,
          volume_snapshot: selectedProduct.Volume,
          unit_snapshot: selectedProduct.unit,
          unit_price: unitPrice,
          quantity: quantityNumber,
          line_total: total1,
        },
      ];

      if (selectedProduct2) {
        orderItems.push({
          order_id: orderId,
          product_id: selectedProduct2.id,
          product_name_snapshot: selectedProduct2.name,
          volume_snapshot: selectedProduct2.Volume,
          unit_snapshot: selectedProduct2.unit,
          unit_price: unitPrice2,
          quantity: quantityNumber2,
          line_total: total2,
        });
      }

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) {
        await supabase.from("orders").delete().eq("id", orderId);
        throw itemError;
      }

      try {
        const { data: notifyData, error: notifyError } =
          await supabase.functions.invoke("new-order-notify", {
            body: { orderId },
          });

        console.log("new-order-notify data:", notifyData);
        console.log("new-order-notify error:", notifyError);

        if (notifyError) {
          toast.error("Mail bildirimi gönderilemedi");
          console.error("Mail bildirimi gönderilemedi:", notifyError);
        } else {
          console.log("Mail bildirimi function çağrısı başarılı");
        }
      } catch (err) {
        console.error("Function invoke patladı:", err);
        toast.error("Mail function çağrısında hata oluştu");
      }

      setSubmitted(true);
      toast.success("Rezervasyonunuz başarıyla oluşturuldu!");
    } catch (err: any) {
      console.error("Sipariş oluşturma hatası:", err);
      toast.error(err.message || "Sipariş oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-20 container mx-auto px-4 flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2
              className="text-3xl font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Rezervasyon Onaylandı!
            </h2>
            <p className="text-muted-foreground mb-8">
              Siparişiniz için teşekkür ederiz. Taze sütünüz{" "}
              <strong>
                {date && format(date, "d MMMM yyyy", { locale: tr })}
              </strong>{" "}
              tarihinde <strong>{form.timeSlot}</strong> saatleri arasında
              teslim edilecektir.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setCampaignResult(null);
                setForm({
                  name: "",
                  email: "",
                  phone: "",
                  il: "",
                  ilce: "",
                  mahalle: "",
                  address: "",
                  product: "",
                  product2: "",
                  quantity: "1",
                  quantity2: "1",
                  deliveryDate: "",
                  timeSlot: "",
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
            <p className="text-sm uppercase tracking-widest text-accent font-semibold mb-3">
              Rezervasyon
            </p>
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Taze Sütünüzü Rezerve Edin
            </h1>
            <p className="text-muted-foreground mt-3">
              Bilgilerinizi doldurun, biz kapınıza kadar getirelim.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-2 space-y-6 bg-card rounded-2xl p-6 md:p-10"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <div className="space-y-4">
                <h3
                  className="text-lg font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Kişisel Bilgileriniz
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad *</Label>
                    <Input
                      id="name"
                      placeholder="Ahmet Yılmaz"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      required
                      disabled={prefillLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmet@ornek.com"
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      onBlur={() =>
                        updateField(
                          "email",
                          String(form.email || "")
                            .replace(/\u200B/g, "")
                            .replace(/\u00A0/g, " ")
                            .trim()
                            .replace(/\s+/g, "")
                            .toLowerCase()
                        )
                      }
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                      disabled={prefillLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+90 555 123 4567"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    required
                    disabled={prefillLoading}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>İl *</Label>
                    <Select
                      value={form.il}
                      onValueChange={(v) => updateField("il", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="İl seçin" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {availableIller.map((il) => (
                          <SelectItem key={il} value={il}>
                            {il}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>İlçe *</Label>
                    <Select
                      value={form.ilce}
                      onValueChange={(v) => updateField("ilce", v)}
                      disabled={!form.il}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="İlçe seçin" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]">
                        {availableIlceler.map((ilce) => (
                          <SelectItem key={ilce} value={ilce}>
                            {ilce}
                          </SelectItem>
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
                      <SelectTrigger className="w-full">
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
                      <SelectContent className="z-[100]">
                        {availableMahalleler.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
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
                    disabled={prefillLoading}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3
                  className="text-lg font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Ürün & Teslimat
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ürün (Zorunlu)</Label>
                    <Select
                      value={form.product}
                      onValueChange={(v) => updateField("product", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün seçin" />
                      </SelectTrigger>
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
                    <Select
                      value={form.quantity}
                      onValueChange={(v) => updateField("quantity", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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

                <div
                  className={`grid sm:grid-cols-2 gap-4 ${
                    !form.product ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="space-y-2">
                    <Label>2. Ürün (Opsiyonel)</Label>
                    <Select
                      value={form.product2 || "__none__"}
                      onValueChange={(v) => updateField("product2", v)}
                      disabled={!form.product}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün Seçimi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ürün Seçimi</SelectItem>

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
                    <Label>2. Ürün Adet</Label>
                    <Select
                      value={form.quantity2}
                      onValueChange={(v) => updateField("quantity2", v)}
                      disabled={!form.product}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date
                            ? format(date, "d MMMM yyyy", { locale: tr })
                            : "Tarih seçin"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          locale={tr}
                          formatters={{
                            formatCaption: (date) =>
                              date.toLocaleDateString("tr-TR", {
                                month: "long",
                                year: "numeric",
                              }),
                          }}
                          disabled={(d) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return d < today;
                          }}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Teslimat Saati *</Label>
                    <Select
                      value={form.timeSlot}
                      onValueChange={(v) => updateField("timeSlot", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Saat seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((t) => {
                          const isDisabled = disabledSlots.includes(t);

                          return (
                            <SelectItem
                              key={t}
                              value={t}
                              disabled={isDisabled}
                              className={
                                isDisabled
                                  ? "opacity-40 cursor-not-allowed"
                                  : ""
                              }
                            >
                              {t}
                            </SelectItem>
                          );
                        })}
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

                   {!campaignLoading &&
      campaignResult &&
      campaignResult.appliedCampaigns.length > 0 && (
        <>
          <p className="font-semibold text-green-800">
            Uygulanan Kampanyalar
          </p>

          <div className="mt-2 space-y-1">
            {campaignResult.messages.map((message, index) => (
              <p key={index} className="text-green-700">
                {message}
              </p>
            ))}
          </div>

          {campaignDiscount > 0 && (
            <div className="mt-3 border-t border-green-200 pt-3 space-y-1">
              <p className="text-green-800">
                Ara toplam: {subtotal.toFixed(2)} TL
              </p>

              <p className="font-semibold text-green-800">
                Toplam indirim: {campaignDiscount.toFixed(2)} TL
              </p>

              <p className="font-bold text-green-900">
                Kampanyalı toplam: {finalTotal.toFixed(2)} TL
              </p>
            </div>
          )}
        </>
      )}

              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full py-6 text-base font-semibold"
                disabled={submitting}
              >
                {submitting ? "Gönderiliyor..." : "Rezervasyonu Tamamla"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ödeme gerekli değildir. Kapıda ödeme yapılır.
              </p>
            </form>

           <div className="lg:col-span-1">
  <OrderSummary
    items={summaryItems}
    campaignResult={campaignResult}
    campaignLoading={campaignLoading}
  />
</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderPage;

import { useState, useEffect } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DeliveryZone,
  getDeliveryZones,
  addDeliveryZone,
  removeDeliveryZone,
} from "@/lib/delivery-zones";

const DeliveryZoneManager = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [il, setIl] = useState("");
  const [ilce, setIlce] = useState("");
  const [mahalleInput, setMahalleInput] = useState("");
  const [loadingZones, setLoadingZones] = useState(true);
  const [savingZone, setSavingZone] = useState(false);

  useEffect(() => {
    const loadZones = async () => {
      setLoadingZones(true);
      const data = await getDeliveryZones();
      setZones(data);
      setLoadingZones(false);
    };

    loadZones();
  }, []);

  const handleAdd = async () => {
    if (!il.trim() || !ilce.trim()) {
      toast.error("İl ve ilçe zorunludur");
      return;
    }

    setSavingZone(true);

    try {
      const mahalleler = mahalleInput
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);

      const created = await addDeliveryZone({
        il: il.trim(),
        ilce: ilce.trim(),
        mahalleler,
      });

      if (!created) {
        toast.error("Teslimat bölgesi eklenemedi");
        return;
      }

      const updatedZones = await getDeliveryZones();
      setZones(updatedZones);

      setIl("");
      setIlce("");
      setMahalleInput("");
      toast.success("Teslimat bölgesi eklendi");
    } finally {
      setSavingZone(false);
    }
  };

  const handleRemove = async (id: string) => {
    const success = await removeDeliveryZone(id);

    if (!success) {
      toast.error("Bölge kaldırılamadı");
      return;
    }

    const updatedZones = await getDeliveryZones();
    setZones(updatedZones);
    toast.info("Bölge kaldırıldı");
  };

  return (
    <div
      className="bg-card rounded-xl p-5 md:p-6 space-y-5"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3
          className="text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Teslimat Bölgeleri
        </h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Sipariş alınabilecek bölgeleri tanımlayın. Bölge tanımlanmazsa her adres
        kabul edilir.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">İl *</Label>
          <Input
            placeholder="İstanbul"
            value={il}
            onChange={(e) => setIl(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">İlçe *</Label>
          <Input
            placeholder="Silivri"
            value={ilce}
            onChange={(e) => setIlce(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            Mahalleler (virgülle ayırın, boş = tümü)
          </Label>
          <Input
            placeholder="Merkez, Çanta, Selimpaşa"
            value={mahalleInput}
            onChange={(e) => setMahalleInput(e.target.value)}
          />
        </div>
      </div>

      <Button size="sm" onClick={handleAdd} disabled={savingZone}>
        <Plus className="h-4 w-4 mr-1" />
        {savingZone ? "Ekleniyor..." : "Bölge Ekle"}
      </Button>

      {loadingZones ? (
        <p className="text-sm text-muted-foreground italic">
          Bölgeler yükleniyor...
        </p>
      ) : zones.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Henüz bölge tanımlanmadı — tüm adresler kabul edilir.
        </p>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-start justify-between gap-3 bg-background rounded-lg p-3 border border-border"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {zone.il} / {zone.ilce}
                </p>
                {zone.mahalleler.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zone.mahalleler.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">
                        {m}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tüm mahalleler
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(zone.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryZoneManager;

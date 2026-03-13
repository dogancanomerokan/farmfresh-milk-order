import { supabase } from "@/lib/supabaseClient";

export interface DeliveryZone {
  id: string;
  il: string;
  ilce: string;
  mahalleler: string[];
  is_active?: boolean;
  created_at?: string;
}

export const getDeliveryZones = async (): Promise<DeliveryZone[]> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("il", { ascending: true })
    .order("ilce", { ascending: true });

  if (error) {
    console.error("Teslimat bölgeleri alınamadı:", error.message);
    return [];
  }

  return data || [];
};

export const addDeliveryZone = async (
  zone: Omit<DeliveryZone, "id" | "is_active" | "created_at">
): Promise<DeliveryZone | null> => {
  const { data, error } = await supabase
    .from("delivery_zones")
    .insert({
      il: zone.il,
      ilce: zone.ilce,
      mahalleler: zone.mahalleler || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Teslimat bölgesi eklenemedi:", error.message);
    return null;
  }

  return data;
};

export const removeDeliveryZone = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("delivery_zones")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Teslimat bölgesi silinemedi:", error.message);
    return false;
  }

  return true;
};

export const isAddressAllowed = async (
  il: string,
  ilce: string,
  mahalle: string
): Promise<boolean> => {
  const zones = await getDeliveryZones();

  if (zones.length === 0) return false;

  return zones.some((z) => {
    if (z.il.toLowerCase() !== il.toLowerCase()) return false;
    if (z.ilce.toLowerCase() !== ilce.toLowerCase()) return false;
    if (!z.mahalleler || z.mahalleler.length === 0) return true;

    return z.mahalleler.some(
      (m) => m.toLowerCase() === (mahalle || "").toLowerCase()
    );
  });
};

export const getUniqueIller = async (): Promise<string[]> => {
  const zones = await getDeliveryZones();
  return [...new Set(zones.map((z) => z.il))].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
};

export const getIlcelerByIl = async (il: string): Promise<string[]> => {
  const zones = await getDeliveryZones();
  return [...new Set(zones.filter((z) => z.il === il).map((z) => z.ilce))].sort(
    (a, b) => a.localeCompare(b, "tr")
  );
};

// Teslimat bölgeleri yardımcı modülü — localStorage tabanlı

export interface DeliveryZone {
  id: string;
  il: string;
  ilce: string;
  mahalleler: string[]; // boş ise tüm mahalleler kabul edilir
}

const STORAGE_KEY = "delivery-zones";

export const getDeliveryZones = (): DeliveryZone[] => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
};

export const saveDeliveryZones = (zones: DeliveryZone[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
};

export const addDeliveryZone = (zone: Omit<DeliveryZone, "id">): DeliveryZone => {
  const zones = getDeliveryZones();
  const newZone = { ...zone, id: crypto.randomUUID() };
  zones.push(newZone);
  saveDeliveryZones(zones);
  return newZone;
};

export const removeDeliveryZone = (id: string) => {
  const zones = getDeliveryZones().filter((z) => z.id !== id);
  saveDeliveryZones(zones);
};

export const isAddressAllowed = (il: string, ilce: string, mahalle: string): boolean => {
  const zones = getDeliveryZones();
  if (zones.length === 0) return true; // bölge tanımlanmamışsa her yer kabul
  return zones.some((z) => {
    if (z.il.toLowerCase() !== il.toLowerCase()) return false;
    if (z.ilce.toLowerCase() !== ilce.toLowerCase()) return false;
    if (z.mahalleler.length === 0) return true; // tüm mahalleler
    return z.mahalleler.some((m) => m.toLowerCase() === mahalle.toLowerCase());
  });
};

// Admin panelde kullanmak için benzersiz il ve ilçe listesi
export const getUniqueIller = (): string[] => {
  const zones = getDeliveryZones();
  return [...new Set(zones.map((z) => z.il))];
};

export const getIlcelerByIl = (il: string): string[] => {
  const zones = getDeliveryZones();
  return [...new Set(zones.filter((z) => z.il === il).map((z) => z.ilce))];
};

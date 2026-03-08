// Türkiye mahalle verileri — ilçe bazında
// Tüm ilçeler için mahalle eklemek pratik olmadığından,
// teslimat yapılan bölgelerin mahalleleri buraya eklenir.
// Yeni mahalle eklemek için: "İl > İlçe": ["Mahalle1", "Mahalle2", ...] formatında ekleyin.

const mahalleData: Record<string, string[]> = {
  "İstanbul > Silivri": [
    "Akören", "Alibey", "Alipaşa", "Bekirli", "Beyciler",
    "Büyükçavuşlu", "Büyükkılıçlı", "Büyüksinekli",
    "Cumhuriyet", "Çanta Balaban", "Çanta Sancaktepe",
    "Çayırdere", "Çeltik", "Danamandıra",
    "Değirmenköy Fevzipaşa", "Değirmenköy İsmetpaşa",
    "Fatih", "Fenerköy", "Gazitepe", "Gümüşyaka",
    "Kadıköy", "Kavaklı", "Kavaklı Hürriyet", "Kavaklı İstiklal",
    "Kurfallı", "Küçük Kılıçlı", "Küçüksinekli",
    "Mimar Sinan", "Ortaköy", "Piri Mehmet Paşa",
    "Sayalar", "Selimpaşa", "Semizkumlar", "Seymen",
    "Yeni", "Yolçatı",
  ],
};

export const getMahalleler = (il: string, ilce: string): string[] => {
  const key = `${il} > ${ilce}`;
  return (mahalleData[key] || []).sort((a, b) => a.localeCompare(b, "tr"));
};

export const hasMahalleData = (il: string, ilce: string): boolean => {
  const key = `${il} > ${ilce}`;
  return key in mahalleData && mahalleData[key].length > 0;
};

export default mahalleData;

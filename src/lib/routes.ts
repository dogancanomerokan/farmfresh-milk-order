export const ACTIVE_ORDER_STATUSES = [
  "approved",
  "preparing",
  "delivering",
];

const DEPOT_ADDRESS =
  "Mimarsinan Mahallesi Özgürlük Caddesi 7087 Sokak Pearl Life Sitesi Silivri İstanbul";

export const buildGoogleMapsDirectionsUrl = (orders: any[]) => {
  if (!orders || orders.length === 0) return null;

  const addresses = orders
    .map((o) =>
      [
        o.address,
        o.mahalle,
        o.ilce,
        o.il,
        "Türkiye",
      ]
        .filter(Boolean)
        .join(", ")
    )
    .filter(Boolean);

  if (addresses.length === 0) return null;

  const destination = addresses[addresses.length - 1];

  // optimize:true -> Google Maps en kısa rotayı hesaplar
  const waypoints = ["optimize:true", ...addresses.slice(0, -1)].join("|");

  let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(
    DEPOT_ADDRESS
  )}&destination=${encodeURIComponent(destination)}`;

  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
};

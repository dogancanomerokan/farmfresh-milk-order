export const ACTIVE_ORDER_STATUSES = [
  "pending",
  "approved",
  "preparing",
  "delivering",
];

export const buildGoogleMapsDirectionsUrl = (orders: any[]) => {
  if (!orders || orders.length === 0) return null;

  const addresses = orders
    .map((o) => {
      return [
        o.address,
        o.mahalle,
        o.ilce,
        o.il,
        "Türkiye"
      ]
        .filter(Boolean)
        .join(", ");
    })
    .filter(Boolean);

  if (addresses.length === 0) return null;

  const origin = addresses[0];
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(1, -1).join("|");

  let url = `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}`;

  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
};

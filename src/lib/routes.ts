export const ACTIVE_ORDER_STATUSES = [
  "pending",
  "approved",
  "preparing",
  "delivering",
] as const;

export function buildOrderAddress(order: {
  address?: string | null;
  mahalle?: string | null;
  ilce?: string | null;
  il?: string | null;
}) {
  return [
    order.address,
    order.mahalle,
    order.ilce,
    order.il,
    "Türkiye",
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildGoogleMapsDirectionsUrl(
  orders: Array<{
    address?: string | null;
    mahalle?: string | null;
    ilce?: string | null;
    il?: string | null;
  }>
) {
  const addresses = orders
    .map(buildOrderAddress)
    .filter(Boolean);

  if (addresses.length === 0) return null;
  if (addresses.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addresses[0])}`;
  }

  const origin = addresses[0];
  const destination = addresses[addresses.length - 1];
  const waypoints = addresses.slice(1, -1).join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Formatting helpers for the Antojo platform (Colombian context)

export function cop(value: number): string {
  return "$ " + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function copShort(value: number): string {
  if (value >= 1_000_000) return "$ " + (value / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (value >= 1_000) return "$ " + (value / 1_000).toFixed(value >= 100_000 ? 0 : 1).replace(".0", "") + "k";
  return cop(value);
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  return `hace ${day} d`;
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

// Bogotá neighborhoods with rough coordinates for the tracking map
export const BOGOTA_SPOTS: { name: string; lat: number; lng: number }[] = [
  { name: "Chapinero", lat: 4.6521, lng: -74.0635 },
  { name: "Zona G", lat: 4.6564, lng: -74.0579 },
  { name: "Usaquén", lat: 4.6927, lng: -74.0295 },
  { name: "Teusaquillo", lat: 4.6517, lng: -74.0768 },
  { name: "La Candelaria", lat: 4.5981, lng: -74.0758 },
  { name: "El Poblado", lat: 4.6721, lng: -74.0531 },
];

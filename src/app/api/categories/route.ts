import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // derive categories from seeded restaurants' cuisine + tags
  const restaurants = await db.restaurant.findMany({ select: { cuisine: true, tags: true, promo: true } });
  const icons: Record<string, string> = {
    "Hamburguesas": "🍔",
    "Pizza italiana": "🍕",
    "Pollo": "🍗",
    "Comida colombiana": "🇨🇴",
    "Japonesa · Sushi": "🍣",
    "Italiana": "🍝",
    "Saludable": "🥗",
    "Postres": "🍰",
    "Café": "☕",
    "Mexicana": "🌮",
  };
  const counts = new Map<string, number>();
  for (const r of restaurants) counts.set(r.cuisine, (counts.get(r.cuisine) ?? 0) + 1);
  const cats = Array.from(counts.entries()).map(([c, count]) => ({
    name: c,
    icon: icons[c] ?? "🍽️",
    count,
  }));
  return NextResponse.json({
    categories: [
      { name: "Todas", icon: "🍴", count: restaurants.length },
      ...cats,
      { name: "Promociones", icon: "🔥", count: restaurants.filter((r) => r.promo).length },
    ],
  });
}

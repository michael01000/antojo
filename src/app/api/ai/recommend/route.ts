import { NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

export async function GET() {
  const c = await getCurrentCustomer().catch(() => null);
  const loyalty = c ? await db.loyaltyAccount.findUnique({ where: { customerId: c.id } }) : null;
  const restaurants = await db.restaurant.findMany({
    where: { isOpen: true },
    select: { id: true, name: true, cuisine: true, neighborhood: true, promo: true, tags: true, rating: true, deliveryMin: true },
    orderBy: { rating: "desc" },
  });

  const hour = new Date().getHours();
  const timeContext = hour < 11 ? "desayuno/mañana" : hour < 15 ? "almuerzo" : hour < 17 ? "onces/merienda" : hour < 22 ? "cena" : "ant nocturno";

  const prompt = `Eres el motor de recomendaciones de Antojo (domicilios en Colombia). El usuario es ${c?.name ?? "un cliente"}, tier ${loyalty?.tier ?? "Plata"}, hora del día: ${timeContext}.

Restaurantes disponibles (id | nombre | cocina | barrio | promo | rating):
${restaurants.map((r) => `${r.id} | ${r.name} | ${r.cuisine} | ${r.neighborhood} | ${r.promo ?? "—"} | ⭐${r.rating}`).join("\n")}

Devuelve EXCLUSIVAMENTE un JSON válido con 4 recomendaciones personalizadas para este momento del día, variando cocinas. Formato:
{"recommendations":[{"restaurantId":"<id>","reason":"<frase corta en español, máx 12 palabras, cálida>"}]}
No agregues texto fuera del JSON.`;

  try {
    const raw = await aiChat([
      { role: "assistant", content: "Devuelves solo JSON válido, sin markdown ni explicaciones." },
      { role: "user", content: prompt },
    ]);
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : null;

    // Validate restaurantIds against the real list + top up with heuristics
    const validIds = new Set(restaurants.map((r) => r.id));
    const valid: { restaurantId: string; reason: string }[] = [];
    const used = new Set<string>();
    if (parsed?.recommendations?.length) {
      for (const rec of parsed.recommendations) {
        if (rec.restaurantId && validIds.has(rec.restaurantId) && !used.has(rec.restaurantId)) {
          valid.push({ restaurantId: rec.restaurantId, reason: String(rec.reason || "").slice(0, 80) });
          used.add(rec.restaurantId);
        }
        if (valid.length >= 4) break;
      }
    }
    // Top up with highest-rated restaurants not yet included
    const sorted = [...restaurants].sort((a, b) => b.rating - a.rating);
    for (const r of sorted) {
      if (valid.length >= 4) break;
      if (used.has(r.id)) continue;
      valid.push({ restaurantId: r.id, reason: r.promo ? `🔥 ${r.promo}` : `Top en ${r.neighborhood}` });
      used.add(r.id);
    }
    if (valid.length) return NextResponse.json({ recommendations: valid, source: parsed ? "ai" : "heuristic" });
    throw new Error("no recs");
  } catch {
    // Heuristic fallback
    const fallback = restaurants
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4)
      .map((r) => ({
        restaurantId: r.id,
        reason: r.promo ? `🔥 ${r.promo}` : `Top rated en ${r.neighborhood}`,
      }));
    return NextResponse.json({ recommendations: fallback, source: "heuristic" });
  }
}

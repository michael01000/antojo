import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiChat } from "@/lib/ai";
import { getCurrentCustomer } from "@/lib/server";

/**
 * POST /api/ai/combo-builder
 * Arma un combo completo dentro de un presupuesto usando el LLM.
 * body: { budget, people, preference }
 */
export async function POST(req: NextRequest) {
  const { budget, people = 1, preference = "" } = await req.json();
  if (!budget || budget < 5000) return NextResponse.json({ error: "Presupuesto mínimo $5.000" }, { status: 400 });

  // Buscar menuItems de restaurantes abiertos
  const items = await db.menuItem.findMany({
    where: { isAvailable: true, restaurant: { isOpen: true, isApproved: true } },
    select: { id: true, name: true, price: true, emoji: true, description: true, category: true, restaurantId: true, restaurant: { select: { name: true } } },
    take: 200,
    orderBy: { isPopular: "desc" },
  });

  const prompt = `Eres un experto armando combos de comida. Presupuesto: ${budget} COP para ${people} personas. Preferencia: ${preference || "ninguna"}.

Menu disponible (id | nombre | precio | restaurante):
${items.map(i => `${i.id} | ${i.name} | ${i.price} | ${i.restaurant.name}`).join("\n")}

Arma un combo que NO exceda ${budget} COP. Devuelve SOLO JSON: {"combo":[{"id":"...","name":"...","price":0,"emoji":"...","restaurant":"..."}],"total":0,"reason":"frase corta por qué elegiste esto"}`;

  try {
    const reply = await aiChat([{ role: "assistant", content: "Devuelves solo JSON válido." }, { role: "user", content: prompt }]);
    const match = reply.match(/\{[\s\S]*\}/);
    if (match) {
      const combo = JSON.parse(match[0]);
      return NextResponse.json({ ...combo, source: "ai" });
    }
    throw new Error("parse error");
  } catch {
    // Fallback heurístico: llenar con items populares hasta el presupuesto
    let remaining = budget;
    const combo: any[] = [];
    for (const item of items) {
      if (item.price <= remaining && combo.length < 6) {
        combo.push({ id: item.id, name: item.name, price: item.price, emoji: item.emoji, restaurant: item.restaurant.name });
        remaining -= item.price;
      }
    }
    const total = combo.reduce((s, i) => s + i.price, 0);
    return NextResponse.json({ combo, total, reason: "Combo popular dentro de tu presupuesto", source: "heuristic" });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiChat } from "@/lib/ai";

const MOOD_PROMPTS: Record<string, string> = {
  happy: "El usuario está feliz y quiere celebrar. Recomienda algo indulgente y divertido.",
  tired: "El usuario está cansado. Recomienda comida rápida, reconfortante, fácil de comer.",
  sick: "El usuario está enfermo. Recomienda sopas, caldos, comida suave y reconfortante.",
  healthy: "El usuario quiere comer saludable. Recomienda bowls, ensaladas, opciones bajas en calorías.",
  celebratory: "El usuario quiere celebrar algo especial. Recomienda algo premium o para compartir.",
};

/**
 * POST /api/ai/mood
 * Recomienda platos según el mood del usuario.
 */
export async function POST(req: NextRequest) {
  const { mood } = await req.json();
  const moodPrompt = MOOD_PROMPTS[mood] ?? MOOD_PROMPTS.happy;

  const restaurants = await db.restaurant.findMany({
    where: { isOpen: true, isApproved: true },
    select: { id: true, name: true, cuisine: true, neighborhood: true },
    take: 15,
    orderBy: { rating: "desc" },
  });

  const prompt = `${moodPrompt}

Restaurantes disponibles: ${restaurants.map(r => `${r.id} | ${r.name} | ${r.cuisine} | ${r.neighborhood}`).join("\n")}

Recomienda 3 platos de estos restaurantes que encajen con el mood. Devuelve SOLO JSON: {"recommendations":[{"restaurantId":"...","name":"...","reason":"frase corta"}]}`;

  try {
    const reply = await aiChat([{ role: "assistant", content: "Devuelves solo JSON." }, { role: "user", content: prompt }]);
    const match = reply.match(/\{[\s\S]*\}/);
    if (match) return NextResponse.json(JSON.parse(match[0]));
    throw new Error("parse");
  } catch {
    const fallback = restaurants.slice(0, 3).map(r => ({ restaurantId: r.id, name: r.name, reason: "Recomendado para tu mood" }));
    return NextResponse.json({ recommendations: fallback });
  }
}

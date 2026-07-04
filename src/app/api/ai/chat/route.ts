import { NextRequest, NextResponse } from "next/server";
import { aiChat } from "@/lib/ai";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

const SYSTEM = `Eres "Sazón AI", el asistente virtual de Antojo, la superapp de domicilios de comida en Colombia. Hablas español colombiano, cercano y cálido (usa "parce", "bacano", "¿qué pinta?" con moderación).

Tu trabajo:
- Ayudar al usuario a decidir qué pedir hoy (recomienda platos y restaurantes específicos).
- Sugerir combos, promociones y aprovechar su membresía Antojo Prime.
- Responder dudas sobre su pedido, pagos, recompensas y envíos.
- Ser conciso: máximo 3-4 frases por respuesta. Usa emojis con moderación 🍔.
- Si el usuario pregunta por algo que no existe, propón alternativas reales del menú.
- No inventes precios; si no los sabes, invita a revisar el restaurante en la app.

Contexto del usuario (si está disponible) se incluye en el primer mensaje.`;

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();
  if (!message || typeof message !== "string") return NextResponse.json({ error: "message required" }, { status: 400 });

  // Build context from current customer + a few restaurants
  const c = await getCurrentCustomer().catch(() => null);
  const loyalty = c ? await db.loyaltyAccount.findUnique({ where: { customerId: c.id } }) : null;
  const subscription = c ? await db.subscription.findUnique({ where: { customerId: c.id } }) : null;
  const restaurants = await db.restaurant.findMany({ take: 10, select: { name: true, cuisine: true, promo: true, neighborhood: true }, orderBy: { rating: "desc" } });

  const context = `Contexto del usuario:
- Nombre: ${c?.name ?? "Invitado"}
- Ciudad: ${c?.city ?? "Bogotá"}
- Tier de recompensas: ${loyalty?.tier ?? "Plata"} (${loyalty?.coins ?? 0} coins)
- Membresía: ${subscription?.plan === "prime" ? "Antojo Prime activa (envío gratis)" : "Sin membresía"}
- Restaurantes disponibles: ${restaurants.map((r) => `${r.name} (${r.cuisine}${r.promo ? `, promo: ${r.promo}` : ""})`).join("; ")}
- Hora actual: ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;

  const messages: { role: "assistant" | "user"; content: string }[] = [
    { role: "assistant", content: SYSTEM + "\n\n" + context },
    ...history.slice(-8).map((m: any) => ({ role: m.role as "assistant" | "user", content: m.content })),
    { role: "user", content: message },
  ];

  try {
    const reply = await aiChat(messages);
    return NextResponse.json({ reply: reply.trim() });
  } catch (e: any) {
    // Logging del error real (visible en Vercel logs)
    console.error("[Sazón AI] Error:", e?.message ?? e);

    // Mensaje de fallback graceful según el tipo de error
    let fallback = "¡Uy parcero! En este momento no puedo procesar tu mensaje. Mientras tanto, échale un ojo a las recomendaciones 'Para ti' en la pantalla de inicio 🍔✨";

    if (e?.message === "AI_TIMEOUT") {
      fallback = "Me estoy demorando más de lo normal 🐌 ¿Mientras tanto revisas las recomendaciones 'Para ti' en la pantalla de inicio? 🍔";
    } else if (e?.message?.includes("auth") || e?.message?.includes("credential") || e?.message?.includes("API key")) {
      fallback = "Estoy con un problema técnico temporal 🔧 Mientras lo resolvemos, explora los restaurantes en la pantalla de inicio 🍔✨";
    }

    return NextResponse.json({ reply: fallback });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

/**
 * GET /api/smart-reorder
 * Analiza el historial de pedidos del cliente por día de la semana + hora.
 * Si hay un patrón (mismo restaurante a la misma hora), lo sugiere.
 */
export async function GET() {
  const c = await getCurrentCustomer().catch(() => null);
  if (!c) return NextResponse.json({ suggestion: null });

  const orders = await db.order.findMany({
    where: { customerId: c.id, status: { in: ["delivered", "en_route", "picked_up"] } },
    include: { restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true, deliveryMin: true } }, items: { select: { name: true, emoji: true, price: true, qty: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (orders.length === 0) return NextResponse.json({ suggestion: null });

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Dom
  const hour = now.getHours();

  // Buscar pedidos del mismo día de la semana en las últimas 4 semanas
  const sameDayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getDay() === dayOfWeek && Math.abs(d.getHours() - hour) <= 3;
  });

  if (sameDayOrders.length === 0) return NextResponse.json({ suggestion: null });

  // El más reciente del mismo día
  const suggestion = sameDayOrders[0];
  const subtotal = suggestion.items.reduce((s, i) => s + i.price * i.qty, 0);

  return NextResponse.json({
    suggestion: {
      orderId: suggestion.id,
      code: suggestion.code,
      restaurant: suggestion.restaurant,
      items: suggestion.items.map(i => ({ name: i.name, emoji: i.emoji, price: i.price, qty: i.qty })),
      subtotal,
      orderedAt: suggestion.createdAt.toISOString(),
    },
  });
}

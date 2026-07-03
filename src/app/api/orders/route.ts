import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer, serializeOrder, ORDER_INCLUDE } from "@/lib/server";

export async function GET() {
  const c = await getCurrentCustomer();
  const orders = await db.order.findMany({
    where: { customerId: c.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders: await Promise.all(orders.map(serializeOrder)) });
}

export async function POST(req: NextRequest) {
  const c = await getCurrentCustomer();
  const body = await req.json();
  const { items, restaurantId, address, paymentMethod, subtotal, deliveryFee, serviceFee, discount, tip, total, promoCode, notes, etaMin } = body;

  const code = "ANT-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const order = await db.order.create({
    data: {
      code, customerId: c.id, restaurantId,
      status: "placed",
      subtotal, deliveryFee, serviceFee, discount: discount || 0, tip: tip || 0, total,
      paymentMethod: paymentMethod || "Tarjeta",
      address, notes: notes || null,
      etaMin: etaMin || 30,
      items: {
        create: items.map((it: any) => ({
          menuItemId: it.menuItemId ?? null,
          name: it.name, emoji: it.emoji ?? null, price: it.price, qty: it.qty, notes: it.notes ?? null,
        })),
      },
      events: { create: [{ status: "placed", label: "Pedido confirmado", at: new Date() }] },
    },
    include: ORDER_INCLUDE,
  });

  // award loyalty coins (1 coin per $1000, x2 for Oro tier)
  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: c.id } });
  if (loyalty) {
    const mult = loyalty.tier === "Oro" ? 2 : loyalty.tier === "Platino" ? 3 : loyalty.tier === "Plata" ? 1.5 : 1;
    const earned = Math.round((total / 1000) * mult);
    await db.loyaltyAccount.update({ where: { id: loyalty.id }, data: { coins: { increment: earned } } });
  }

  return NextResponse.json({ order: await serializeOrder(order) });
}

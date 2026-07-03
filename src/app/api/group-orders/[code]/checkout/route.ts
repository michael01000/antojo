import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// El host paga todo el carrito grupal
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { address, paymentMethod } = await req.json();

  const go = await db.groupOrder.findUnique({
    where: { code: code.toUpperCase() },
    include: { items: true, restaurant: true },
  });
  if (!go) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer || go.hostId !== customer.id) return NextResponse.json({ error: "Solo el host puede pagar" }, { status: 403 });

  const subtotal = go.items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = 0; // asumimos Prime en MVP
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + deliveryFee + serviceFee;

  const orderCode = "ANT-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const order = await db.order.create({
    data: {
      code: orderCode, customerId: customer.id, restaurantId: go.restaurantId,
      status: "placed", subtotal, deliveryFee, serviceFee, discount: 0, tip: 0, total,
      paymentMethod: paymentMethod || "Tarjeta", address, isGroup: true, etaMin: 35,
      items: { create: go.items.map((i) => ({ menuItemId: i.menuItemId, name: i.name, emoji: i.emoji, price: i.price, qty: i.qty, notes: i.notes ? `[${i.addedByName}] ${i.notes}` : `[${i.addedByName}]` })) },
      events: { create: [{ status: "placed", label: "Pedido grupal confirmado", at: new Date() }] },
    },
  });

  await db.groupOrder.update({ where: { id: go.id }, data: { status: "ordered" } });

  return NextResponse.json({ order: { id: order.id, code: order.code, total } });
}

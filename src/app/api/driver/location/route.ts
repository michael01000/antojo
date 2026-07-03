import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentDriver } from "@/lib/server";

export async function POST(req: NextRequest) {
  const me = await getCurrentDriver();
  const { lat, lng, orderId } = await req.json();
  if (orderId) {
    await db.order.update({ where: { id: orderId }, data: { driverLat: lat, driverLng: lng } });
  }
  return NextResponse.json({ ok: true });
}

// Complete current delivery
export async function PATCH(req: NextRequest) {
  const me = await getCurrentDriver();
  if (!me) return NextResponse.json({ error: "no driver" }, { status: 404 });
  const { orderId, action } = await req.json();
  if (action === "complete" && orderId) {
    await db.order.update({ where: { id: orderId }, data: { status: "delivered" } });
    await db.orderEvent.create({ data: { orderId, status: "delivered", label: "Pedido entregado", at: new Date() } });
    const earn = 4500;
    await db.driver.update({
      where: { id: me.id },
      data: { currentOrderId: null, earningsToday: { increment: earn }, completedToday: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad action" }, { status: 400 });
}

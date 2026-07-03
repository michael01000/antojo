import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentDriver, serializeOrder, ORDER_INCLUDE } from "@/lib/server";

// GET available orders (pending pickup, no driver assigned yet) + my active order
export async function GET() {
  const me = await getCurrentDriver();
  const available = await db.order.findMany({
    where: { status: { in: ["ready", "preparing", "accepted"] }, driverId: null },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  const active = me?.currentOrderId
    ? await db.order.findUnique({ where: { id: me.currentOrderId }, include: ORDER_INCLUDE })
    : null;
  const mine = await db.order.findMany({
    where: { driverId: me?.id, status: { in: ["picked_up", "en_route"] } },
    include: ORDER_INCLUDE,
  });
  return NextResponse.json({
    available: await Promise.all(available.map(serializeOrder)),
    active: active ? await serializeOrder(active) : (mine[0] ? await serializeOrder(mine[0]) : null),
    driver: me,
  });
}

// Accept an order
export async function POST(req: Request) {
  const me = await getCurrentDriver();
  const { orderId } = await req.json();
  const o = await db.order.update({
    where: { id: orderId },
    data: { driverId: me!.id, status: "picked_up", etaMin: 14 },
    include: ORDER_INCLUDE,
  });
  await db.orderEvent.create({ data: { orderId, status: "picked_up", label: `${me!.name} recogió el pedido`, at: new Date() } });
  await db.driver.update({ where: { id: me!.id }, data: { currentOrderId: orderId } });
  return NextResponse.json({ order: await serializeOrder(o) });
}

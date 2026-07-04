import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentDriver, serializeOrder, ORDER_INCLUDE } from "@/lib/server";
import { canAcceptCashOrder, CASH_OWED_LIMIT } from "@/lib/economics";

// GET available orders (pending pickup, no driver assigned yet) + my active order
// 🔒 Tope de riesgo: si cashOwed > CASH_OWED_LIMIT, filtra pedidos en efectivo.
export async function GET() {
  const me = await getCurrentDriver();

  // Verificar si el driver puede aceptar pedidos en efectivo
  const cashCheck = canAcceptCashOrder(me?.cashOwed ?? 0);
  const canCash = cashCheck.can;

  // Construir el filtro: si no puede efectivo, excluir pedidos con paymentMethod "Efectivo"
  const paymentFilter = canCash
    ? undefined
    : { not: { contains: "efectivo" } };

  const available = await db.order.findMany({
    where: {
      status: { in: ["ready", "preparing", "accepted"] },
      driverId: null,
      ...(paymentFilter ? { paymentMethod: paymentFilter } : {}),
    },
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
    cashWarning: canCash ? null : {
      message: cashCheck.reason,
      cashOwed: me?.cashOwed ?? 0,
      limit: CASH_OWED_LIMIT,
    },
  });
}

// Accept an order
// 🔒 Validación doble: si el pedido es en efectivo y el driver supera el tope, rechazar.
export async function POST(req: Request) {
  const me = await getCurrentDriver();
  const { orderId } = await req.json();

  // Fetch el pedido para validar método de pago
  const order = await db.order.findUnique({ where: { id: orderId }, select: { paymentMethod: true } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const isCash = order.paymentMethod.toLowerCase().includes("efectivo");
  if (isCash) {
    const cashCheck = canAcceptCashOrder(me?.cashOwed ?? 0);
    if (!cashCheck.can) {
      return NextResponse.json({ error: cashCheck.reason }, { status: 403 });
    }
  }

  const o = await db.order.update({
    where: { id: orderId },
    data: { driverId: me!.id, status: "picked_up", etaMin: 14 },
    include: ORDER_INCLUDE,
  });
  await db.orderEvent.create({ data: { orderId, status: "picked_up", label: `${me!.name} recogió el pedido`, at: new Date() } });
  await db.driver.update({ where: { id: me!.id }, data: { currentOrderId: orderId } });
  return NextResponse.json({ order: await serializeOrder(o) });
}

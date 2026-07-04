import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentDriver } from "@/lib/server";
import { shouldPauseBonuses, calcDriverBonus, calcCashOwedForOrder } from "@/lib/economics";

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
    // Fetch la orden completa (necesitamos total, tip, paymentMethod)
    const order = await db.order.findUnique({ where: { id: orderId }, select: { total: true, tip: true, paymentMethod: true } });
    if (!order) return NextResponse.json({ error: "orden no encontrada" }, { status: 404 });

    await db.order.update({ where: { id: orderId }, data: { status: "delivered" } });
    await db.orderEvent.create({ data: { orderId, status: "delivered", label: "Pedido entregado", at: new Date() } });

    const earn = 4500; // ganancia base por entrega

    // ─── Kill-switch reactivo (ahora async con datos live) ───
    const bonusesPaused = await shouldPauseBonuses();

    // Recargar al driver actualizado para tener completedToday y lastBonusTier frescos
    const freshDriver = await db.driver.findUnique({ where: { id: me.id } });
    const completedToday = (freshDriver?.completedToday ?? 0) + 1;
    const lastBonusTier = freshDriver?.lastBonusTier ?? 0;

    let bonusEarned = 0;
    let newBonusTier = lastBonusTier;
    let bonusLabel = "";

    if (!bonusesPaused) {
      const dayCommissionEstimate = earn * completedToday * 3;
      const bonusResult = calcDriverBonus(completedToday, lastBonusTier, dayCommissionEstimate);
      bonusEarned = bonusResult.bonus;
      newBonusTier = bonusResult.tier;
      bonusLabel = bonusResult.label;
    } else {
      bonusLabel = "Bono pausado (kill-switch activo — margen < 40%)";
    }

    const driverEarning = earn + bonusEarned;

    // ─── LEDGER DE EFECTIVO ───
    // Si el pedido fue en efectivo, el domiciliario recibió el dinero físico.
    // Debe consignar a la plataforma: total - tip - driverEarning
    let cashOwedIncrement = 0;
    const isCashOrder = order.paymentMethod.toLowerCase().includes("efectivo");
    if (isCashOrder) {
      cashOwedIncrement = calcCashOwedForOrder(order.total, order.tip, driverEarning);
    }

    await db.driver.update({
      where: { id: me.id },
      data: {
        currentOrderId: null,
        earningsToday: { increment: driverEarning },
        completedToday: { increment: 1 },
        bonusEarnedToday: { increment: bonusEarned },
        lastBonusTier: newBonusTier,
        cashOwed: { increment: cashOwedIncrement },
      },
    });

    return NextResponse.json({
      ok: true,
      earned: driverEarning,
      bonus: bonusEarned,
      bonusLabel,
      bonusesPaused,
      completedToday,
      cashOwed: (freshDriver?.cashOwed ?? 0) + cashOwedIncrement,
      cashCollected: isCashOrder ? order.total : 0,
    });
  }
  return NextResponse.json({ error: "bad action" }, { status: 400 });
}

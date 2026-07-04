import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import {
  getAuditReport, computePlatformMargin, clearAuditCache,
  getKillSwitchState, clearKillSwitchCache, shouldPauseBonuses,
  MIN_ORDERS_FOR_KILL_SWITCH,
} from "@/lib/economics";

/**
 * GET /api/admin/audit
 * Consolidado: simulación de 100 pedidos + actividad real del día + kill-switch live.
 *
 * Query params:
 *   ?refresh=1  → ignora el cache y recalcula (incluye kill-switch)
 */
export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const refresh = req.nextUrl.searchParams.get("refresh") === "1";

  // 1. Forzar recálculo del kill-switch si se solicita
  if (refresh) {
    clearKillSwitchCache();
    clearAuditCache();
    await shouldPauseBonuses(); // recalcular con datos live
  }

  // 2. Reporte de simulación (referencia)
  const simulation = await getAuditReport(refresh);

  // 3. Estado live del kill-switch
  const ksState = getKillSwitchState();

  // 4. Datos reales del día
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [deliveredOrders, drivers] = await Promise.all([
    db.order.findMany({
      where: { status: "delivered", updatedAt: { gte: startOfDay } },
      select: {
        subtotal: true,
        total: true,
        restaurant: { select: { adsPlan: true, pymePromoUntil: true, lastPostAt: true } },
      },
    }),
    db.driver.findMany({
      where: { completedToday: { gt: 0 } },
      select: { bonusEarnedToday: true, completedToday: true, earningsToday: true },
    }),
  ]);

  const bonusesPaidToday = drivers.reduce((s, d) => s + d.bonusEarnedToday, 0);
  const liveMargin = computePlatformMargin(deliveredOrders, bonusesPaidToday);

  return NextResponse.json({
    // Reporte de simulación (100 pedidos determinísticos — referencia)
    simulation,
    // Datos reales del día
    live: {
      ordersDeliveredToday: deliveredOrders.length,
      bonusesPaidToday,
      driversActiveToday: drivers.length,
      margin: liveMargin.margin,
      commission: liveMargin.commission,
      gateway: liveMargin.gateway,
      antojoNet: liveMargin.antojoNet,
      gmv: liveMargin.gmv,
    },
    // Estado consolidado del kill-switch (DATOS LIVE, no simulación)
    killSwitch: {
      active: ksState?.paused ?? false,
      threshold: 0.40,
      currentMargin: ksState?.margin ?? 1,
      ordersToday: ksState?.ordersToday ?? 0,
      minOrdersRequired: MIN_ORDERS_FOR_KILL_SWITCH,
      reason: ksState?.reason ?? "Kill-switch no evaluado aún.",
      source: "live", // ← ahora usa datos reales, no simulación
    },
  });
}

/**
 * POST /api/admin/audit
 * Permite al admin limpiar el cache manualmente (forzar recálculo).
 */
export async function POST() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  clearAuditCache();
  clearKillSwitchCache();
  return NextResponse.json({ ok: true, message: "Caches limpiados (auditoría + kill-switch)" });
}

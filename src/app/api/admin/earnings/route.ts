import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCommissionRate, calcGatewayFee, pymePromoActive } from "@/lib/economics";

/**
 * GET /api/admin/earnings
 * Dashboard financiero macro de la plataforma.
 *
 * Eficiencia: trae órdenes entregadas de 7 días en una query, agrega en JS.
 * Evita N+1 al agrupar por restaurante en memoria.
 *
 * Devuelve:
 *   - KPIs macro: comisión total retenida, bonos pagados, margen global, GMV
 *   - Serie 7 días (comisión vs bonos) para gráfico
 *   - Top 5 restaurantes por comisión generada
 *   - Transacciones globales recientes (top 15)
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin") {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const now = new Date();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const start7dAgo = new Date(); start7dAgo.setDate(start7dAgo.getDate() - 6); start7dAgo.setHours(0, 0, 0, 0);

  // ─── Query única: órdenes entregadas de 7 días con restaurante ───
  const orders7d = await db.order.findMany({
    where: { status: "delivered", createdAt: { gte: start7dAgo } },
    select: {
      subtotal: true, total: true, createdAt: true, code: true, paymentMethod: true,
      restaurantId: true,
      restaurant: { select: { id: true, name: true, imageUrl: true, adsPlan: true, pymePromoUntil: true, lastPostAt: true, cuisine: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // ─── Bono total pagado hoy (de drivers) ───
  const drivers = await db.driver.findMany({
    where: { completedToday: { gt: 0 } },
    select: { bonusEarnedToday: true, earningsToday: true, completedToday: true, name: true },
  });
  const bonusesPaidToday = drivers.reduce((s, d) => s + d.bonusEarnedToday, 0);
  const bonusesPaid7d = bonusesPaidToday; // MVP: solo tenemos datos de hoy

  // ─── Serie 7 días (comisión vs bonos vs neto) ───
  const days: { label: string; comision: number; bonos: number; neto: number; gmv: number; ordenes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start7dAgo);
    d.setDate(d.getDate() + (6 - i));
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = orders7d.filter(o => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd);
    let comision = 0, gateway = 0, gmv = 0;
    for (const o of dayOrders) {
      const rate = getCommissionRate(o.restaurant);
      comision += Math.round(o.subtotal * rate);
      gateway += calcGatewayFee(o.total);
      gmv += o.subtotal;
    }
    const bonos = i === 6 ? bonusesPaidToday : 0; // solo hoy tenemos datos reales
    const neto = comision - gateway - bonos;
    days.push({ label: d.toLocaleDateString("es-CO", { weekday: "short" }), comision, bonos, neto, gmv, ordenes: dayOrders.length });
  }

  // ─── KPIs macro (7 días) ───
  const comisionTotal7d = days.reduce((s, d) => s + d.comision, 0);
  const gatewayTotal7d = orders7d.reduce((s, o) => s + calcGatewayFee(o.total), 0);
  const gmv7d = days.reduce((s, d) => s + d.gmv, 0);
  const neto7d = comisionTotal7d - gatewayTotal7d - bonusesPaid7d;
  const margin7d = comisionTotal7d > 0 ? neto7d / comisionTotal7d : 0;

  // ─── KPIs de hoy ───
  const todayOrders = orders7d.filter(o => new Date(o.createdAt) >= startToday);
  const comisionToday = todayOrders.reduce((s, o) => s + Math.round(o.subtotal * getCommissionRate(o.restaurant)), 0);
  const gmvToday = todayOrders.reduce((s, o) => s + o.subtotal, 0);

  // ─── Top 5 restaurantes por comisión generada (7 días) ───
  const byRestaurant = new Map<string, { name: string; imageUrl: string; cuisine: string; comision: number; gmv: number; ordenes: number }>();
  for (const o of orders7d) {
    const rate = getCommissionRate(o.restaurant);
    const comision = Math.round(o.subtotal * rate);
    const r = o.restaurant;
    const entry = byRestaurant.get(r.id) ?? { name: r.name, imageUrl: r.imageUrl, cuisine: r.cuisine, comision: 0, gmv: 0, ordenes: 0 };
    entry.comision += comision;
    entry.gmv += o.subtotal;
    entry.ordenes += 1;
    byRestaurant.set(r.id, entry);
  }
  const top5 = Array.from(byRestaurant.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.comision - a.comision)
    .slice(0, 5);

  // ─── Transacciones globales recientes (top 15) ───
  const recent = orders7d.slice(0, 15).map(o => {
    const rate = getCommissionRate(o.restaurant);
    return {
      code: o.code,
      restaurant: o.restaurant.name,
      bruto: o.subtotal,
      comision: Math.round(o.subtotal * rate),
      gateway: calcGatewayFee(o.total),
      neto: Math.round(o.subtotal * rate) - calcGatewayFee(o.total),
      paymentMethod: o.paymentMethod,
      at: o.createdAt.toISOString(),
    };
  });

  return NextResponse.json({
    kpis: {
      comisionTotal7d, gmv7d, neto7d, margin7d,
      comisionToday, gmvToday,
      bonusesPaidToday, bonusesPaid7d,
      ordenes7d: orders7d.length,
      ordenesHoy: todayOrders.length,
      driversActiveToday: drivers.length,
    },
    serie7d: days,
    top5,
    recent,
  });
}

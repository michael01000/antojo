import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCommissionRate, calcGatewayFee, GATEWAY_RATE, GATEWAY_FIXED, pymePromoActive } from "@/lib/economics";

/**
 * GET /api/restaurant/earnings
 * Dashboard financiero del restaurante.
 *
 * Eficiencia: usa db.order.groupBy para agregaciones de 7 días en una sola query.
 * Transparencia: separa comisión Antojo vs. tarifa de gateway (pasarela de pagos).
 *
 * Devuelve:
 *   - KPIs: bruto hoy, neto hoy, comisión pagada, gateway pagado, órdenes hoy
 *   - Serie 7 días (bruto vs neto) para gráfico de área
 *   - Plan de Ads actual + días restantes de promo PYMES
 *   - Transacciones recientes (top 10)
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") {
    return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  }
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  // ─── Fechas ───
  const now = new Date();
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const start7dAgo = new Date(); start7dAgo.setDate(start7dAgo.getDate() - 6); start7dAgo.setHours(0, 0, 0, 0);

  // ─── Query 1: groupBy por día (7 días) — una sola consulta ───
  // Estados que generan ingreso (el cliente ya pagó aunque no se haya entregado)
  const REVENUE_STATUSES = ["delivered", "en_route", "picked_up", "ready", "preparing", "accepted", "placed"];

  // Prisma groupBy agrega en la DB, evitando N+1.
  const dailyAgg = await db.order.groupBy({
    by: ["status"],
    where: { restaurantId: restaurant.id, createdAt: { gte: start7dAgo }, status: { in: REVENUE_STATUSES } },
    _sum: { subtotal: true, total: true },
    _count: true,
  });

  // Como groupBy de Prisma no soporta agrupar por fecha directamente en Postgres
  // de forma portable, traemos las órdenes de 7 días y agregamos en JS (máx ~100-500 órdenes).
  const orders7d = await db.order.findMany({
    where: { restaurantId: restaurant.id, createdAt: { gte: start7dAgo }, status: { in: REVENUE_STATUSES } },
    select: { subtotal: true, total: true, createdAt: true, code: true, paymentMethod: true, discount: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // ─── Agregación por día (bruto vs neto) ───
  // Neto a pagar al restaurante = Bruto - Comisión Antojo - Costo Pasarela - Promos financiadas por el restaurante
  const rate = getCommissionRate(restaurant);
  const days: { label: string; bruto: number; neto: number; comision: number; gateway: number; promosRestaurante: number; ordenes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(start7dAgo);
    d.setDate(d.getDate() + (6 - i));
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = orders7d.filter(o => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd);
    const bruto = dayOrders.reduce((s, o) => s + o.subtotal, 0);
    const comision = Math.round(bruto * rate);
    const gateway = dayOrders.reduce((s, o) => s + calcGatewayFee(o.total), 0);
    // Promos financiadas por el restaurante (descuentos % aplicados a órdenes de este restaurante)
    // MVP: si la orden tiene discount > 0 y la promo era %, el restaurante lo financia
    const promosRestaurante = dayOrders.reduce((s, o) => s + (o.discount || 0), 0);
    const neto = bruto - comision - gateway - promosRestaurante; // lo que recibe el restaurante (liquidación)
    days.push({
      label: d.toLocaleDateString("es-CO", { weekday: "short" }),
      bruto, neto, comision, gateway, promosRestaurante,
      ordenes: dayOrders.length,
    });
  }

  // ─── KPIs de hoy ───
  const todayOrders = orders7d.filter(o => new Date(o.createdAt) >= startToday);
  const brutoHoy = todayOrders.reduce((s, o) => s + o.subtotal, 0);
  const comisionHoy = Math.round(brutoHoy * rate);
  const gatewayHoy = todayOrders.reduce((s, o) => s + calcGatewayFee(o.total), 0);
  const promosRestauranteHoy = todayOrders.reduce((s, o) => s + (o.discount || 0), 0);
  const netoHoy = brutoHoy - comisionHoy - gatewayHoy - promosRestauranteHoy;

  // ─── Totales 7 días ───
  const bruto7d = days.reduce((s, d) => s + d.bruto, 0);
  const neto7d = days.reduce((s, d) => s + d.neto, 0);
  const comision7d = days.reduce((s, d) => s + d.comision, 0);
  const gateway7d = days.reduce((s, d) => s + d.gateway, 0);

  // ─── Plan de Ads + promo PYMES ───
  const promoActive = pymePromoActive(restaurant);
  const pymeDaysLeft = restaurant.pymePromoUntil
    ? Math.max(0, Math.ceil((new Date(restaurant.pymePromoUntil).getTime() - now.getTime()) / 86400000))
    : 0;

  // ─── Transacciones recientes (top 10) ───
  const recent = orders7d.slice(0, 10).map(o => ({
    code: o.code,
    bruto: o.subtotal,
    comision: Math.round(o.subtotal * rate),
    gateway: calcGatewayFee(o.total),
    promosRestaurante: o.discount || 0,
    neto: o.subtotal - Math.round(o.subtotal * rate) - calcGatewayFee(o.total) - (o.discount || 0),
    paymentMethod: o.paymentMethod,
    at: o.createdAt.toISOString(),
  }));

  return NextResponse.json({
    kpis: {
      brutoHoy, netoHoy, comisionHoy, gatewayHoy, promosRestauranteHoy,
      ordenesHoy: todayOrders.length,
      bruto7d, neto7d, comision7d, gateway7d,
      ordenes7d: orders7d.length,
      avgTicket: todayOrders.length ? Math.round(brutoHoy / todayOrders.length) : 0,
    },
    serie7d: days,
    plan: {
      adsPlan: restaurant.adsPlan,
      adsRenewsAt: restaurant.adsRenewsAt?.toISOString() ?? null,
      sponsoredUsed: restaurant.sponsoredPostsUsed,
      commissionRate: rate,
    },
    pyme: {
      active: promoActive,
      until: restaurant.pymePromoUntil?.toISOString() ?? null,
      daysLeft: pymeDaysLeft,
      lastPostAt: restaurant.lastPostAt?.toISOString() ?? null,
    },
    recent,
    // Transparencia: desglose de costos para el restaurante
    costBreakdown: {
      gatewayRate: GATEWAY_RATE,
      gatewayFixed: GATEWAY_FIXED,
      commissionRate: rate,
      commissionLabel: promoActive ? "0% (Promo PYMES activa)" : `${(rate * 100).toFixed(0)}%`,
    },
  });
}

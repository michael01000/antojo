import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCommissionRate, calcGatewayFee, SERVICE_FEE_RATE, PRIME_FREE_DELIVERY_MIN } from "@/lib/economics";

/**
 * GET /api/admin/profitability
 *
 * Panel de Rentabilidad — desglose de ingresos por stream vs costos operativos.
 * Permite auditar la salud financiera con un solo vistazo.
 *
 * Streams de ingreso:
 *  - Comisiones retenidas (por plan de Ads + promo PYMES)
 *  - Service fee cobrado al cliente (8%)
 *  - Envíos cobrados al cliente
 *  - Suscripciones Prime (mensual)
 *  - Patrocinios de Ads (posts patrocinados)
 *
 * Costos operativos:
 *  - Pagos base a domiciliarios ($4.500/entrega)
 *  - Bonos pagados a domiciliarios
 *  - Promos subsidiadas por Antojo (fundedBy=antojo)
 *  - Gateway de pagos (2.9% + $900)
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
      subtotal: true, total: true, deliveryFee: true, serviceFee: true,
      discount: true, tip: true, paymentMethod: true, createdAt: true, code: true,
      restaurantId: true,
      restaurant: { select: { id: true, name: true, adsPlan: true, pymePromoUntil: true, lastPostAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  // ─── Suscripciones Prime activas (ingreso mensual recurrente) ───
  const primeSubscriptions = await db.subscription.count({
    where: { plan: { in: ["prime", "prime_plus"] }, status: "active" },
  });
  const PRIME_MONTHLY = 14900;
  const primeMonthlyRevenue = primeSubscriptions * PRIME_MONTHLY;

  // ─── Patrocinios de Ads (ingreso por posts patrocinados) ───
  // Aproximación: restaurantes en plan Pro ($49.900) + Premium ($99.900)
  const proCount = await db.restaurant.count({ where: { adsPlan: "pro" } });
  const premiumCount = await db.restaurant.count({ where: { adsPlan: "premium" } });
  const adsMonthlyRevenue = proCount * 49900 + premiumCount * 99900;

  // ─── Drivers: pagos base + bonos ───
  const drivers = await db.driver.findMany({
    where: { completedToday: { gt: 0 } },
    select: { earningsToday: true, bonusEarnedToday: true, completedToday: true, name: true },
  });
  const driverBasePayToday = drivers.reduce((s, d) => s + (d.earningsToday - d.bonusEarnedToday), 0);
  const bonusesPaidToday = drivers.reduce((s, d) => s + d.bonusEarnedToday, 0);

  // ─── Promos subsidiadas por Antojo (fundedBy=antojo, historico de usos) ───
  const antojoPromos = await db.promotion.findMany({
    where: { fundedBy: "antojo" },
    select: { code: true, type: true, value: true, uses: true },
  });
  const promosSubsidizedByAntojo = antojoPromos.reduce((s, p) => s + (p.type === "fixed" ? p.value * p.uses : 0), 0);

  // ─── Agregar por día (7 días) ───
  const days: {
    label: string;
    comision: number; serviceFee: number; envios: number;
    driverPay: number; bonos: number; gateway: number;
    neto: number; ordenes: number; margin: number;
  }[] = [];

  let totalCommission = 0, totalServiceFee = 0, totalDeliveryFee = 0;
  let totalGateway = 0, totalDiscountAntojo = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(start7dAgo);
    d.setDate(d.getDate() + (6 - i));
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1);
    const dayOrders = orders7d.filter(o => new Date(o.createdAt) >= dayStart && new Date(o.createdAt) < dayEnd);

    let comision = 0, serviceFee = 0, envios = 0, gateway = 0, discountAntojo = 0;
    for (const o of dayOrders) {
      const rate = getCommissionRate(o.restaurant);
      comision += Math.round(o.subtotal * rate);
      serviceFee += o.serviceFee;
      envios += o.deliveryFee;
      gateway += calcGatewayFee(o.total);
      // descuento subsidiado por antojo (aproximado: si el discount > 0 y era promo fixed)
      discountAntojo += o.discount * 0.5; // MVP: 50% aprox hasta tener campo fundedBy en Order
    }
    const bonos = i === 6 ? bonusesPaidToday : 0;
    const driverPay = i === 6 ? driverBasePayToday : 0;
    const neto = comision + serviceFee + envios - gateway - discountAntojo - bonos - driverPay;
    const margin = (comision + serviceFee + envios) > 0 ? neto / (comision + serviceFee + envios) : 0;

    totalCommission += comision; totalServiceFee += serviceFee; totalDeliveryFee += envios;
    totalGateway += gateway; totalDiscountAntojo += discountAntojo;

    days.push({
      label: d.toLocaleDateString("es-CO", { weekday: "short" }),
      comision, serviceFee, envios, driverPay, bonos, gateway,
      neto, ordenes: dayOrders.length, margin,
    });
  }

  // ─── KPIs consolidados ───
  const totalRevenue7d = totalCommission + totalServiceFee + totalDeliveryFee;
  const totalCosts7d = totalGateway + totalDiscountAntojo + bonusesPaidToday + driverBasePayToday;
  const neto7d = totalRevenue7d - totalCosts7d;
  const margin7d = totalRevenue7d > 0 ? neto7d / totalRevenue7d : 0;

  return NextResponse.json({
    // Streams de ingreso (7 días + mensual recurrente)
    revenue: {
      streams: {
        commission: totalCommission,        // comisiones retenidas
        serviceFee: totalServiceFee,         // service fee cobrado al cliente
        deliveryFee: totalDeliveryFee,       // envíos cobrados al cliente
        primeSubscriptions: primeMonthlyRevenue, // suscripciones Prime (mensual)
        ads: adsMonthlyRevenue,              // patrocinios/planes Ads (mensual)
      },
      total7d: totalRevenue7d,
      totalMonthly: totalRevenue7d + primeMonthlyRevenue + adsMonthlyRevenue, // proyección mensual
    },
    // Costos operativos (7 días)
    costs: {
      driverBasePay: driverBasePayToday,      // pagos base a domiciliarios
      bonuses: bonusesPaidToday,              // bonos pagados
      gateway: totalGateway,                  // pasarela de pagos
      promosSubsidized: totalDiscountAntojo,  // promos subsidiadas por Antojo
    },
    total7d: totalRevenue7d,
    neto7d,
    margin7d,
    // Serie 7 días para gráfico
    serie7d: days,
    // Desglose de margen por pedido (top 10 recientes)
    perOrder: orders7d.slice(0, 10).map(o => {
      const rate = getCommissionRate(o.restaurant);
      const com = Math.round(o.subtotal * rate);
      const gw = calcGatewayFee(o.total);
      const net = com + o.serviceFee + o.deliveryFee - gw;
      return {
        code: o.code,
        restaurant: o.restaurant.name,
        subtotal: o.subtotal,
        commission: com,
        serviceFee: o.serviceFee,
        deliveryFee: o.deliveryFee,
        gateway: gw,
        net,
        margin: (com + o.serviceFee + o.deliveryFee) > 0 ? net / (com + o.serviceFee + o.deliveryFee) : 0,
        at: o.createdAt.toISOString(),
      };
    }),
    // Info de sostenibilidad
    sustainability: {
      primeMin: PRIME_FREE_DELIVERY_MIN,
      primeSubscribers: primeSubscriptions,
      proRestaurants: proCount,
      premiumRestaurants: premiumCount,
      antojoPromos: antojoPromos.map(p => ({ code: p.code, uses: p.uses, value: p.value })),
    },
  });
}

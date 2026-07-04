import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer, serializeOrder, ORDER_INCLUDE } from "@/lib/server";
import { calculateOrderTotals } from "@/lib/economics";

export async function GET() {
  const c = await getCurrentCustomer();
  const orders = await db.order.findMany({
    where: { customerId: c.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders: await Promise.all(orders.map(serializeOrder)) });
}

/**
 * POST /api/orders
 *
 * 🔒 SEGURIDAD FINANCIERA: El servidor recalcula TODOS los totales usando
 * calculateOrderTotals() (fuente única de verdad en economics.ts).
 * Los valores enviados por el cliente (subtotal, total, serviceFee, etc.)
 * son IGNORADOS — se recalculan desde los menuItems reales de la DB.
 *
 * Esto previene manipulación de precios desde el cliente.
 */
export async function POST(req: NextRequest) {
  const c = await getCurrentCustomer();
  const body = await req.json();
  const { items, restaurantId, address, paymentMethod, tip: clientTip, promoCode, notes, etaMin } = body;

  // ─── 1. Validar que hay items ───
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
  }

  // ─── 2. Fetch los menuItems REALES desde la DB (no confiar en el cliente) ───
  const menuItemIds = items.map((it: any) => it.menuItemId).filter(Boolean);
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    select: { id: true, name: true, price: true, emoji: true, isAvailable: true, restaurantId: true },
  });

  // Validar que todos los items existen y están disponibles
  for (const it of items) {
    const mi = menuItems.find((m) => m.id === it.menuItemId);
    if (!mi) return NextResponse.json({ error: `Item no encontrado: ${it.name}` }, { status: 400 });
    if (!mi.isAvailable) return NextResponse.json({ error: `${mi.name} no está disponible` }, { status: 400 });
    if (mi.restaurantId !== restaurantId) return NextResponse.json({ error: "Items de restaurantes mezclados" }, { status: 400 });
  }

  // ─── 3. Calcular subtotal REAL desde la DB (precio × qty) ───
  const subtotal = items.reduce((sum: number, it: any) => {
    const mi = menuItems.find((m) => m.id === it.menuItemId);
    return sum + (mi!.price * it.qty);
  }, 0);

  // ─── 4. Fetch el restaurante para comisión + plan ───
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { adsPlan: true, pymePromoUntil: true, lastPostAt: true, deliveryFee: true },
  });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  // ─── 5. Validar promo (si aplica) + determinar fundedBy ───
  let discount = 0;
  let freeDelivery = false;
  let discountFundedBy: "restaurant" | "antojo" | "none" = "none";
  let appliedPromoId: string | null = null;
  if (promoCode) {
    const promo = await db.promotion.findUnique({ where: { code: promoCode.toUpperCase().trim() } });
    if (promo && promo.active && subtotal >= promo.minOrder) {
      // Si es cupón COIN-* (con ownerCustomerId), validar que pertenezca al cliente y no esté usado
      if (promo.ownerCustomerId) {
        if (promo.ownerCustomerId !== c.id) {
          return NextResponse.json({ error: "Este cupón no te pertenece" }, { status: 403 });
        }
        if (promo.used) {
          return NextResponse.json({ error: "Este cupón ya fue usado" }, { status: 400 });
        }
      }
      // fundedBy de la DB, con regla de negocio: % siempre restaurante, fixed según DB
      if (promo.type === "percent") {
        discount = Math.round((subtotal * promo.value) / 100);
        discountFundedBy = "restaurant"; // estándar de industria: % lo asume el restaurante
      } else if (promo.type === "fixed") {
        discount = promo.value;
        discountFundedBy = (promo.fundedBy as "restaurant" | "antojo") || "antojo"; // adquisición = Antojo
      } else if (promo.type === "free_delivery") {
        freeDelivery = true;
        discountFundedBy = "antojo"; // envío gratis subsidiado por Antojo
      }
      await db.promotion.update({ where: { id: promo.id }, data: { uses: { increment: 1 } } });
      appliedPromoId = promo.id;
    }
  }

  // ─── 6. Recalcular totales con calculateOrderTotals (fuente única de verdad) ───
  // 🔒 Prime: envío gratis solo si subtotal >= $25.000 (PRIME_FREE_DELIVERY_MIN)
  // calculateOrderTotals valida esto internamente.
  const tip = typeof clientTip === "number" && clientTip >= 0 ? clientTip : 0;
  const isPrime = !!(await db.subscription.findUnique({ where: { customerId: c.id } }))?.plan.includes("prime");
  const totals = calculateOrderTotals({
    subtotal,
    restaurant,
    isPrime,
    tip,
    discount,
    discountFundedBy,
    freeDelivery,
    baseDeliveryFee: restaurant.deliveryFee,
  });

  // ─── 7. Crear la orden con los totales recalculados (NO los del cliente) ───
  const code = "ANT-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const order = await db.order.create({
    data: {
      code, customerId: c.id, restaurantId,
      status: "placed",
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      discount: totals.discount,
      tip: totals.tip,
      total: totals.total,
      paymentMethod: paymentMethod || "Tarjeta",
      address,
      notes: notes || null,
      etaMin: etaMin || 30,
      items: {
        create: items.map((it: any) => {
          const mi = menuItems.find((m) => m.id === it.menuItemId)!;
          return {
            menuItemId: it.menuItemId ?? null,
            name: mi.name,           // nombre real de la DB
            emoji: mi.emoji,         // emoji real de la DB
            price: mi.price,         // precio real de la DB
            qty: it.qty,
            notes: it.notes ?? null,
          };
        }),
      },
      events: { create: [{ status: "placed", label: "Pedido confirmado", at: new Date() }] },
    },
    include: ORDER_INCLUDE,
  });

  // ─── 8. Award loyalty coins ───
  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: c.id } });
  if (loyalty) {
    const mult = loyalty.tier === "Oro" ? 2 : loyalty.tier === "Platino" ? 3 : loyalty.tier === "Plata" ? 1.5 : 1;
    const earned = Math.round((totals.total / 1000) * mult);
    await db.loyaltyAccount.update({ where: { id: loyalty.id }, data: { coins: { increment: earned } } });
  }

  // ─── 9. Marcar cupón COIN-* como usado (si se aplicó uno) ───
  if (appliedPromoId) {
    await db.promotion.update({ where: { id: appliedPromoId }, data: { used: true, active: false } });
  }

  return NextResponse.json({ order: await serializeOrder(order) });
}

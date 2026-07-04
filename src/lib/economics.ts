import "server-only";
import { db } from "./db";

/**
 * Antojo — Motor económico central
 * -------------------------------
 * Fuente única de verdad para comisiones, tarifas, bonos y promociones.
 * Todas las APIs y UIs deben usar estas funciones, nunca hardcodear números.
 */

// ─── Configuración de costos ───
export const GATEWAY_RATE = 0.029; // 2.9% pasarela de pagos (Wompi/MercadoPago CO)
export const GATEWAY_FIXED = 900; // ~$900 fijo por transacción
export const SERVICE_FEE_RATE = 0.08; // 8% fee de servicio al cliente

// ─── Comisiones por plan de Ads ───
export const COMMISSION = {
  free: 0.18, // 18% — comisión estándar
  pro: 0.12, // 12%
  premium: 0.10, // 10%
  pyme_promo: 0.0, // 0% durante promo PYMES (2 meses)
} as const;

// ─── Planes Antojo Ads (B2B) ───
export const ADS_PLANS = {
  free: { price: 0, postsPerMonth: 5, sponsoredPerMonth: 0, storiesPerDay: 3, label: "Free" },
  pro: { price: 49900, postsPerMonth: 20, sponsoredPerMonth: 3, storiesPerDay: 999, label: "Pro" },
  premium: { price: 99900, postsPerMonth: 9999, sponsoredPerMonth: 10, storiesPerDay: 999, label: "Premium" },
} as const;

// ─── Promo PYMES ───
export const PYME_PROMO_DAYS = 60; // 2 meses sin comisión
export const PYME_WEEKLY_POST_REQUIREMENT = 7; // debe postear 1 vez cada 7 días

// ─── Gamificación domiciliarios ───
export const DRIVER_BONUS_TIERS = [
  { tier: 5, bonus: 2000, label: "5 entregas" },
  { tier: 10, bonus: 5000, label: "10 entregas (acumulativo)" },
  { tier: 15, bonus: 10000, label: "15 entregas (acumulativo)" },
] as const;
export const DRIVER_BONUS_CAP_RATE = 0.25; // bono total ≤ 25% de comisión del día
export const DRIVER_MIN_MARGIN = 0.40; // si margen baja de 40%, desactivar bonos

// ─── Ledger de efectivo (domiciliarios) ───
// Tope de riesgo: si el domiciliario debe más de este monto en efectivo
// a la plataforma, no puede recibir nuevos pedidos en efectivo (solo digitales).
export const CASH_OWED_LIMIT = 200000; // $200.000 COP

// ─── Prime: envío gratis solo si el pedido supera este mínimo ───
export const PRIME_FREE_DELIVERY_MIN = 25000; // $25.000 COP

// ─── Tipos ───
export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
  total: number;
  // Desglose Antojo
  commission: number;
  gatewayFee: number;
  antojoNet: number;
  restaurantPayout: number;
  margin: number; // 0-1
  // Streams de ingreso (para panel de rentabilidad)
  revenue: {
    commission: number;        // comisión retenida al restaurante
    serviceFee: number;        // service fee cobrado al cliente
    deliveryFee: number;       // envío cobrado al cliente (va a Antojo, no al driver directamente)
  };
  // Costos operativos
  costs: {
    gatewayFee: number;        // pasarela de pagos
    discountFundedByAntojo: number;   // descuento que Antojo asume (promos fixed)
    discountFundedByRestaurant: number; // descuento que el restaurante asume (promos %)
  };
  // ¿Quién financió el descuento?
  discountFundedBy: "restaurant" | "antojo" | "none";
}

export interface DriverBonusResult {
  bonus: number;
  tier: number;
  label: string;
}

// ─── Funciones core ───

/** Tarifa de la pasarela de pagos */
export function calcGatewayFee(total: number): number {
  return Math.round(total * GATEWAY_RATE + GATEWAY_FIXED);
}

/** Comisión de Antojo según el plan del restaurante (o promo PYMES) */
export function getCommissionRate(restaurant: { adsPlan: string; pymePromoUntil: Date | null; lastPostAt: Date | null }): number {
  if (pymePromoActive(restaurant)) return COMMISSION.pyme_promo;
  return COMMISSION[restaurant.adsPlan as keyof typeof COMMISSION] ?? COMMISSION.free;
}

/** ¿La promo PYMES está activa? (dentro de los 60 días Y posteo en los últimos 7 días) */
export function pymePromoActive(restaurant: { pymePromoUntil: Date | null; lastPostAt: Date | null }): boolean {
  if (!restaurant.pymePromoUntil) return false;
  if (new Date(restaurant.pymePromoUntil) < new Date()) return false;
  // Condición: debe haber posteado en los últimos 7 días
  if (restaurant.lastPostAt) {
    const daysSincePost = (Date.now() - new Date(restaurant.lastPostAt).getTime()) / 86400000;
    if (daysSincePost > PYME_WEEKLY_POST_REQUIREMENT) return false; // perdió el beneficio
  }
  return true;
}

/**
 * Calcula todos los totales de una orden (fuente única de verdad).
 *
 * Sostenibilidad:
 *  - Prime: envío gratis SOLO si subtotal >= PRIME_FREE_DELIVERY_MIN ($25.000).
 *    Si es menor, el usuario Prime paga el envío normal.
 *  - Descuentos: `discountFundedBy` indica quién asume el descuento.
 *    "restaurant" → promos % (se le descuenta del restaurantPayout).
 *    "antojo" → promos fixed de adquisición (se le descuenta del antojoNet).
 */
export function calculateOrderTotals(params: {
  subtotal: number;
  restaurant: { adsPlan: string; pymePromoUntil: Date | null; lastPostAt: Date | null };
  isPrime: boolean;
  tip: number;
  discount?: number;
  discountFundedBy?: "restaurant" | "antojo" | "none";
  freeDelivery?: boolean;
  baseDeliveryFee?: number;
}): OrderTotals {
  const { subtotal, restaurant, isPrime, tip, discount = 0, discountFundedBy = "restaurant", freeDelivery = false, baseDeliveryFee = 4500 } = params;

  // ─── Envío: Prime gratis solo si supera el mínimo ───
  const primeFreeDeliveryApplies = isPrime && subtotal >= PRIME_FREE_DELIVERY_MIN;
  const deliveryFee = freeDelivery || primeFreeDeliveryApplies ? 0 : baseDeliveryFee;

  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tip - discount);

  const commissionRate = getCommissionRate(restaurant);
  const commission = Math.round(subtotal * commissionRate);
  const gatewayFee = calcGatewayFee(total);

  // ─── Streams de ingreso ───
  const revenue = {
    commission,       // comisión retenida al restaurante
    serviceFee,       // service fee cobrado al cliente
    deliveryFee,      // envío cobrado al cliente
  };

  // ─── Costos operativos ───
  const discountFundedByAntojo = discountFundedBy === "antojo" ? discount : 0;
  const discountFundedByRestaurant = discountFundedBy === "restaurant" ? discount : 0;
  const costs = {
    gatewayFee,
    discountFundedByAntojo,
    discountFundedByRestaurant,
  };

  // ─── Neto de Antojo ───
  // Ingresos: comisión + serviceFee + deliveryFee (todo lo que cobra Antojo)
  // Costos: gateway + descuentos que Antojo financia
  const antojoNet = commission + serviceFee + deliveryFee - gatewayFee - discountFundedByAntojo;

  // ─── Payout al restaurante ───
  // Subtotal - comisión - descuentos que el restaurante financia
  const restaurantPayout = subtotal - commission - discountFundedByRestaurant;

  const margin = total > 0 ? antojoNet / total : 0;

  return {
    subtotal, deliveryFee, serviceFee, discount, tip, total,
    commission, gatewayFee, antojoNet, restaurantPayout, margin,
    revenue, costs, discountFundedBy,
  };
}

/** Calcula el bono del domiciliario según entregas del día */
export function calcDriverBonus(completedToday: number, lastBonusTier: number, dayCommissionAccumulated: number): DriverBonusResult {
  // Encontrar el tier más alto alcanzado que no se haya cobrado ya
  let achievedTier = 0;
  let bonus = 0;
  let label = "";
  for (const t of DRIVER_BONUS_TIERS) {
    if (completedToday >= t.tier && t.tier > lastBonusTier) {
      achievedTier = t.tier;
      bonus = t.bonus;
      label = t.label;
    }
  }
  // Cap de seguridad: el bono no puede exceder 25% de la comisión acumulada del día
  const cap = Math.round(dayCommissionAccumulated * DRIVER_BONUS_CAP_RATE);
  if (bonus > cap) bonus = cap;
  // Guarda de margen: si el margen proyectado baja de 40%, no dar bono
  const projectedMargin = (dayCommissionAccumulated - bonus) / Math.max(1, dayCommissionAccumulated);
  if (projectedMargin < DRIVER_MIN_MARGIN && bonus > 0) {
    bonus = 0;
    achievedTier = lastBonusTier;
    label = "Bono pausado (protección de margen)";
  }
  return { bonus, tier: achievedTier, label };
}

/** ¿Puede el restaurante patrocinar un post? */
export function canSponsor(restaurant: { adsPlan: string; sponsoredPostsUsed: number; sponsoredPostsResetAt: Date | null }): { can: boolean; reason?: string; remaining: number } {
  const plan = ADS_PLANS[restaurant.adsPlan as keyof typeof ADS_PLANS] ?? ADS_PLANS.free;
  // Reset mensual
  let used = restaurant.sponsoredPostsUsed;
  if (restaurant.sponsoredPostsResetAt && new Date(restaurant.sponsoredPostsResetAt) < new Date()) {
    used = 0; // se resetea este mes
  }
  const remaining = plan.sponsoredPerMonth - used;
  if (plan.sponsoredPerMonth === 0) return { can: false, reason: "Tu plan Free no incluye posts patrocinados. Mejora a Pro o Premium.", remaining: 0 };
  if (remaining <= 0) return { can: false, reason: "Agotaste tus posts patrocinados de este mes.", remaining: 0 };
  return { can: true, remaining };
}

/** Inicia la promo PYMES para un restaurante nuevo */
export function startPymePromo(): Date {
  const until = new Date();
  until.setDate(until.getDate() + PYME_PROMO_DAYS);
  return until;
}

// ════════════════════════════════════════════════════════════════════
//  AUDITORÍA DE RENTABILIDAD + KILL-SWITCH DE BONOS
//  Protege el margen de plataforma: si cae <40%, los bonos se pausan.
//  Cache en memoria de 5 min a nivel módulo para no golpear la DB.
// ════════════════════════════════════════════════════════════════════

/** Resultado de la auditoría de rentabilidad */
export interface AuditResult {
  /** Margen neto de plataforma (0-1). <0.4 activa el kill-switch. */
  margin: number;
  /** Comisión total retenida por Antojo en el período simulado */
  commissionRetained: number;
  /** Costo total de la pasarela de pagos */
  gatewayCost: number;
  /** Bono total pagado a domiciliarios */
  bonusesPaid: number;
  /** GMV bruto del período */
  gmv: number;
  /** Neto de Antojo después de gateway y bonos */
  antojoNet: number;
  /** ¿El kill-switch está activo? (margen < 40%) */
  bonusesPaused: boolean;
  /** Número de pedidos en la muestra */
  sampleSize: number;
  /** Desglose por plan de restaurante */
  breakdown: { plan: string; orders: number; commission: number; margin: number }[];
  /** Timestamp de la simulación */
  at: string;
  /** Fuente de los datos: "simulation" (100 pedidos) | "live" (día real) */
  source: "simulation" | "live";
}

// ─── Cache en memoria a nivel módulo (5 min de TTL) ───
// Protege la DB de ráfagas de consultas concurrentes.
const AUDIT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
let _auditCache: { result: AuditResult; at: number } | null = null;

/**
 * Simula un lote de 100 pedidos variados (determinístico, sin Math.random)
 * cruzando comisión retenida vs. costo de bonos de domiciliario.
 * Considera si cada restaurante tiene la promo PYMES activa.
 *
 * Determinismo: usa una secuencia fija de distribuciones para que el
 * resultado sea reproducible (evita hydration mismatch y permite auditoría).
 */
export function auditProfitability(): AuditResult {
  // ─── Distribución fija de 100 pedidos (determinística) ───
  // Mezcla de planes y promos PYMES para simular el mundo real.
  // 40% free, 25% pro, 15% premium, 20% pyme_promo
  const orderProfiles: { plan: string; subtotal: number }[] = [];
  const subtotals = [12000, 18500, 22000, 26900, 28900, 31000, 35000, 42000, 55000, 65000];
  for (let i = 0; i < 100; i++) {
    const r = i / 100; // distribución determinística
    let plan: string;
    if (r < 0.20) plan = "pyme_promo";
    else if (r < 0.60) plan = "free";
    else if (r < 0.85) plan = "pro";
    else plan = "premium";
    orderProfiles.push({ plan, subtotal: subtotals[i % subtotals.length] });
  }

  // ─── Simular comisión + gateway + bonos por pedido ───
  let gmv = 0;
  let commissionRetained = 0;
  let gatewayCost = 0;
  let bonusesPaid = 0;
  const breakdownMap = new Map<string, { orders: number; commission: number }>();

  for (const ord of orderProfiles) {
    gmv += ord.subtotal;
    const rate = ord.plan === "pyme_promo" ? 0 : COMMISSION[ord.plan as keyof typeof COMMISSION] ?? COMMISSION.free;
    const commission = Math.round(ord.subtotal * rate);
    commissionRetained += commission;
    // gateway se cobra sobre el total (subtotal + service fee aprox)
    const total = ord.subtotal + Math.round(ord.subtotal * SERVICE_FEE_RATE);
    gatewayCost += calcGatewayFee(total);

    // Bono de domiciliario: simular que ~30% de pedidos alcanzan tier 5, 10% tier 10, 3% tier 15
    // Reparto determinístico basado en el índice
    const tierBonus = i_index_bonus(orderProfiles.indexOf(ord));
    bonusesPaid += tierBonus;

    const bk = breakdownMap.get(ord.plan) ?? { orders: 0, commission: 0 };
    bk.orders++; bk.commission += commission;
    breakdownMap.set(ord.plan, bk);
  }

  const antojoNet = commissionRetained - gatewayCost - bonusesPaid;
  const margin = commissionRetained > 0 ? antojoNet / commissionRetained : 0;

  const breakdown = Array.from(breakdownMap.entries()).map(([plan, v]) => ({
    plan,
    orders: v.orders,
    commission: v.commission,
    margin: v.commission > 0 ? (v.commission - gatewayCost / 100 * v.orders) / v.commission : 0,
  }));

  return {
    margin,
    commissionRetained,
    gatewayCost,
    bonusesPaid,
    gmv,
    antojoNet,
    bonusesPaused: margin < DRIVER_MIN_MARGIN,
    sampleSize: orderProfiles.length,
    breakdown,
    at: new Date().toISOString(),
    source: "simulation",
  };
}

// Helper determinístico para asignar bonos en la simulación
function i_index_bonus(i: number): number {
  const cycle = i % 100;
  if (cycle % 33 === 0) return 10000; // ~3% tier 15
  if (cycle % 10 === 0) return 5000; // ~10% tier 10
  if (cycle % 3 === 0) return 2000; // ~30% tier 5
  return 0;
}

/**
 * Computa el margen real de plataforma con datos del día.
 * @param ordersDelivered Órdenes entregadas hoy (con subtotal y restaurant)
 * @param bonusesPaidTotal Total de bonos pagados hoy a domiciliarios
 */
export function computePlatformMargin(
  ordersDelivered: { subtotal: number; restaurant: { adsPlan: string; pymePromoUntil: Date | null; lastPostAt: Date | null } }[],
  bonusesPaidTotal: number
): { margin: number; commission: number; gateway: number; antojoNet: number; gmv: number } {
  let gmv = 0;
  let commission = 0;
  let gateway = 0;
  for (const o of ordersDelivered) {
    gmv += o.subtotal;
    const rate = getCommissionRate(o.restaurant);
    commission += Math.round(o.subtotal * rate);
    const total = o.subtotal + Math.round(o.subtotal * SERVICE_FEE_RATE);
    gateway += calcGatewayFee(total);
  }
  const antojoNet = commission - gateway - bonusesPaidTotal;
  const margin = commission > 0 ? antojoNet / commission : 0;
  return { margin, commission, gateway, antojoNet, gmv };
}

/**
 * Kill-switch: ¿deben pausarse los bonos de domiciliarios?
 *
 * 🔒 FASE 2 — Ahora usa datos REALES del día vía computePlatformMargin().
 * Deja de depender de la simulación determinística.
 *
 * Regla de seguridad: si el volumen de pedidos entregados hoy es menor
 * a MIN_ORDERS_FOR_KILL_SWITCH, NO se pausan los bonos (no hay datos
 * suficientes para sacar una estadística justa). Asume estado seguro.
 *
 * Cache en memoria de 5 min para no golpear la DB en cada entrega.
 */
export const MIN_ORDERS_FOR_KILL_SWITCH = 5; // mínimo volumen para evaluar margen real

interface KillSwitchState {
  paused: boolean;
  reason: string;
  ordersToday: number;
  margin: number;
  at: number;
}
let _killSwitchCache: KillSwitchState | null = null;

export async function shouldPauseBonuses(): Promise<boolean> {
  // Cache hit (5 min TTL)
  if (_killSwitchCache && Date.now() - _killSwitchCache.at < AUDIT_CACHE_TTL_MS) {
    return _killSwitchCache.paused;
  }

  // ─── Fetch datos REALES del día ───
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
      where: { bonusEarnedToday: { gt: 0 } },
      select: { bonusEarnedToday: true },
    }),
  ]);

  const bonusesPaidToday = drivers.reduce((s, d) => s + d.bonusEarnedToday, 0);

  // ─── Regla de seguridad: volumen insuficiente → NO pausar ───
  if (deliveredOrders.length < MIN_ORDERS_FOR_KILL_SWITCH) {
    _killSwitchCache = {
      paused: false,
      reason: `Volumen insuficiente (${deliveredOrders.length}/${MIN_ORDERS_FOR_KILL_SWITCH} pedidos hoy). Bonos activos — no hay datos suficientes para evaluar.`,
      ordersToday: deliveredOrders.length,
      margin: 1, // asumir seguro
      at: Date.now(),
    };
    return false;
  }

  // ─── Calcular margen real con computePlatformMargin ───
  const live = computePlatformMargin(deliveredOrders, bonusesPaidToday);
  const paused = live.margin < DRIVER_MIN_MARGIN;

  _killSwitchCache = {
    paused,
    reason: paused
      ? `Margen real del día: ${(live.margin * 100).toFixed(1)}% < 40%. Bonos pausados automáticamente.`
      : `Margen real del día: ${(live.margin * 100).toFixed(1)}% ≥ 40%. Bonos activos.`,
    ordersToday: deliveredOrders.length,
    margin: live.margin,
    at: Date.now(),
  };

  return paused;
}

/** Obtiene el estado actual del kill-switch (para UI admin). Usa cache. */
export function getKillSwitchState(): KillSwitchState | null {
  return _killSwitchCache;
}

/** Limpia el cache del kill-switch manualmente */
export function clearKillSwitchCache() {
  _killSwitchCache = null;
}

/**
 * Obtiene el reporte de auditoría completo (con cache de 5 min).
 * Si `forceRefresh` es true, ignora el cache.
 */
export async function getAuditReport(forceRefresh = false): Promise<AuditResult> {
  if (!forceRefresh && _auditCache && Date.now() - _auditCache.at < AUDIT_CACHE_TTL_MS) {
    return _auditCache.result;
  }
  // En una implementación completa, aquí cruzaríamos datos live del día
  // con la simulación. Para el MVP usamos la simulación determinística.
  const result = auditProfitability();
  _auditCache = { result, at: Date.now() };
  return result;
}

/** Limpia el cache manualmente (para tests o admin override) */
export function clearAuditCache() {
  _auditCache = null;
}

// ════════════════════════════════════════════════════════════════════
//  LEDGER DE EFECTIVO — DOMICILIARIOS
//  Cuando un pedido se paga en efectivo, el domiciliario recibe el
//  dinero físico del cliente. La plataforma le acredita su ganancia
//  digital, pero el domiciliario "debe" el resto a la plataforma.
//  cashOwed = total - tip - (ganancia base + bono)
//  Si cashOwed > CASH_OWED_LIMIT, no puede recibir más pedidos en efectivo.
// ════════════════════════════════════════════════════════════════════

/**
 * Calcula cuánto efectivo debe el domiciliario a la plataforma por una
 * entrega en efectivo.
 *
 * El cliente paga `total` en efectivo al domiciliario. De eso:
 *  - La propina (tip) es del domiciliario (no se toca)
 *  - La ganancia base + bono ya se le acreditó digitalmente
 *  - El RESTO le pertenece a la plataforma (subtotal + fees - ganancia driver)
 *
 * @returns monto que el domiciliario debe consignar a la plataforma
 */
export function calcCashOwedForOrder(total: number, tip: number, driverEarning: number): number {
  // El domiciliario recibió `total` en efectivo.
  // Se queda con: tip (propina) + driverEarning (ganancia ya acreditada)
  // Debe a la plataforma: total - tip - driverEarning
  const owed = total - tip - driverEarning;
  return Math.max(0, owed);
}

/**
 * ¿Puede el domiciliario recibir un nuevo pedido en efectivo?
 * Bloquea si su saldo deudor supera el tope de riesgo.
 */
export function canAcceptCashOrder(cashOwed: number): { can: boolean; reason?: string } {
  if (cashOwed >= CASH_OWED_LIMIT) {
    return {
      can: false,
      reason: `Tienes ${copFormat(cashOwed)} por consignar. Consigna para seguir recibiendo pedidos en efectivo.`,
    };
  }
  return { can: true };
}

// helper de formato COP (sin importar todo format.ts que es client-safe)
function copFormat(v: number): string {
  return "$ " + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(v));
}

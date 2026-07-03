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
  free: 0.15, // 15%
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

/** Calcula todos los totales de una orden (fuente única de verdad) */
export function calculateOrderTotals(params: {
  subtotal: number;
  restaurant: { adsPlan: string; pymePromoUntil: Date | null; lastPostAt: Date | null };
  isPrime: boolean;
  tip: number;
  discount?: number;
  baseDeliveryFee?: number;
}): OrderTotals {
  const { subtotal, restaurant, isPrime, tip, discount = 0, baseDeliveryFee = 4500 } = params;
  const deliveryFee = isPrime ? 0 : baseDeliveryFee;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tip - discount);

  const commissionRate = getCommissionRate(restaurant);
  const commission = Math.round(subtotal * commissionRate);
  const gatewayFee = calcGatewayFee(total);
  const antojoNet = commission - gatewayFee; // sin contar el delivery fee que va al driver
  const restaurantPayout = subtotal - commission;
  const margin = total > 0 ? antojoNet / total : 0;

  return {
    subtotal, deliveryFee, serviceFee, discount, tip, total,
    commission, gatewayFee, antojoNet, restaurantPayout, margin,
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
  const projectedMargin = (dayCommissionAccumulated - (lastBonusTier > 0 ? 0 : 0) - bonus) / Math.max(1, dayCommissionAccumulated);
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

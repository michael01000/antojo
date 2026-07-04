/**
 * Antojo — Catálogo central de Recompensas (Coins)
 * -----------------------------------------------
 * Fuente única de verdad para los canjeables con Antojo Coins.
 * Todas las APIs y UIs deben usar este catálogo.
 */

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;          // coins necesarios para canjear
  type: "fixed" | "free_delivery" | "prime";
  value: number;         // monto del descuento (para fixed) o 0 para free_delivery/prime
  icon: string;
}

export const REWARDS_CATALOG: Reward[] = [
  {
    id: "discount_5k",
    title: "$5.000 de descuento",
    description: "Descuento fijo de $5.000 en tu próximo pedido",
    cost: 250,
    type: "fixed",
    value: 5000,
    icon: "💸",
  },
  {
    id: "free_delivery",
    title: "Envío gratis x3",
    description: "3 pedidos sin costo de envío",
    cost: 400,
    type: "free_delivery",
    value: 0,
    icon: "🏍️",
  },
  {
    id: "discount_10k",
    title: "$10.000 de descuento",
    description: "Descuento fijo de $10.000 en tu próximo pedido",
    cost: 600,
    type: "fixed",
    value: 10000,
    icon: "💰",
  },
  {
    id: "discount_20k",
    title: "$20.000 de descuento",
    description: "Descuento fijo de $20.000 en tu próximo pedido",
    cost: 1200,
    type: "fixed",
    value: 20000,
    icon: "🎁",
  },
  {
    id: "prime_month",
    title: "Antojo Prime 1 mes",
    description: "Activa Prime por 1 mes (envío gratis en pedidos +$25.000)",
    cost: 2000,
    type: "prime",
    value: 0,
    icon: "👑",
  },
];

/** Busca una recompensa por id */
export function getRewardById(id: string): Reward | undefined {
  return REWARDS_CATALOG.find((r) => r.id === id);
}

/** Genera un código único de cupón COIN-XXXX */
export function generateCoinCode(): string {
  return "COIN-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

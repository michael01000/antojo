// Shared TypeScript types for the Antojo platform

export type Role = "cliente" | "domiciliario" | "restaurante" | "admin";

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "picked_up"
  | "en_route"
  | "delivered"
  | "cancelled";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  cuisine: string;
  city: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  deliveryMin: number;
  priceLevel: number;
  imageUrl: string;
  coverColor: string;
  isOpen: boolean;
  promo: string | null;
  tags: string;
  accentColor: string;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  emoji: string | null;
  isPopular: boolean;
  isAvailable: boolean;
  calories: number | null;
  prepMin: number | null;
  tags: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  emoji: string | null;
  price: number;
  qty: number;
  notes?: string;
  restaurantId: string;
  restaurantName: string;
}

export interface OrderItem {
  id: string;
  name: string;
  emoji: string | null;
  price: number;
  qty: number;
  notes: string | null;
}

export interface OrderEvent {
  id: string;
  status: string;
  label: string;
  at: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  sender: string;
  text: string;
  at: string;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  restaurantId: string;
  driverId: string | null;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: string;
  address: string;
  notes: string | null;
  isGroup: boolean;
  etaMin: number;
  rating: number | null;
  driverLat: number;
  driverLng: number;
  createdAt: string;
  updatedAt: string;
  events: OrderEvent[];
  restaurant?: Restaurant;
  driver?: Driver | null;
}

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string;
  rating: number;
  city: string;
  isOnline: boolean;
  avatarColor: string;
  earningsToday: number;
  completedToday: number;
  currentOrderId: string | null;
}

export interface LoyaltyAccount {
  id: string;
  coins: number;
  tier: string;
  streakDays: number;
  challenges: LoyaltyChallenge[];
}

export interface LoyaltyChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  goal: number;
  reward: number;
  icon: string;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  type: "percent" | "fixed" | "free_delivery";
  value: number;
  minOrder: number;
  active: boolean;
  uses: number;
}

export interface Subscription {
  id: string;
  plan: "none" | "prime" | "prime_plus";
  status: string;
  renewsAt: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  avatarColor: string;
}

export const ORDER_STATUS_FLOW: { status: OrderStatus; label: string; short: string; icon: string }[] = [
  { status: "placed", label: "Pedido confirmado", short: "Confirmado", icon: "receipt" },
  { status: "accepted", label: "Restaurante aceptó", short: "Aceptado", icon: "store" },
  { status: "preparing", label: "Preparando tu pedido", short: "Preparando", icon: "chef-hat" },
  { status: "ready", label: "Listo para recoger", short: "Listo", icon: "bag" },
  { status: "picked_up", label: "Domiciliario en camino", short: "Recogido", icon: "bike" },
  { status: "en_route", label: "En camino a tu dirección", short: "En ruta", icon: "navigation" },
  { status: "delivered", label: "Entregado", short: "Entregado", icon: "check" },
];

export const STATUS_INDEX: Record<OrderStatus, number> = {
  placed: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  en_route: 5,
  delivered: 6,
  cancelled: -1,
};

export const TIER_INFO: Record<string, { label: string; color: string; min: number; perk: string }> = {
  Bronce: { label: "Bronce", color: "cafe", min: 0, perk: "1 coin x cada $1.000" },
  Plata: { label: "Plata", color: "muted", min: 500, perk: "1.5x coins + envío gratis en horas valle" },
  Oro: { label: "Oro", color: "mango", min: 2000, perk: "2x coins + soporte prioritario" },
  Platino: { label: "Platino", color: "mora", min: 5000, perk: "3x coins + acceso a menús exclusivos" },
};

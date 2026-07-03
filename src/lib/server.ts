import "server-only";
import { db } from "./db";
import { getAuthUser } from "./auth";
import type { Order, OrderStatus } from "./types";

// Returns the customer profile of the authenticated user, falling back to the
// first seeded customer (so the platform still works during the initial
// authenticated demo session).
export async function getCurrentCustomer() {
  const authUser = await getAuthUser();
  if (authUser) {
    const c = await db.customer.findUnique({ where: { userId: authUser.id } });
    if (c) return c;
  }
  const c = await db.customer.findFirst({ orderBy: { createdAt: "asc" } });
  if (!c) throw new Error("No customer seeded");
  return c;
}

export async function getCurrentDriver() {
  const authUser = await getAuthUser();
  if (authUser) {
    const d = await db.driver.findUnique({ where: { userId: authUser.id } });
    if (d) return d;
  }
  const online = await db.driver.findFirst({ where: { isOnline: true }, orderBy: { createdAt: "asc" } });
  return online ?? (await db.driver.findFirst({ orderBy: { createdAt: "asc" } }));
}

// Returns the restaurant id owned by the authenticated restaurante user, or
// the restaurant with the most recent pending order (demo fallback).
export async function getCurrentRestaurantId() {
  const authUser = await getAuthUser();
  if (authUser) {
    const r = await db.restaurant.findUnique({ where: { userId: authUser.id } });
    if (r) return r.id;
  }
  return getDemoRestaurantId();
}

export async function getDemoRestaurantId() {
  const pending = await db.order.findFirst({
    where: { status: { in: ["placed", "accepted", "preparing", "ready"] } },
    orderBy: { createdAt: "desc" },
    select: { restaurantId: true },
  });
  if (pending) return pending.restaurantId;
  const r = await db.restaurant.findFirst({ orderBy: { createdAt: "asc" } });
  return r!.id;
}

export async function serializeOrder(o: any): Promise<Order> {
  return {
    id: o.id,
    code: o.code,
    customerId: o.customerId,
    restaurantId: o.restaurantId,
    driverId: o.driverId ?? null,
    status: o.status as OrderStatus,
    items: (o.items ?? []).map((it: any) => ({
      id: it.id,
      name: it.name,
      emoji: it.emoji ?? null,
      price: it.price,
      qty: it.qty,
      notes: it.notes ?? null,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    serviceFee: o.serviceFee,
    discount: o.discount,
    tip: o.tip,
    total: o.total,
    paymentMethod: o.paymentMethod,
    address: o.address,
    notes: o.notes ?? null,
    isGroup: o.isGroup,
    etaMin: o.etaMin,
    rating: o.rating ?? null,
    driverLat: o.driverLat,
    driverLng: o.driverLng,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    events: (o.events ?? []).map((e: any) => ({
      id: e.id, status: e.status, label: e.label, at: e.at.toISOString(),
    })).sort((a: any, b: any) => +new Date(a.at) - +new Date(b.at)),
    restaurant: o.restaurant ? {
      id: o.restaurant.id, name: o.restaurant.name, slug: o.restaurant.slug,
      description: o.restaurant.description, cuisine: o.restaurant.cuisine,
      city: o.restaurant.city, neighborhood: o.restaurant.neighborhood,
      rating: o.restaurant.rating, reviewCount: o.restaurant.reviewCount,
      deliveryFee: o.restaurant.deliveryFee, deliveryMin: o.restaurant.deliveryMin,
      priceLevel: o.restaurant.priceLevel, imageUrl: o.restaurant.imageUrl,
      coverColor: o.restaurant.coverColor, isOpen: o.restaurant.isOpen,
      promo: o.restaurant.promo, tags: o.restaurant.tags, accentColor: o.restaurant.accentColor,
    } : undefined,
    driver: o.driver ? {
      id: o.driver.id, name: o.driver.name, phone: o.driver.phone, vehicle: o.driver.vehicle,
      rating: o.driver.rating, city: o.driver.city, isOnline: o.driver.isOnline,
      avatarColor: o.driver.avatarColor, earningsToday: o.driver.earningsToday,
      completedToday: o.driver.completedToday, currentOrderId: o.driver.currentOrderId,
    } : null,
  };
}

export const ORDER_INCLUDE = {
  items: true,
  events: true,
  restaurant: true,
  driver: true,
};

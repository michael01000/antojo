import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder, ORDER_INCLUDE } from "@/lib/server";

export async function GET() {
  const [customers, restaurants, drivers, orders, delivered, promos] = await Promise.all([
    db.customer.count(),
    db.restaurant.count(),
    db.driver.count(),
    db.order.count(),
    db.order.findMany({ where: { status: "delivered" }, select: { total: true, createdAt: true, restaurantId: true } }),
    db.promotion.findMany(),
  ]);

  const gmv = delivered.reduce((s, o) => s + o.total, 0);
  const activeOrders = await db.order.count({ where: { status: { notIn: ["delivered", "cancelled"] } } });
  const onlineDrivers = await db.driver.count({ where: { isOnline: true } });

  // last 7 days revenue
  const days: { label: string; value: number; orders: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - i);
    const end = new Date(start); end.setDate(end.getDate() + 1);
    const dayOrders = delivered.filter((o) => o.createdAt >= start && o.createdAt < end);
    days.push({
      label: start.toLocaleDateString("es-CO", { weekday: "short" }),
      value: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    });
  }

  // top restaurants by GMV
  const byRest = new Map<string, number>();
  for (const o of delivered) byRest.set(o.restaurantId, (byRest.get(o.restaurantId) ?? 0) + o.total);
  const topRestIds = Array.from(byRest.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => e[0]);
  const topRestaurantsFull = await db.restaurant.findMany({ where: { id: { in: topRestIds } } });
  const topRestaurants = topRestIds.map((id) => {
    const r = topRestaurantsFull.find((x) => x.id === id)!;
    return { id: r.id, name: r.name, gmv: byRest.get(id)!, cuisine: r.cuisine, rating: r.rating, imageUrl: r.imageUrl };
  });

  // cuisine distribution
  const allRestaurants = await db.restaurant.findMany({ select: { cuisine: true } });
  const cuisineMap = new Map<string, number>();
  for (const r of allRestaurants) cuisineMap.set(r.cuisine, (cuisineMap.get(r.cuisine) ?? 0) + 1);

  const recentOrders = await db.order.findMany({
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return NextResponse.json({
    kpis: {
      customers, restaurants, drivers, onlineDrivers,
      totalOrders: orders, activeOrders, gmv,
      avgTicket: delivered.length ? Math.round(gmv / delivered.length) : 0,
      promosActive: promos.filter((p) => p.active).length,
    },
    revenue7d: days,
    topRestaurants,
    cuisineMix: Array.from(cuisineMap.entries()).map(([name, value]) => ({ name, value })),
    recentOrders: await Promise.all(recentOrders.map(serializeOrder)),
  });
}

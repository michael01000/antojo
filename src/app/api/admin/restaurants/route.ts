import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const restaurants = await db.restaurant.findMany({
    include: { _count: { select: { orders: true, menuItems: true } } },
    orderBy: { rating: "desc" },
  });
  const data = restaurants.map((r) => ({
    id: r.id, name: r.name, cuisine: r.cuisine, neighborhood: r.neighborhood,
    rating: r.rating, reviewCount: r.reviewCount, isOpen: r.isOpen,
    imageUrl: r.imageUrl, accentColor: r.accentColor, promo: r.promo,
    orders: r._count.orders, items: r._count.menuItems,
  }));
  return NextResponse.json({ restaurants: data });
}

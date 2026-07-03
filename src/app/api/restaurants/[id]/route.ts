import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.restaurant.findUnique({
    where: { id },
    include: { menuItems: { orderBy: [{ isPopular: "desc" }, { category: "asc" }, { name: "asc" }] } },
  });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const grouped: Record<string, any[]> = {};
  for (const m of r.menuItems) {
    (grouped[m.category] ??= []).push({
      id: m.id, restaurantId: m.restaurantId, name: m.name, description: m.description,
      price: m.price, category: m.category, imageUrl: m.imageUrl, emoji: m.emoji,
      isPopular: m.isPopular, isAvailable: m.isAvailable, calories: m.calories,
      prepMin: m.prepMin, tags: m.tags,
    });
  }
  return NextResponse.json({
    restaurant: {
      id: r.id, name: r.name, slug: r.slug, description: r.description, cuisine: r.cuisine,
      city: r.city, neighborhood: r.neighborhood, rating: r.rating, reviewCount: r.reviewCount,
      deliveryFee: r.deliveryFee, deliveryMin: r.deliveryMin, priceLevel: r.priceLevel,
      imageUrl: r.imageUrl, coverColor: r.coverColor, isOpen: r.isOpen, promo: r.promo,
      tags: r.tags, accentColor: r.accentColor,
    },
    menu: grouped,
  });
}

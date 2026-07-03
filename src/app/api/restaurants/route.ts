import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.toLowerCase().trim();
  const cuisine = req.nextUrl.searchParams.get("cuisine");
  const tag = req.nextUrl.searchParams.get("tag");
  const sort = req.nextUrl.searchParams.get("sort") ?? "recommended";

  let restaurants = await db.restaurant.findMany({
    where: { isOpen: true, isApproved: true },
    include: { menuItems: { where: { isAvailable: true }, select: { id: true, name: true, category: true, tags: true, isPopular: true, price: true, emoji: true, description: true, calories: true, prepMin: true } } },
  });

  if (q) {
    restaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q) ||
        r.tags.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.menuItems.some((m) => m.name.toLowerCase().includes(q))
    );
  }
  if (cuisine && cuisine !== "Todas") {
    if (cuisine === "Promociones") {
      restaurants = restaurants.filter((r) => r.promo);
    } else {
      restaurants = restaurants.filter((r) => r.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
    }
  }
  if (tag) {
    restaurants = restaurants.filter((r) => r.tags.toLowerCase().includes(tag.toLowerCase()));
  }

  if (sort === "rating") restaurants.sort((a, b) => b.rating - a.rating);
  else if (sort === "fast") restaurants.sort((a, b) => a.deliveryMin - b.deliveryMin);
  else if (sort === "price") restaurants.sort((a, b) => a.priceLevel - b.priceLevel);
  else restaurants.sort((a, b) => b.rating - a.rating);

  const data = restaurants.map((r) => ({
    id: r.id, name: r.name, slug: r.slug, description: r.description, cuisine: r.cuisine,
    city: r.city, neighborhood: r.neighborhood, rating: r.rating, reviewCount: r.reviewCount,
    deliveryFee: r.deliveryFee, deliveryMin: r.deliveryMin, priceLevel: r.priceLevel,
    imageUrl: r.imageUrl, coverColor: r.coverColor, isOpen: r.isOpen, promo: r.promo,
    tags: r.tags, accentColor: r.accentColor, itemCount: r.menuItems.length,
  }));

  return NextResponse.json({ restaurants: data });
}

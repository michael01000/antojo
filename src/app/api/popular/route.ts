import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.menuItem.findMany({
    where: { isPopular: true, isAvailable: true },
    include: { restaurant: { select: { id: true, name: true, slug: true, accentColor: true, deliveryMin: true } } },
    take: 8,
    orderBy: { price: "asc" },
  });
  return NextResponse.json({
    items: items.map((m) => ({
      id: m.id, name: m.name, description: m.description, price: m.price,
      emoji: m.emoji, category: m.category, calories: m.calories, tags: m.tags,
      restaurant: m.restaurant,
    })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/restaurant/menu
 * Crea un nuevo plato en el menú del restaurante autenticado.
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") {
    return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  }
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const { name, description, price, category, emoji, calories, prepMin, isPopular } = await req.json();
  if (!name || !description || price == null || !category) {
    return NextResponse.json({ error: "Faltan campos: name, description, price, category" }, { status: 400 });
  }

  const menuItem = await db.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name,
      description,
      price: Math.round(price),
      category,
      emoji: emoji ?? "🍽️",
      calories: calories ?? null,
      prepMin: prepMin ?? null,
      isPopular: isPopular ?? false,
      isAvailable: true,
      tags: "",
    },
  });

  return NextResponse.json({ menuItem });
}

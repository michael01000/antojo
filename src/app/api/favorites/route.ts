import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ favorites: [] });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ favorites: [] });
  const favs = await db.favorite.findMany({
    where: { customerId: customer.id },
    include: { restaurant: true },
  });
  return NextResponse.json({
    favorites: favs.map((f) => ({
      id: f.id, restaurantId: f.restaurantId,
      restaurant: {
        id: f.restaurant.id, name: f.restaurant.name, slug: f.restaurant.slug,
        cuisine: f.restaurant.cuisine, neighborhood: f.restaurant.neighborhood,
        rating: f.restaurant.rating, reviewCount: f.restaurant.reviewCount,
        deliveryFee: f.restaurant.deliveryFee, deliveryMin: f.restaurant.deliveryMin,
        priceLevel: f.restaurant.priceLevel, imageUrl: f.restaurant.imageUrl,
        coverColor: f.restaurant.coverColor, isOpen: f.restaurant.isOpen, promo: f.restaurant.promo,
        tags: f.restaurant.tags, accentColor: f.restaurant.accentColor,
      },
    })),
    ids: favs.map((f) => f.restaurantId),
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { restaurantId } = await req.json();
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  const existing = await db.favorite.findUnique({ where: { customerId_restaurantId: { customerId: customer.id, restaurantId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }
  await db.favorite.create({ data: { customerId: customer.id, restaurantId } });
  return NextResponse.json({ favorited: true });
}

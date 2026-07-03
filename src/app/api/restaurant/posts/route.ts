import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Posts del restaurante (lista para el dashboard)
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ posts: [] });
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ posts: [] });
  const posts = await db.post.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ posts: posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString(), sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null })) });
}

// Crear un post (actualiza lastPostAt para la promo PYMES)
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const { imageUrl, caption, menuItemId } = await req.json();
  if (!imageUrl || !caption) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const post = await db.post.create({
    data: { restaurantId: restaurant.id, imageUrl, caption, menuItemId: menuItemId ?? null },
  });
  // Actualizar lastPostAt (mantiene la promo PYMES activa)
  await db.restaurant.update({ where: { id: restaurant.id }, data: { lastPostAt: new Date() } });
  return NextResponse.json({ post });
}

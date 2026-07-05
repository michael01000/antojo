import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/chef-drops — lista drops activos (no expirados, con stock)
 * POST /api/chef-drops — restaurante crea un drop
 * PATCH /api/chef-drops — marcar como comprado (decrementar stock)
 */

export async function GET() {
  const now = new Date();
  const drops = await db.chefDrop.findMany({
    where: { isActive: true, expiresAt: { gt: now }, stock: { gt: 0 } },
    include: { restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true, neighborhood: true, deliveryMin: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({
    drops: drops.map(d => ({
      ...d,
      expiresAt: d.expiresAt.toISOString(),
      createdAt: d.createdAt.toISOString(),
      remaining: d.stock - d.sold,
    })),
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const { menuItemId, name, description, emoji, price, stock, expiresHours } = await req.json();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (expiresHours || 24));

  const drop = await db.chefDrop.create({
    data: { restaurantId: restaurant.id, menuItemId, name, description, emoji: emoji || "🍽️", price, stock, expiresAt },
  });
  return NextResponse.json({ drop });
}

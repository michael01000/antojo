import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { canSponsor } from "@/lib/economics";

// Patrocinar un post existente
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const { postId } = await req.json();
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const check = canSponsor(restaurant);
  if (!check.can) return NextResponse.json({ error: check.reason }, { status: 400 });

  const sponsoredUntil = new Date();
  sponsoredUntil.setDate(sponsoredUntil.getDate() + 7);

  await db.post.update({ where: { id: postId }, data: { isSponsored: true, sponsoredUntil } });
  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { sponsoredPostsUsed: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, sponsoredUntil: sponsoredUntil.toISOString(), remaining: check.remaining - 1 });
}

// Obtener info del plan de ads
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ plan: "free", canSponsor: false });
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ plan: "free", canSponsor: false });
  const check = canSponsor(restaurant);
  return NextResponse.json({
    plan: restaurant.adsPlan,
    sponsoredUsed: restaurant.sponsoredPostsUsed,
    canSponsor: check.can,
    remaining: check.remaining,
    reason: check.reason,
  });
}

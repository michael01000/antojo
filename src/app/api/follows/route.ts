import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ follows: [], ids: [] });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ follows: [], ids: [] });
  const follows = await db.follow.findMany({
    where: { customerId: customer.id },
    include: { restaurant: { select: { id: true, name: true, imageUrl: true, cuisine: true } } },
  });
  return NextResponse.json({ follows, ids: follows.map((f) => f.restaurantId) });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { restaurantId } = await req.json();
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const existing = await db.follow.findUnique({ where: { customerId_restaurantId: { customerId: customer.id, restaurantId } } });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }
  await db.follow.create({ data: { customerId: customer.id, restaurantId } });
  return NextResponse.json({ following: true });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const existing = await db.postLike.findUnique({ where: { postId_customerId: { postId: id, customerId: customer.id } } });
  if (existing) {
    await db.postLike.delete({ where: { id: existing.id } });
    await db.post.update({ where: { id }, data: { likes: { decrement: 1 } } });
    return NextResponse.json({ liked: false });
  }
  await db.postLike.create({ data: { postId: id, customerId: customer.id } });
  await db.post.update({ where: { id }, data: { likes: { increment: 1 } } });
  return NextResponse.json({ liked: true });
}

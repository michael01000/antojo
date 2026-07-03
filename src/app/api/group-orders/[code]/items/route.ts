import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Añadir item al carrito grupal
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { addedByName, menuItemId, name, emoji, price, qty, notes } = await req.json();

  const go = await db.groupOrder.findUnique({ where: { code: code.toUpperCase() } });
  if (!go) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (go.status !== "open") return NextResponse.json({ error: "Pedido cerrado" }, { status: 400 });

  const item = await db.groupOrderItem.create({
    data: { groupOrderId: go.id, addedByName, menuItemId: menuItemId ?? null, name, emoji: emoji ?? null, price, qty: qty ?? 1, notes: notes ?? null },
  });

  // Añadir participante si no está
  const participants: string[] = JSON.parse(go.participantsJson);
  if (!participants.includes(addedByName)) {
    participants.push(addedByName);
    await db.groupOrder.update({ where: { id: go.id }, data: { participantsJson: JSON.stringify(participants) } });
  }

  return NextResponse.json({ item });
}

// Eliminar item
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const itemId = req.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId requerido" }, { status: 400 });
  await db.groupOrderItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}

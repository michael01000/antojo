import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * PATCH /api/restaurant/menu/[id]
 * Edita cualquier campo de un menuItem (no solo isAvailable).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") {
    return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  }
  const body = await req.json();

  // Construir data solo con los campos que vienen en el body
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = Math.round(body.price);
  if (body.category !== undefined) data.category = body.category;
  if (body.emoji !== undefined) data.emoji = body.emoji;
  if (body.isAvailable !== undefined) data.isAvailable = body.isAvailable;
  if (body.isPopular !== undefined) data.isPopular = body.isPopular;
  if (body.calories !== undefined) data.calories = body.calories;
  if (body.prepMin !== undefined) data.prepMin = body.prepMin;

  const m = await db.menuItem.update({ where: { id }, data });
  return NextResponse.json({ menuItem: m });
}

/**
 * DELETE /api/restaurant/menu/[id]
 * Elimina un plato del menú permanentemente.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") {
    return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  }
  await db.menuItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

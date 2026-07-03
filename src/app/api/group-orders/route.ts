import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Crear un pedido grupal (host)
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { restaurantId } = await req.json();
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const code = "ANT-GRP-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2);

  const groupOrder = await db.groupOrder.create({
    data: {
      code, hostId: customer.id, restaurantId, hostName: customer.name,
      expiresAt, participantsJson: JSON.stringify([customer.name]),
    },
    include: { items: true, restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true, neighborhood: true, deliveryMin: true, deliveryFee: true } } },
  });

  return NextResponse.json({
    groupOrder: {
      ...groupOrder,
      expiresAt: groupOrder.expiresAt.toISOString(),
      createdAt: groupOrder.createdAt.toISOString(),
      participants: JSON.parse(groupOrder.participantsJson),
    },
  });
}

// Obtener un pedido grupal por código (para unirse)
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  const go = await db.groupOrder.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true, neighborhood: true, deliveryMin: true, deliveryFee: true } },
    },
  });
  if (!go) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (new Date(go.expiresAt) < new Date() && go.status === "open") {
    await db.groupOrder.update({ where: { id: go.id }, data: { status: "expired" } });
  }
  return NextResponse.json({
    groupOrder: {
      ...go,
      expiresAt: go.expiresAt.toISOString(),
      createdAt: go.createdAt.toISOString(),
      participants: JSON.parse(go.participantsJson),
    },
  });
}

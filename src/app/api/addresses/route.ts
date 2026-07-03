import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ addresses: [] });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ addresses: [] });
  const addresses = await db.address.findMany({ where: { customerId: customer.id }, orderBy: { label: "asc" } });
  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { label, street, details } = await req.json();
  if (!label || !street) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  const address = await db.address.create({ data: { customerId: customer.id, label, street, details: details ?? null } });
  return NextResponse.json({ address });
}

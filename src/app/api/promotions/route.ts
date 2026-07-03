import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const promos = await db.promotion.findMany({ where: { active: true }, orderBy: { uses: "desc" } });
  return NextResponse.json({ promotions: promos });
}

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  const promo = await db.promotion.findUnique({ where: { code: (code || "").toUpperCase().trim() } });
  if (!promo || !promo.active) return NextResponse.json({ valid: false, error: "Código inválido" }, { status: 404 });
  if (subtotal < promo.minOrder) return NextResponse.json({ valid: false, error: `Pedido mínimo ${promo.minOrder}` }, { status: 400 });
  let discount = 0;
  let freeDelivery = false;
  if (promo.type === "percent") discount = Math.round((subtotal * promo.value) / 100);
  else if (promo.type === "fixed") discount = promo.value;
  else if (promo.type === "free_delivery") freeDelivery = true;
  await db.promotion.update({ where: { id: promo.id }, data: { uses: { increment: 1 } } });
  return NextResponse.json({ valid: true, promotion: promo, discount, freeDelivery });
}

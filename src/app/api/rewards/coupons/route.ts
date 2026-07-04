import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/rewards/coupons
 * Lista los cupones COIN-* del cliente (canjeados con coins).
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") {
    return NextResponse.json({ coupons: [] });
  }
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ coupons: [] });

  const coupons = await db.promotion.findMany({
    where: { ownerCustomerId: customer.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      type: c.type,
      value: c.value,
      used: c.used,
      active: c.active,
    })),
  });
}

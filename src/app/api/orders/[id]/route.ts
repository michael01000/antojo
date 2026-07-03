import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder, ORDER_INCLUDE } from "@/lib/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order: await serializeOrder(o) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rating, comment } = await req.json();
  const o = await db.order.update({ where: { id }, data: { rating }, include: ORDER_INCLUDE });
  if (comment && o.restaurantId) {
    await db.review.create({
      data: {
        orderId: o.id, customerId: o.customerId, restaurantId: o.restaurantId,
        rating, comment, foodRating: rating, deliveryRating: rating,
      },
    });
  }
  return NextResponse.json({ order: await serializeOrder(o) });
}

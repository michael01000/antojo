import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentRestaurantId, getDemoRestaurantId } from "@/lib/server";
import { getAuthUser } from "@/lib/auth";
import { serializeOrder, ORDER_INCLUDE } from "@/lib/server";

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser();
  let rid = req.nextUrl.searchParams.get("restaurantId");
  if (!rid) {
    if (authUser?.role === "restaurante") {
      const r = await db.restaurant.findUnique({ where: { userId: authUser.id } });
      if (r) rid = r.id;
    }
    if (!rid) rid = await getDemoRestaurantId();
  }
  if (!rid) return NextResponse.json({ restaurant: null, orders: [] });
  const restaurant = await db.restaurant.findUnique({ where: { id: rid } });
  const orders = await db.order.findMany({
    where: { restaurantId: rid },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ restaurant, orders: await Promise.all(orders.map(serializeOrder)) });
}

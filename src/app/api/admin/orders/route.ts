import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder, ORDER_INCLUDE } from "@/lib/server";

export async function GET() {
  const orders = await db.order.findMany({ include: ORDER_INCLUDE, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ orders: await Promise.all(orders.map(serializeOrder)) });
}

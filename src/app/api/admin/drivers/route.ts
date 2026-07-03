import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const drivers = await db.driver.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { earningsToday: "desc" },
  });
  const data = drivers.map((d) => ({
    id: d.id, name: d.name, vehicle: d.vehicle, rating: d.rating,
    isOnline: d.isOnline, avatarColor: d.avatarColor,
    earningsToday: d.earningsToday, completedToday: d.completedToday,
    currentOrderId: d.currentOrderId, totalDeliveries: d._count.orders,
  }));
  return NextResponse.json({ drivers: data });
}

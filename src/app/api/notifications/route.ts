import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ notifications: [] });
  const notifs = await db.notification.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({
    notifications: notifs.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    unread: notifs.filter((n) => !n.read).length,
  });
}

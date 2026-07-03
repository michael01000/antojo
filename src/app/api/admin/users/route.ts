import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "admin") return NextResponse.json({ users: [] });
  const users = await db.user.findMany({
    include: { customer: true, driver: true, restaurant: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users: users.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, provider: u.provider,
    verified: u.verified, city: u.city, createdAt: u.createdAt.toISOString(),
    hasProfile: !!(u.customer || u.driver || u.restaurant),
  })) });
}

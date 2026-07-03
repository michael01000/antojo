import { NextResponse } from "next/server";
import { getAuthUser, serializeUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ user: null }, { status: 200 });
  const user = await db.user.findUnique({
    where: { id: authUser.id },
    include: { customer: true, driver: true, restaurant: true },
  });
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: serializeUser(user) });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, serializeUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { name, phone, city, avatarColor } = await req.json();
  const user = await db.user.update({
    where: { id: authUser.id },
    data: { name: name ?? undefined, phone: phone ?? undefined, city: city ?? undefined, avatarColor: avatarColor ?? undefined },
    include: { customer: true, driver: true, restaurant: true },
  });
  // sync profile name
  if (user.customer) await db.customer.update({ where: { id: user.customer.id }, data: { name: user.name, phone: user.phone, city: user.city, avatarColor: user.avatarColor } });
  if (user.driver) await db.driver.update({ where: { id: user.driver.id }, data: { name: user.name, phone: user.phone } });
  return NextResponse.json({ user: serializeUser(user) });
}

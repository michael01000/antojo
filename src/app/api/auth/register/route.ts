import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken, setAuthCookie, serializeUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { name, email, password, role, phone, provider } = await req.json();
  if (!email || !name || !role) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  if (!["cliente", "domiciliario", "restaurante", "admin"].includes(role)) return NextResponse.json({ error: "Rol inválido" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "Ya existe una cuenta con este correo" }, { status: 409 });

  const user = await db.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name,
      password: password ? hashPassword(password) : null,
      role,
      phone: phone || null,
      provider: provider || "email",
      avatarColor: role === "cliente" ? "antojo" : role === "domiciliario" ? "lima" : role === "restaurante" ? "mora" : "cafe",
      verified: provider === "google" || provider === "apple" ? true : false,
    },
    include: { customer: true, driver: true, restaurant: true },
  });

  // Create role-specific profile
  if (role === "cliente") {
    const c = await db.customer.create({ data: { userId: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city, avatarColor: user.avatarColor } });
    await db.loyaltyAccount.create({ data: { customerId: c.id, coins: 50, tier: "Bronce", streakDays: 0, challengesJson: "[]" } });
    await db.subscription.create({ data: { customerId: c.id, plan: "none", status: "inactive" } });
  } else if (role === "domiciliario") {
    await db.driver.create({ data: { userId: user.id, name: user.name, phone: user.phone, isVerified: false, isOnline: false } });
  } else if (role === "restaurante") {
    // restaurant profile created via /api/restaurants/register
  }

  const token = createToken(user.id, user.role);
  const res = NextResponse.json({ user: serializeUser(user) });
  res.headers.set("Set-Cookie", setAuthCookie(token));
  return res;
}

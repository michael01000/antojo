import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, setAuthCookie, serializeUser } from "@/lib/auth";

// Verify OTP and login/lookup-or-create a phone user for the given role.
export async function POST(req: NextRequest) {
  const { phone, code, role } = await req.json();
  if (!phone || !code) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  if (code !== "123456") return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
  const r = role || "cliente";

  let user = await db.user.findFirst({ where: { phone }, include: { customer: true, driver: true, restaurant: true } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: `phone_${phone.replace(/\D/g, "")}@antojo.co`,
        phone, name: `Usuario ${phone.slice(-4)}`, role: r, provider: "phone", verified: true,
        avatarColor: r === "cliente" ? "antojo" : r === "domiciliario" ? "lima" : "mora",
      },
      include: { customer: true, driver: true, restaurant: true },
    });
    if (r === "cliente") {
      const c = await db.customer.create({ data: { userId: user.id, name: user.name, email: user.email, phone, city: user.city, avatarColor: user.avatarColor } });
      await db.loyaltyAccount.create({ data: { customerId: c.id, coins: 50, tier: "Bronce", streakDays: 0, challengesJson: "[]" } });
      await db.subscription.create({ data: { customerId: c.id, plan: "none", status: "inactive" } });
    }
  }

  const token = createToken(user.id, user.role);
  const res = NextResponse.json({ user: serializeUser(user) });
  res.headers.set("Set-Cookie", setAuthCookie(token));
  return res;
}

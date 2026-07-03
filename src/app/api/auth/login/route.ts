import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken, setAuthCookie, serializeUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { customer: true, driver: true, restaurant: true },
  });
  if (!user || !user.password) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  if (!verifyPassword(password, user.password)) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const token = createToken(user.id, user.role);
  const res = NextResponse.json({ user: serializeUser(user) });
  res.headers.set("Set-Cookie", setAuthCookie(token));
  return res;
}

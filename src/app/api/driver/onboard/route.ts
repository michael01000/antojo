import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Driver onboarding — submit verification docs info
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { vehicle, plate } = await req.json();
  const driver = await db.driver.upsert({
    where: { userId: authUser.id },
    update: { vehicle: vehicle || "Moto", plate: plate || null, isVerified: false },
    create: { userId: authUser.id, name: authUser.name, vehicle: vehicle || "Moto", plate: plate || null, isVerified: false },
  });
  // notify admin
  const admins = await db.user.findMany({ where: { role: "admin" } });
  await db.notification.createMany({ data: admins.map((a) => ({
    userId: a.id, title: "Nuevo domiciliario para verificar", body: `${authUser.name} envió su información para verificación.`,
    type: "system", icon: "🏍️",
  })) });
  return NextResponse.json({ driver });
}

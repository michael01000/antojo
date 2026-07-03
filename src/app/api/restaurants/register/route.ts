import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Restaurant registration (a restaurante-role user submits their restaurant profile)
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { name, description, cuisine, neighborhood, phone } = await req.json();
  if (!name || !cuisine) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });

  const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 5);

  const restaurant = await db.restaurant.create({
    data: {
      userId: authUser.id,
      name, slug, description: description || `Restaurante de ${cuisine} en ${neighborhood || "Bogotá"}`,
      cuisine, neighborhood: neighborhood || "Bogotá",
      imageUrl: "https://sfile.chatglm.cn/images-ppt/8b65263b8269.jpg",
      coverColor: "mora", accentColor: "mora",
      isApproved: false, isOpen: false,
      ownerName: authUser.name, ownerPhone: phone,
    },
  });

  // notify admin
  const admins = await db.user.findMany({ where: { role: "admin" } });
  await db.notification.createMany({ data: admins.map((a) => ({
    userId: a.id, title: "Nueva solicitud de restaurante", body: `${name} solicita unirse a Antojo.`,
    type: "system", icon: "🏪",
  })) });

  return NextResponse.json({ restaurant });
}

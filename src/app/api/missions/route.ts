import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const MISSIONS_POOL = [
  { type: "veggie", title: "Día verde 🥗", description: "Pide algo vegetariano hoy", icon: "🥗", reward: 50 },
  { type: "new_restaurant", title: "Explorador 🗺️", description: "Prueba un restaurante que no hayas pedido", icon: "🗺️", reward: 80 },
  { type: "reorder", title: "Fiel cliente 🔁", description: "Repite un pedido de esta semana", icon: "🔁", reward: 40 },
  { type: "spicy", title: "Picante 🌶️", description: "Pide algo con picante", icon: "🌶️", reward: 60 },
  { type: "breakfast", title: "Madrugador ☀️", description: "Pide antes de las 10am", icon: "☀️", reward: 70 },
  { type: "dessert", title: "Dulce antojo 🍰", description: "Pide un postre", icon: "🍰", reward: 50 },
];

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ mission: null });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ mission: null });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  let mission = await db.dailyMission.findFirst({ where: { customerId: customer.id, date: today } });
  if (!mission) {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const m = MISSIONS_POOL[dayOfYear % MISSIONS_POOL.length];
    mission = await db.dailyMission.create({ data: { customerId: customer.id, date: today, type: m.type, title: m.title, description: m.description, icon: m.icon, reward: m.reward } });
  }
  return NextResponse.json({ mission: { ...mission, date: mission.date.toISOString() } });
}

export async function PATCH() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const mission = await db.dailyMission.findFirst({ where: { customerId: customer.id, date: today } });
  if (!mission || mission.completed) return NextResponse.json({ error: "No completable" }, { status: 400 });
  await db.dailyMission.update({ where: { id: mission.id }, data: { completed: true } });
  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: customer.id } });
  if (loyalty) await db.loyaltyAccount.update({ where: { id: loyalty.id }, data: { coins: { increment: mission.reward } } });
  return NextResponse.json({ ok: true, reward: mission.reward });
}

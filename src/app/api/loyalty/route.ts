import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

export async function GET() {
  const c = await getCurrentCustomer();
  const l = await db.loyaltyAccount.findUnique({ where: { customerId: c.id } });
  if (!l) return NextResponse.json({ error: "No loyalty" }, { status: 404 });
  return NextResponse.json({
    id: l.id, coins: l.coins, tier: l.tier, streakDays: l.streakDays,
    challenges: JSON.parse(l.challengesJson),
  });
}

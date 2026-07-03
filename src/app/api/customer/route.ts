import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

export async function GET() {
  const c = await getCurrentCustomer();
  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: c.id } });
  const subscription = await db.subscription.findUnique({ where: { customerId: c.id } });
  const addresses = await db.address.findMany({ where: { customerId: c.id } });
  return NextResponse.json({
    customer: {
      id: c.id, name: c.name, email: c.email, phone: c.phone, city: c.city, avatarColor: c.avatarColor,
    },
    loyalty: loyalty ? {
      id: loyalty.id, coins: loyalty.coins, tier: loyalty.tier, streakDays: loyalty.streakDays,
      challenges: JSON.parse(loyalty.challengesJson),
    } : null,
    subscription: subscription ? { id: subscription.id, plan: subscription.plan, status: subscription.status, renewsAt: subscription.renewsAt?.toISOString() ?? null } : null,
    addresses: addresses.map((a) => ({ id: a.id, label: a.label, street: a.street, details: a.details })),
  });
}

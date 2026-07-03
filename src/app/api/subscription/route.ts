import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/server";

export async function GET() {
  const c = await getCurrentCustomer();
  const s = await db.subscription.findUnique({ where: { customerId: c.id } });
  return NextResponse.json(s ? { id: s.id, plan: s.plan, status: s.status, renewsAt: s.renewsAt?.toISOString() ?? null } : { plan: "none", status: "inactive", renewsAt: null });
}

export async function PATCH(req: NextRequest) {
  const c = await getCurrentCustomer();
  const { plan } = await req.json();
  const s = await db.subscription.upsert({
    where: { customerId: c.id },
    update: { plan, status: "active", renewsAt: new Date(Date.now() + 1000*60*60*24*30) },
    create: { customerId: c.id, plan, status: "active", renewsAt: new Date(Date.now() + 1000*60*60*24*30) },
  });
  return NextResponse.json({ id: s.id, plan: s.plan, status: s.status, renewsAt: s.renewsAt?.toISOString() ?? null });
}

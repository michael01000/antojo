import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentDriver } from "@/lib/server";

export async function PATCH(req: NextRequest) {
  const me = await getCurrentDriver();
  if (!me) return NextResponse.json({ error: "no driver" }, { status: 404 });
  const { online } = await req.json();
  const d = await db.driver.update({ where: { id: me.id }, data: { isOnline: online } });
  return NextResponse.json({ driver: d });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAvailable } = await req.json();
  const m = await db.menuItem.update({ where: { id }, data: { isAvailable } });
  return NextResponse.json({ menuItem: m });
}

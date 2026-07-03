import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const msgs = await db.chatMessage.findMany({ where: { orderId: id }, orderBy: { at: "asc" } });
  return NextResponse.json({ messages: msgs.map((m) => ({ ...m, at: m.at.toISOString() })) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sender, text } = await req.json();
  const msg = await db.chatMessage.create({ data: { orderId: id, sender, text } });
  return NextResponse.json({ message: { ...msg, at: msg.at.toISOString() } });
}

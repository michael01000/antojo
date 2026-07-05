import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * PATCH /api/reviews/[id]/reply
 * El restaurante responde a una reseña.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const { reply } = await req.json();
  if (!reply?.trim()) return NextResponse.json({ error: "Respuesta vacía" }, { status: 400 });

  const review = await db.review.update({
    where: { id },
    data: { restaurantReply: reply.trim(), restaurantReplyAt: new Date() },
  });
  return NextResponse.json({ ok: true, review });
}

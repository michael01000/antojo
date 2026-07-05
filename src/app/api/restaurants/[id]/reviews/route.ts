import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await db.review.findMany({
    where: { restaurantId: id },
    orderBy: { at: "desc" },
    take: 20,
    include: { customer: { select: { name: true, avatarColor: true } } },
  });
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id, rating: r.rating, comment: r.comment, foodRating: r.foodRating, deliveryRating: r.deliveryRating,
      photoUrl: r.photoUrl,
      at: r.at.toISOString(), customerName: r.customer?.name ?? "Cliente", avatarColor: r.customer?.avatarColor ?? "antojo",
      restaurantReply: r.restaurantReply,
      restaurantReplyAt: r.restaurantReplyAt?.toISOString() ?? null,
    })),
  });
}

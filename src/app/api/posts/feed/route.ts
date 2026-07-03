import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCurrentCustomer } from "@/lib/server";

// Feed social: posts de restaurantes seguidos + patrocinados + explorar
export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "following"; // following | explore
  const authUser = await getAuthUser();
  const customer = authUser ? await db.customer.findUnique({ where: { userId: authUser.id } }) : null;

  const now = new Date();
  const whereActive = { OR: [{ isSponsored: false }, { isSponsored: true, sponsoredUntil: { gt: now } }] };

  let posts;
  if (tab === "following" && customer) {
    const follows = await db.follow.findMany({ where: { customerId: customer.id }, select: { restaurantId: true } });
    const followedIds = follows.map((f) => f.restaurantId);
    // Patrocinados primero (máx 2), luego seguidos
    const sponsored = await db.post.findMany({
      where: { ...whereActive, isSponsored: true },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    const following = await db.post.findMany({
      where: { restaurantId: { in: followedIds }, isSponsored: false },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    posts = [...sponsored, ...following];
  } else {
    // Explore: todos los posts, patrocinados primero
    posts = await db.post.findMany({
      where: whereActive,
      include: { restaurant: true },
      orderBy: [{ isSponsored: "desc" }, { createdAt: "desc" }],
      take: 30,
    });
  }

  // Check which posts the customer liked
  let likedIds = new Set<string>();
  if (customer) {
    const likes = await db.postLike.findMany({ where: { customerId: customer.id, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } });
    likedIds = new Set(likes.map((l) => l.postId));
  }

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      caption: p.caption,
      menuItemId: p.menuItemId,
      isSponsored: p.isSponsored,
      sponsoredUntil: p.sponsoredUntil?.toISOString() ?? null,
      likes: p.likes,
      liked: likedIds.has(p.id),
      createdAt: p.createdAt.toISOString(),
      restaurant: {
        id: p.restaurant.id, name: p.restaurant.name, imageUrl: p.restaurant.imageUrl,
        accentColor: p.restaurant.accentColor, cuisine: p.restaurant.cuisine,
      },
    })),
  });
}

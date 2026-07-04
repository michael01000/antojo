import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Feed social: posts de restaurantes seguidos + patrocinados + explorar.
// Incluye el join del menuItem (cuando existe) para habilitar el CTA
// "Ordenar este plato" con precio real — fricción cero, sin salir del feed.
const MENU_ITEM_INCLUDE = {
  select: {
    id: true,
    name: true,
    price: true,
    emoji: true,
    isAvailable: true,
  },
} as const;

// Feed social: posts de restaurantes seguidos + patrocinados + explorar
export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "following"; // following | explore
  const authUser = await getAuthUser();
  const customer = authUser ? await db.customer.findUnique({ where: { userId: authUser.id } }) : null;

  const now = new Date();
  const whereActive = { OR: [{ isSponsored: false }, { isSponsored: true, sponsoredUntil: { gt: now } }] };

  // include compartido: restaurante + menuItem (si está linkeado)
  const postInclude = {
    restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true, cuisine: true, neighborhood: true, deliveryFee: true, deliveryMin: true } },
    menuItem: MENU_ITEM_INCLUDE,
  } as const;

  let posts;
  if (tab === "following" && customer) {
    const follows = await db.follow.findMany({ where: { customerId: customer.id }, select: { restaurantId: true } });
    const followedIds = follows.map((f) => f.restaurantId);
    // Patrocinados primero (máx 2), luego seguidos
    const sponsored = await db.post.findMany({
      where: { ...whereActive, isSponsored: true },
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: 2,
    });
    const following = await db.post.findMany({
      where: { restaurantId: { in: followedIds }, isSponsored: false },
      include: postInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    posts = [...sponsored, ...following];
  } else {
    // Explore: todos los posts, patrocinados primero
    posts = await db.post.findMany({
      where: whereActive,
      include: postInclude,
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
        neighborhood: p.restaurant.neighborhood, deliveryFee: p.restaurant.deliveryFee, deliveryMin: p.restaurant.deliveryMin,
      },
      // menuItem completo para el CTA de "Ordenar este plato" (precio real)
      menuItem: p.menuItem
        ? {
            id: p.menuItem.id,
            name: p.menuItem.name,
            price: p.menuItem.price,
            emoji: p.menuItem.emoji,
            isAvailable: p.menuItem.isAvailable,
          }
        : null,
    })),
  });
}

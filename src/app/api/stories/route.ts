import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Stories activas (no expiradas) de restaurantes seguidos + destacados
export async function GET() {
  const authUser = await getAuthUser();
  const customer = authUser ? await db.customer.findUnique({ where: { userId: authUser.id } }) : null;
  const now = new Date();

  let restaurantIds: string[] | undefined;
  if (customer) {
    const follows = await db.follow.findMany({ where: { customerId: customer.id }, select: { restaurantId: true } });
    restaurantIds = follows.map((f) => f.restaurantId);
  }

  const stories = await db.story.findMany({
    where: { expiresAt: { gt: now }, ...(restaurantIds && restaurantIds.length ? { restaurantId: { in: restaurantIds } } : {}) },
    include: { restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Si no sigue a nadie, mostrar todas las activas
  let finalStories = stories;
  if (restaurantIds && stories.length === 0) {
    finalStories = await db.story.findMany({
      where: { expiresAt: { gt: now } },
      include: { restaurant: { select: { id: true, name: true, imageUrl: true, accentColor: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  // Agrupar por restaurante
  const byRestaurant = new Map<string, any>();
  for (const s of finalStories) {
    if (!byRestaurant.has(s.restaurant.id)) {
      byRestaurant.set(s.restaurant.id, { restaurant: s.restaurant, stories: [] });
    }
    byRestaurant.get(s.restaurant.id).stories.push({
      id: s.id, imageUrl: s.imageUrl, caption: s.caption, menuItemId: s.menuItemId,
      expiresAt: s.expiresAt.toISOString(),
    });
  }

  // Marcar vistas
  let viewedIds = new Set<string>();
  if (customer) {
    const views = await db.storyView.findMany({ where: { customerId: customer.id, storyId: { in: finalStories.map((s) => s.id) } }, select: { storyId: true } });
    viewedIds = new Set(views.map((v) => v.storyId));
  }
  for (const group of byRestaurant.values()) {
    group.stories = group.stories.map((s: any) => ({ ...s, viewed: viewedIds.has(s.id) }));
  }

  return NextResponse.json({ groups: Array.from(byRestaurant.values()) });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const { imageUrl, caption, menuItemId } = await req.json();
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const story = await db.story.create({
    data: { restaurantId: restaurant.id, imageUrl, caption, menuItemId: menuItemId ?? null, expiresAt },
  });
  return NextResponse.json({ story });
}

export async function PATCH(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { storyId } = await req.json();
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  await db.storyView.upsert({ where: { storyId_customerId: { storyId, customerId: customer.id } }, update: {}, create: { storyId, customerId: customer.id } });
  return NextResponse.json({ ok: true });
}

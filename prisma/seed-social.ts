// Seed social data (posts, stories) into the DB
import { config } from "dotenv"; config();
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const FOOD_IMAGES = [
  "https://sfile.chatglm.cn/images-ppt/e7bc8c902f79.jpg",
  "https://sfile.chatglm.cn/images-ppt/6437044a5039.jpg",
  "https://sfile.chatglm.cn/images-ppt/1a2f11106c7f.jpg",
  "https://sfile.chatglm.cn/images-ppt/025ad4dd39e6.jpg",
  "https://sfile.chatglm.cn/images-ppt/d6cc7d62b2e3.jpg",
  "https://sfile.chatglm.cn/images-ppt/1ed5211820fa.jpg",
];

async function main() {
  const restaurants = await db.restaurant.findMany({ take: 6, orderBy: { rating: "desc" } });
  const customer = await db.customer.findFirst({ orderBy: { createdAt: "asc" } });

  // Limpia social data previa
  await db.storyView.deleteMany();
  await db.story.deleteMany();
  await db.postLike.deleteMany();
  await db.post.deleteMany();
  if (customer) await db.follow.deleteMany({ where: { customerId: customer.id } });

  const captions = [
    "Big Doble Bacon 2x1 solo hoy 🔥 ¡No te lo pierdas!",
    "Pizza Margherita DOP recién salida del horno a leña 🍕",
    "Dragon Roll fresco con anguila unagi 🐉 ¿Lo probaste?",
    "Bandeja Paisa gigante para compartir 🇨🇴 ¡Auténtica!",
    "Combo Familiar -25% este finde 🍗",
    "Tacos al pastor 3x2 los martes 🌮🌶️",
  ];

  // Crear posts
  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    // Linkear el post al primer menuItem popular del restaurante (para el CTA con precio real)
    const menuItem = await db.menuItem.findFirst({ where: { restaurantId: r.id, isAvailable: true }, orderBy: { isPopular: "desc" } });
    await db.post.create({
      data: {
        restaurantId: r.id,
        imageUrl: FOOD_IMAGES[i],
        caption: captions[i],
        menuItemId: menuItem?.id ?? null,
        isSponsored: i < 2, // los primeros 2 son patrocinados
        sponsoredUntil: i < 2 ? new Date(Date.now() + 7 * 86400000) : null,
        likes: Math.floor(Math.random() * 80) + 15,
      },
    });

    // Crear story (también linkeada al menuItem)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await db.story.create({
      data: {
        restaurantId: r.id,
        imageUrl: FOOD_IMAGES[i],
        caption: captions[i].split(" ").slice(0, 4).join(" ") + "...",
        menuItemId: menuItem?.id ?? null,
        expiresAt,
      },
    });

    // Follow: el cliente sigue los primeros 3 restaurantes
    if (customer && i < 3) {
      await db.follow.create({ data: { customerId: customer.id, restaurantId: r.id } });
    }

    // Actualizar lastPostAt
    await db.restaurant.update({ where: { id: r.id }, data: { lastPostAt: new Date() } });
  }

  // Marcar PYME promo para restaurantes nuevos (simular 2 meses gratis)
  const pymeUntil = new Date();
  pymeUntil.setDate(pymeUntil.getDate() + 60);
  for (const r of restaurants) {
    await db.restaurant.update({ where: { id: r.id }, data: { pymePromoUntil: pymeUntil } });
  }

  console.log("✅ Social seed complete:", restaurants.length, "posts + stories creados");
}

main().catch(console.error).finally(() => db.$disconnect());

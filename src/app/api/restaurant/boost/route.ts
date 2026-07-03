import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { ADS_PLANS, startPymePromo } from "@/lib/economics";

// Cambiar plan de Ads (free → pro → premium)
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "restaurante") return NextResponse.json({ error: "Solo restaurantes" }, { status: 403 });
  const { plan } = await req.json();
  if (!["free", "pro", "premium"].includes(plan)) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  const restaurant = await db.restaurant.findUnique({ where: { userId: authUser.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 });

  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + 1);

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      adsPlan: plan,
      adsRenewsAt: renewsAt,
      sponsoredPostsUsed: 0,
      sponsoredPostsResetAt: renewsAt,
    },
  });

  // Si es restaurante nuevo y pasa a un plan pago, mantener promo PYMES si aplica
  if (plan !== "free" && !restaurant.pymePromoUntil) {
    await db.restaurant.update({ where: { id: restaurant.id }, data: { pymePromoUntil: startPymePromo() } });
  }

  return NextResponse.json({ ok: true, plan, renewsAt: renewsAt.toISOString() });
}

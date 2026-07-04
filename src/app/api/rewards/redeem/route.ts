import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCurrentCustomer } from "@/lib/server";
import { getRewardById, generateCoinCode } from "@/lib/rewards";

/**
 * POST /api/rewards/redeem
 * Canjea coins por una recompensa.
 *
 * Lógica:
 * 1. Validar que el cliente tiene coins suficientes
 * 2. Descontar coins de LoyaltyAccount
 * 3. Crear cupón COIN-XXXX en Promotion con ownerCustomerId
 * 4. Si es tipo "prime", activar la suscripción al instante
 * 5. Retornar el cupón creado
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") {
    return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  }

  const { rewardId } = await req.json();
  const reward = getRewardById(rewardId);
  if (!reward) return NextResponse.json({ error: "Recompensa no encontrada" }, { status: 404 });

  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: customer.id } });
  if (!loyalty) return NextResponse.json({ error: "Sin cuenta de lealtad" }, { status: 404 });

  // ─── 1. Validar coins suficientes ───
  if (loyalty.coins < reward.cost) {
    return NextResponse.json({ error: `Necesitas ${reward.cost} coins. Tienes ${loyalty.coins}.` }, { status: 400 });
  }

  // ─── 2. Descontar coins ───
  await db.loyaltyAccount.update({
    where: { id: loyalty.id },
    data: { coins: { decrement: reward.cost } },
  });

  // ─── 3. Crear cupón COIN-XXXX ───
  const code = generateCoinCode();
  let minOrder = 0;
  if (reward.type === "fixed" && reward.value >= 10000) minOrder = 20000;

  const coupon = await db.promotion.create({
    data: {
      code,
      title: reward.title,
      description: reward.description,
      type: reward.type === "prime" ? "fixed" : reward.type, // Prime se maneja aparte
      value: reward.value,
      minOrder,
      fundedBy: "antojo", // las recompensas las financia Antojo
      active: true,
      uses: 0,
      ownerCustomerId: customer.id,
      used: false,
    },
  });

  // ─── 4. Si es Prime, activar suscripción al instante ───
  if (reward.type === "prime") {
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);
    await db.subscription.upsert({
      where: { customerId: customer.id },
      update: { plan: "prime", status: "active", renewsAt },
      create: { customerId: customer.id, plan: "prime", status: "active", renewsAt },
    });
  }

  return NextResponse.json({
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      title: coupon.title,
      type: coupon.type,
      value: coupon.value,
      used: coupon.used,
    },
    coinsRemaining: loyalty.coins - reward.cost,
    primeActivated: reward.type === "prime",
  });
}

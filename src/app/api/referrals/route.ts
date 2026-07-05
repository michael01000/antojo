import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCurrentCustomer } from "@/lib/server";

/**
 * GET /api/referrals — código de referido del cliente + stats
 * POST /api/referrals — aplicar código de referido (primer pedido)
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ referral: null });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ referral: null });

  // Generar código si no existe
  let referralCode = customer.referralCode;
  if (!referralCode) {
    referralCode = "ANTOJO-" + customer.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) + Math.random().toString(36).slice(2, 4).toUpperCase();
    await db.customer.update({ where: { id: customer.id }, data: { referralCode } });
  }

  // Contar referidos
  const referralsCount = await db.customer.count({ where: { referredByCode: referralCode } });

  return NextResponse.json({
    referral: {
      code: referralCode,
      referralsCount,
      coinsEarned: referralsCount * 200,
      link: `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${referralCode}`,
    },
  });
}

export async function POST(req: Request) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { code } = await req.json();
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  if (customer.referredByCode) return NextResponse.json({ error: "Ya usaste un código de referido" }, { status: 400 });

  // Validar que el código existe
  const referrer = await db.customer.findFirst({ where: { referralCode: code } });
  if (!referrer) return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  if (referrer.id === customer.id) return NextResponse.json({ error: "No puedes referirte a ti mismo" }, { status: 400 });

  // Aplicar: ambos ganan 200 coins
  await db.customer.update({ where: { id: customer.id }, data: { referredByCode: code } });
  const loyalty = await db.loyaltyAccount.findUnique({ where: { customerId: customer.id } });
  if (loyalty) await db.loyaltyAccount.update({ where: { id: loyalty.id }, data: { coins: { increment: 200 } } });
  const referrerLoyalty = await db.loyaltyAccount.findUnique({ where: { customerId: referrer.id } });
  if (referrerLoyalty) await db.loyaltyAccount.update({ where: { id: referrerLoyalty.id }, data: { coins: { increment: 200 } } });

  return NextResponse.json({ ok: true, message: "¡Código aplicado! Ambos ganaron 200 coins 🎉" });
}

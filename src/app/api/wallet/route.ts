import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getCurrentCustomer } from "@/lib/server";

/**
 * GET /api/wallet — balance + transacciones
 * POST /api/wallet — recargar saldo (topup). body: { amount }
 *   Bonus: recarga $100.000+ = +$5.000 bonus
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ wallet: null });
  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ wallet: null });

  let wallet = await db.wallet.findUnique({ where: { customerId: customer.id }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } });
  if (!wallet) {
    wallet = await db.wallet.create({ data: { customerId: customer.id, balance: 0 }, include: { transactions: true } });
  }

  return NextResponse.json({
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      transactions: wallet.transactions.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    },
  });
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { amount } = await req.json();
  if (!amount || amount < 10000) return NextResponse.json({ error: "Recarga mínima $10.000" }, { status: 400 });

  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  let wallet = await db.wallet.findUnique({ where: { customerId: customer.id } });
  if (!wallet) wallet = await db.wallet.create({ data: { customerId: customer.id } });

  // Bonus: recarga $100.000+ = +$5.000
  const bonus = amount >= 100000 ? 5000 : 0;
  const totalAdd = amount + bonus;

  await db.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: totalAdd } } });
  await db.walletTransaction.create({
    data: { walletId: wallet.id, type: "topup", amount, description: `Recarga de ${amount} COP` },
  });
  if (bonus > 0) {
    await db.walletTransaction.create({
      data: { walletId: wallet.id, type: "bonus", amount: bonus, description: "Bonus por recarga $100.000+" },
    });
  }

  return NextResponse.json({ ok: true, newBalance: wallet.balance + totalAdd, bonus });
}

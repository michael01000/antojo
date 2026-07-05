import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/group-orders/[code]/pay-share
 * Split Payment: un participante paga su parte del pedido grupal.
 *
 * Lógica:
 * 1. Fetch el group order con items
 * 2. Agrupar items por addedByName (cada persona tiene sus items)
 * 3. Calcular cuánto debe esta persona (subtotal de sus items + prorrateo de fees)
 * 4. Registrar el pago de esta persona
 * 5. Si todos pagaron, el host confirma y se crea la orden
 *
 * MVP: registramos quién pagó en participantsJson con su monto.
 * Cuando todos pagan, se marca como "locked" y el host puede hacer checkout.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ error: "Solo clientes" }, { status: 403 });
  const { paymentMethod } = await req.json();

  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const go = await db.groupOrder.findUnique({
    where: { code: code.toUpperCase() },
    include: { items: true, restaurant: { select: { name: true } } },
  });
  if (!go) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (go.status !== "open") return NextResponse.json({ error: "Pedido cerrado" }, { status: 400 });

  // Calcular cuánto debe esta persona (sus items)
  const myItems = go.items.filter(i => i.addedByName === customer.name);
  if (myItems.length === 0) return NextResponse.json({ error: "No tienes items en este pedido" }, { status: 400 });

  const mySubtotal = myItems.reduce((s, i) => s + i.price * i.qty, 0);
  const myServiceFee = Math.round(mySubtotal * 0.08);
  const myTotal = mySubtotal + myServiceFee;

  // Registrar pago en participantsJson
  const participants: any[] = JSON.parse(go.participantsJson);
  let participant = participants.find(p => p.name === customer.name);
  if (!participant) {
    participant = { name: customer.name, paid: false, amount: 0 };
    participants.push(participant);
  }
  if (participant.paid) return NextResponse.json({ error: "Ya pagaste tu parte" }, { status: 400 });

  participant.paid = true;
  participant.amount = myTotal;
  participant.paymentMethod = paymentMethod || "Tarjeta";

  // Verificar si todos pagaron
  const allPaid = participants.every(p => p.paid !== undefined && p.paid === true);
  const newStatus = allPaid ? "locked" : "open";

  await db.groupOrder.update({
    where: { id: go.id },
    data: { participantsJson: JSON.stringify(participants), status: newStatus },
  });

  return NextResponse.json({
    ok: true,
    myTotal,
    myItems: myItems.length,
    allPaid,
    status: newStatus,
    message: allPaid
      ? "¡Todos pagaron! El host puede confirmar el pedido."
      : "Tu parte está paga. Esperando a los demás.",
  });
}

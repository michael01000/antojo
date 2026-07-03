import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// Approve/reject a restaurant or driver. body: { type: "restaurant"|"driver", id, approve: boolean }
export async function POST(req: NextRequest) {
  await requireAuth(["admin"]);
  const { type, id, approve } = await req.json();
  if (type === "restaurant") {
    await db.restaurant.update({ where: { id }, data: { isApproved: approve, isOpen: approve } });
    const r = await db.restaurant.findUnique({ where: { id }, include: { user: true } });
    if (r?.userId) await db.notification.create({ data: { userId: r.userId, title: approve ? "¡Restaurante aprobado!" : "Solicitud rechazada", body: approve ? `Tu restaurante ${r.name} ya está activo en Antojo.` : `Tu solicitud para ${r.name} fue rechazada.`, type: "system", icon: approve ? "✅" : "⚠️" } });
  } else if (type === "driver") {
    await db.driver.update({ where: { id }, data: { isVerified: approve } });
    const d = await db.driver.findUnique({ where: { id }, include: { user: true } });
    if (d?.userId) await db.notification.create({ data: { userId: d.userId, title: approve ? "¡Verificación aprobada!" : "Verificación rechazada", body: approve ? "Ya puedes empezar a recibir pedidos." : "Tu verificación fue rechazada. Revisa tu información.", type: "system", icon: approve ? "✅" : "⚠️" } });
  }
  return NextResponse.json({ ok: true });
}

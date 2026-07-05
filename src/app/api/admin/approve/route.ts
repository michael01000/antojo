import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * POST /api/admin/approve
 *
 * Acciones de moderación para restaurantes y domiciliarios.
 * body: { type: "restaurant" | "driver", id, action: "approve" | "suspend" | "delete" }
 *
 * - approve: activa restaurante/driver (isApproved/isVerified = true, isOpen/isOnline = true)
 * - suspend: desactiva (isApproved/isVerified = false, isOpen/isOnline = false)
 * - delete: elimina el registro permanentemente
 *
 * Todas las acciones envían una notificación al usuario afectado (excepto delete).
 */
export async function POST(req: NextRequest) {
  await requireAuth(["admin"]);
  const { type, id, action } = await req.json();

  if (!["approve", "suspend", "delete"].includes(action)) {
    return NextResponse.json({ error: "Acción inválida. Usa: approve, suspend, delete" }, { status: 400 });
  }

  if (type === "restaurant") {
    if (action === "delete") {
      await db.restaurant.delete({ where: { id } });
      return NextResponse.json({ ok: true, action: "deleted" });
    }

    const approve = action === "approve";
    await db.restaurant.update({ where: { id }, data: { isApproved: approve, isOpen: approve } });
    const r = await db.restaurant.findUnique({ where: { id }, include: { user: true } });
    if (r?.userId) {
      await db.notification.create({
        data: {
          userId: r.userId,
          title: approve ? "¡Restaurante aprobado!" : "Restaurante suspendido",
          body: approve ? `Tu restaurante ${r.name} ya está activo en Antojo.` : `Tu restaurante ${r.name} ha sido suspendido. Contacta soporte.`,
          type: "system",
          icon: approve ? "✅" : "⚠️",
        },
      });
    }
    return NextResponse.json({ ok: true, action, isApproved: approve });
  }

  if (type === "driver") {
    if (action === "delete") {
      await db.driver.update({ where: { id }, data: { currentOrderId: null } }).catch(() => {});
      await db.driver.delete({ where: { id } });
      return NextResponse.json({ ok: true, action: "deleted" });
    }

    const approve = action === "approve";
    await db.driver.update({ where: { id }, data: { isVerified: approve, isOnline: approve ? undefined : false } });
    const d = await db.driver.findUnique({ where: { id }, include: { user: true } });
    if (d?.userId) {
      await db.notification.create({
        data: {
          userId: d.userId,
          title: approve ? "¡Verificación aprobada!" : "Cuenta suspendida",
          body: approve ? "Ya puedes empezar a recibir pedidos." : "Tu cuenta ha sido suspendida. Contacta soporte.",
          type: "system",
          icon: approve ? "✅" : "⚠️",
        },
      });
    }
    return NextResponse.json({ ok: true, action, isVerified: approve });
  }

  return NextResponse.json({ error: "Tipo inválido. Usa: restaurant, driver" }, { status: 400 });
}

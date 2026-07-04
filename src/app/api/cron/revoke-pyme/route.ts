import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PYME_WEEKLY_POST_REQUIREMENT } from "@/lib/economics";

/**
 * GET /api/cron/revoke-pyme
 *
 * Cron Job — Revoca la promo PYMES de restaurantes que no han publicado
 * al menos 1 post en los últimos 7 días.
 *
 * 🔒 Seguridad: valida CRON_SECRET en el header Authorization.
 *   Configurar en Vercel: CRON_SECRET = "una-cadena-aleatoria-larga"
 *   Llamar con: Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron config (vercel.json):
 *   { "crons": [{ "path": "/api/cron/revoke-pyme", "schedule": "0 9 * * *" }] }
 *   (ejecuta todos los días a las 9:00 AM UTC)
 *
 * Lógica:
 *   1. Busca restaurantes con pymePromoUntil > hoy (promo activa)
 *   2. Para cada uno, evalúa lastPostAt
 *   3. Si lastPostAt es null o > 7 días → revoca (set pymePromoUntil = ahora)
 *   4. Retorna resumen JSON
 */
export async function GET(req: NextRequest) {
  // ─── Validar CRON_SECRET ───
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "No autorizado — CRON_SECRET inválido" }, { status: 401 });
  }

  // ─── 1. Buscar restaurantes con promo PYMES activa ───
  const now = new Date();
  const restaurantsWithPromo = await db.restaurant.findMany({
    where: {
      pymePromoUntil: { gt: now }, // promo aún vigente
    },
    select: {
      id: true,
      name: true,
      pymePromoUntil: true,
      lastPostAt: true,
    },
  });

  // ─── 2. Evaluar cada restaurante ───
  const revoked: { id: string; name: string; lastPostAt: string | null; daysSincePost: number }[] = [];
  const kept: { id: string; name: string; daysSincePost: number }[] = [];

  for (const r of restaurantsWithPromo) {
    let daysSincePost = Infinity;

    if (r.lastPostAt) {
      daysSincePost = (now.getTime() - new Date(r.lastPostAt).getTime()) / 86400000;
    }

    if (daysSincePost > PYME_WEEKLY_POST_REQUIREMENT) {
      // ─── 3. Revocar: set pymePromoUntil = ahora (promo expirada) ───
      await db.restaurant.update({
        where: { id: r.id },
        data: { pymePromoUntil: now }, // fecha pasada → pymePromoActive() devuelve false
      });
      revoked.push({
        id: r.id,
        name: r.name,
        lastPostAt: r.lastPostAt?.toISOString() ?? null,
        daysSincePost: r.lastPostAt ? Math.round(daysSincePost) : -1, // -1 = nunca posteó
      });
    } else {
      kept.push({
        id: r.id,
        name: r.name,
        daysSincePost: Math.round(daysSincePost),
      });
    }
  }

  // ─── 4. Retornar resumen ───
  return NextResponse.json({
    ok: true,
    at: now.toISOString(),
    summary: {
      evaluated: restaurantsWithPromo.length,
      revoked: revoked.length,
      kept: kept.length,
    },
    revoked,
    kept,
  });
}

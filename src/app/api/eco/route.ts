import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * GET /api/eco
 * Calcula estadísticas eco del cliente: CO2 ahorrado + árboles equivalentes.
 * Cada pedido a domicilio ahorra ~2.3kg CO2 vs manejar (promedio Bogotá).
 * Cada 100 pedidos = 1 árbol.
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== "cliente") return NextResponse.json({ eco: null });

  const customer = await db.customer.findUnique({ where: { userId: authUser.id } });
  if (!customer) return NextResponse.json({ eco: null });

  const orderCount = await db.order.count({ where: { customerId: customer.id, status: "delivered" } });
  const co2SavedKg = orderCount * 2.3; // promedio
  const treesAccumulated = Math.floor(orderCount / 100);

  return NextResponse.json({
    eco: {
      ordersDelivered: orderCount,
      co2SavedKg: Math.round(co2SavedKg * 10) / 10,
      treesAccumulated,
      nextTreeIn: 100 - (orderCount % 100),
      message: orderCount === 0
        ? "¡Haz tu primer pedido y empieza a salvar el planeta! 🌍"
        : `Has ahorrado ${Math.round(co2SavedKg)}kg de CO₂ — equivale a ${treesAccumulated} árbol(es) plantado(s) 🌳`,
    },
  });
}

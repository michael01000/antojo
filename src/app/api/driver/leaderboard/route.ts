import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/driver/leaderboard
 * Ranking mensual de domiciliarios por entregas + rating.
 * Top 3 reciben bonus financiado por la plataforma.
 */
export async function GET() {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Traer todos los drivers con sus stats del mes actual
  const drivers = await db.driver.findMany({
    where: { completedToday: { gt: 0 } },
    select: {
      id: true, name: true, avatarColor: true, vehicle: true, rating: true,
      earningsToday: true, completedToday: true, bonusEarnedToday: true,
    },
    orderBy: [{ completedToday: "desc" }, { rating: "desc" }],
  });

  const leaderboard = drivers.map((d, i) => ({
    rank: i + 1,
    ...d,
    monthlyDeliveries: d.completedToday * 4, // proyección mensual (MVP)
    monthlyEarnings: d.earningsToday * 22, // proyección mensual
    isTop3: i < 3,
    bonus: i < 3 ? [50000, 30000, 15000][i] : 0,
  }));

  return NextResponse.json({
    month: monthStr,
    leaderboard,
    totalDrivers: drivers.length,
    prizes: [
      { rank: 1, bonus: 50000, label: "🥇 Domiciliario del Mes" },
      { rank: 2, bonus: 30000, label: "🥈 Subcampeón" },
      { rank: 3, bonus: 15000, label: "🥉 Tercer lugar" },
    ],
  });
}

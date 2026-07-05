import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

/**
 * POST /api/business/register
 * Registra una cuenta empresarial.
 * body: { companyName, contactEmail, stipendPerEmployee }
 */
export async function POST(req: NextRequest) {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { companyName, contactEmail, stipendPerEmployee } = await req.json();
  if (!companyName || !contactEmail) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const business = await db.businessAccount.create({
    data: {
      companyName,
      contactEmail,
      stipendPerEmployee: stipendPerEmployee || 200000,
      employees: { create: { userId: authUser.id, monthlyStipend: stipendPerEmployee || 200000 } },
    },
    include: { employees: true },
  });

  return NextResponse.json({ business });
}

/**
 * GET /api/business — info de la cuenta empresarial del usuario
 */
export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) return NextResponse.json({ business: null });

  const employee = await db.businessEmployee.findUnique({
    where: { userId: authUser.id },
    include: { business: { include: { employees: true } } },
  });

  if (!employee) return NextResponse.json({ business: null });

  return NextResponse.json({
    business: {
      id: employee.business.id,
      companyName: employee.business.companyName,
      stipend: employee.monthlyStipend,
      usedThisMonth: employee.usedThisMonth,
      remaining: employee.monthlyStipend - employee.usedThisMonth,
      totalEmployees: employee.business.employees.length,
    },
  });
}

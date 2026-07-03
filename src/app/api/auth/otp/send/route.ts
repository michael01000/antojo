import { NextRequest, NextResponse } from "next/server";

// Simulated OTP send. In dev, the "code" is always 123456.
export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "Teléfono requerido" }, { status: 400 });
  // In production this would call an SMS provider. For the demo we echo a fixed code.
  return NextResponse.json({ sent: true, devCode: "123456", message: "Código enviado por SMS" });
}

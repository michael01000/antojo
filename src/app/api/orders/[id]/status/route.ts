import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeOrder, ORDER_INCLUDE } from "@/lib/server";

const LABELS: Record<string, string> = {
  placed: "Pedido confirmado",
  accepted: "Restaurante aceptó el pedido",
  preparing: "Preparando tu pedido",
  ready: "Listo para recoger",
  picked_up: "Domiciliario recogió el pedido",
  en_route: "En camino a tu dirección",
  delivered: "Pedido entregado",
  cancelled: "Pedido cancelado",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, driverId, driverLat, driverLng, etaMin } = await req.json();
  const data: any = { status };
  if (driverId !== undefined) data.driverId = driverId;
  if (driverLat !== undefined) data.driverLat = driverLat;
  if (driverLng !== undefined) data.driverLng = driverLng;
  if (etaMin !== undefined) data.etaMin = etaMin;

  const o = await db.order.update({ where: { id }, data, include: ORDER_INCLUDE });

  // add event if status changed
  if (status) {
    await db.orderEvent.create({ data: { orderId: id, status, label: LABELS[status] ?? status, at: new Date() } });
  }
  const fresh = await db.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  return NextResponse.json({ order: await serializeOrder(fresh!) });
}

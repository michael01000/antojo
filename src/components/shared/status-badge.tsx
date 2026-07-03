"use client";

import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { Check, ChefHat, Bike, Navigation, Store, Package, Receipt, X } from "lucide-react";

const MAP: Record<OrderStatus, { label: string; cls: string; icon: any }> = {
  placed: { label: "Confirmado", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300", icon: Receipt },
  accepted: { label: "Aceptado", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", icon: Store },
  preparing: { label: "Preparando", cls: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300", icon: ChefHat },
  ready: { label: "Listo", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300", icon: Package },
  picked_up: { label: "Recogido", cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300", icon: Bike },
  en_route: { label: "En ruta", cls: "bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300", icon: Navigation },
  delivered: { label: "Entregado", cls: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300", icon: Check },
  cancelled: { label: "Cancelado", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300", icon: X },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const m = MAP[status] ?? MAP.placed;
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", m.cls, className)}>
      <Icon size={12} /> {m.label}
    </span>
  );
}

export function StatusIcon({ status, size = 16 }: { status: OrderStatus; size?: number }) {
  const m = MAP[status] ?? MAP.placed;
  const Icon = m.icon;
  return <Icon size={size} />;
}

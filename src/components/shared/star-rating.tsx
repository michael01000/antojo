"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ value, size = 14, count }: { value: number; size?: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={size} className="fill-current" style={{ color: "var(--mango)" }} />
      <span className="font-semibold text-foreground tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground text-xs">({count > 999 ? `${(count/1000).toFixed(1)}k` : count})</span>}
    </span>
  );
}

export function Price({ value, className, strike }: { value: number; className?: string; strike?: boolean }) {
  const s = "$ " + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Math.round(value));
  return <span className={cn("tabular-nums", strike && "line-through text-muted-foreground", className)}>{s}</span>;
}

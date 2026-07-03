"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Bike, Store, Home, MapPin } from "lucide-react";

/**
 * Stylized live delivery map. Shows a street grid with restaurant (start),
 * driver (animated along route) and customer (end). Pure CSS — no external
 * tiles, fully reliable in the sandbox.
 */
export function LiveMap({
  driverLat,
  driverLng,
  progress = 0.5,
  className,
  status,
}: {
  driverLat: number;
  driverLng: number;
  progress?: number; // 0..1 position along route
  className?: string;
  status?: string;
}) {
  // The route goes from restaurant (top-left) to customer (bottom-right).
  // We interpolate the driver marker position based on progress.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  // route is an L-shape: restaurant -> mid (right) -> customer
  const r = { x: 14, y: 22 };
  const c = { x: 82, y: 74 };
  const mid = { x: 70, y: 30 };
  // position along the two segments
  const seg = progress < 0.5 ? { a: r, b: mid, t: progress / 0.5 } : { a: mid, b: c, t: (progress - 0.5) / 0.5 };
  const dx = seg.a.x + (seg.b.x - seg.a.x) * seg.t;
  const dy = seg.a.y + (seg.b.y - seg.a.y) * seg.t;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border/60 bg-[#eaf3ec] dark:bg-[#10221a]", className)}>
      {/* street grid */}
      <div className="absolute inset-0 bg-grid opacity-70" />
      {/* "parks" / blocks */}
      <div className="absolute left-[20%] top-[40%] h-16 w-24 rounded-lg bg-[#d6ead9] dark:bg-[#1a3326]" />
      <div className="absolute right-[10%] top-[12%] h-20 w-20 rounded-lg bg-[#d6ead9] dark:bg-[#1a3326]" />
      <div className="absolute left-[8%] bottom-[8%] h-14 w-28 rounded-lg bg-[#e8dcc7] dark:bg-[#2a2417]" />
      {/* "river" */}
      <div className="absolute left-0 right-0 top-[58%] h-3 -rotate-2 bg-[#bcd9ec] dark:bg-[#16314a] opacity-80" />

      {/* route path */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={`M ${r.x} ${r.y} L ${mid.x} ${mid.y} L ${c.x} ${c.y}`} fill="none" stroke="var(--antojo)" strokeWidth="1.4" strokeDasharray="3 2" strokeLinecap="round" opacity="0.7" />
      </svg>

      {/* restaurant marker */}
      <Marker x={r.x} y={r.y} color="var(--mora)" icon={<Store size={13} className="text-white" />} label="Restaurante" pulse={status === "preparing" || status === "ready"} />
      {/* customer marker */}
      <Marker x={c.x} y={c.y} color="var(--antojo)" icon={<Home size={13} className="text-white" />} label="Tu casa" ring />

      {/* driver marker (animated) */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear" style={{ left: `${dx}%`, top: `${dy}%` }}>
        <div className="relative">
          <div className="absolute inset-0 -m-2 animate-pulse-ring rounded-full" style={{ background: "var(--lima)" }} />
          <div className="relative grid h-9 w-9 place-items-center rounded-full shadow-glow" style={{ background: "var(--lima)" }}>
            <Bike size={17} className="text-white" />
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cafe px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--cafe)" }}>
            en camino
          </div>
        </div>
      </div>

      {/* ETA chip */}
      <div className="absolute right-3 top-3 rounded-xl glass px-3 py-1.5 text-xs font-semibold shadow-soft">
        <span className="flex items-center gap-1.5"><MapPin size={12} style={{ color: "var(--antojo)" }} /> Bogotá · Chapinero</span>
      </div>
    </div>
  );
}

function Marker({ x, y, color, icon, label, pulse, ring }: { x: number; y: number; color: string; icon: React.ReactNode; label?: string; pulse?: boolean; ring?: boolean }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
      {pulse && <div className="absolute inset-0 -m-1 animate-pulse-ring rounded-full" style={{ background: color, opacity: 0.4 }} />}
      <div className={cn("relative grid h-8 w-8 place-items-center rounded-full shadow-soft", ring && "ring-2 ring-white")} style={{ background: color }}>
        {icon}
      </div>
      {label && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-foreground shadow-soft dark:bg-card">{label}</div>}
    </div>
  );
}

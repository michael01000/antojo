"use client";

import { useAdminEarnings, useAdminAudit } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Wallet, Bike, Store, Receipt, Percent, Award, ArrowDownRight } from "lucide-react";
import { cop, copShort, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export function AdminEarningsView() {
  const { data, isLoading } = useAdminEarnings();
  const { data: audit } = useAdminAudit();

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { kpis, serie7d, top5, recent } = data;
  const marginPct = (kpis.margin7d * 100).toFixed(1);
  const marginHealthy = kpis.margin7d >= 0.4;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
            <TrendingUp size={22} style={{ color: "var(--antojo)" }} /> Ganancias de plataforma
          </h1>
          <p className="text-sm text-muted-foreground">Business intelligence global</p>
        </div>
        {audit && (
          <Badge className={cn("text-white", marginHealthy ? "" : "bg-red-500")} style={{ background: marginHealthy ? "var(--lima)" : "var(--antojo)" }}>
            {marginHealthy ? "● Bonos activos" : "⚠ Bonos pausados"}
          </Badge>
        )}
      </div>

      {/* ─── KPI cards macro ─── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MacroCard label="Comisión retenida 7d" value={copShort(kpis.comisionTotal7d)} icon={DollarSign} color="var(--lima)" sub={`Hoy: ${copShort(kpis.comisionToday)}`} />
        <MacroCard label="GMV 7d" value={copShort(kpis.gmv7d)} icon={Store} color="var(--antojo)" sub={`Hoy: ${copShort(kpis.gmvToday)}`} />
        <MacroCard label="Bonos domiciliarios" value={copShort(kpis.bonusesPaid7d)} icon={Bike} color="var(--mango)" sub={`Hoy: ${copShort(kpis.bonusesPaidToday)}`} />
        <MacroCard label="Margen neto" value={`${marginPct}%`} icon={Percent} color={marginHealthy ? "var(--lima)" : "var(--antojo)"} sub={marginHealthy ? "Saludable ≥40%" : "Crítico <40%"} highlight />
      </div>

      {/* ─── Gráfico: Comisión vs Bonos vs Neto (7 días) ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><TrendingUp size={16} style={{ color: "var(--antojo)" }} /> Comisión vs Bonos vs Neto (7 días)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie7d}>
              <defs>
                <linearGradient id="comision" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lima)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--lima)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="neto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--antojo)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--antojo)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => copShort(v as number).replace("$ ", "")} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: any) => cop(v as number)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="comision" name="Comisión" stroke="var(--lima)" strokeWidth={2.5} fill="url(#comision)" />
              <Area type="monotone" dataKey="bonos" name="Bonos" stroke="var(--mango)" strokeWidth={2} fill="none" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="neto" name="Neto" stroke="var(--antojo)" strokeWidth={2.5} fill="url(#neto)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border/40 pt-3 text-center">
          <div><p className="text-[11px] text-muted-foreground">Neto 7d</p><p className="font-bold" style={{ color: "var(--antojo)" }}>{copShort(kpis.neto7d)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Órdenes 7d</p><p className="font-bold">{kpis.ordenes7d}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Órdenes hoy</p><p className="font-bold">{kpis.ordenesHoy}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Drivers hoy</p><p className="font-bold">{kpis.driversActiveToday}</p></div>
        </div>
      </Card>

      {/* ─── Top 5 restaurantes por comisión ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Award size={16} style={{ color: "var(--mango)" }} /> Top 5 restaurantes por comisión generada</h3>
        {top5.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay datos suficientes.</p>
        ) : (
          <div className="space-y-2">
            {top5.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <img src={r.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.cuisine} · {r.ordenes} órdenes · GMV {copShort(r.gmv)}</p>
                </div>
                {/* Barra de progreso visual */}
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${(r.comision / top5[0].comision) * 100}%`, background: "var(--lima)" }} />
                  </div>
                </div>
                <span className="w-20 text-right text-sm font-bold" style={{ color: "var(--lima)" }}>{copShort(r.comision)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Transacciones globales recientes ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Receipt size={16} /> Transacciones globales recientes</h3>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay transacciones.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-2.5 py-2 text-xs">
                <span className="font-mono font-semibold">{t.code}</span>
                <span className="flex-1 truncate text-muted-foreground">{t.restaurant} · {timeAgo(t.at)}</span>
                <span className="text-muted-foreground">Bruto: {copShort(t.bruto)}</span>
                <span className="text-muted-foreground">Com: {copShort(t.comision)}</span>
                <span className="w-20 text-right font-bold" style={{ color: "var(--antojo)" }}>{copShort(t.neto)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function MacroCard({ label, value, icon: Icon, color, sub, highlight }: { label: string; value: string; icon: any; color: string; sub?: string; highlight?: boolean }) {
  return (
    <Card className="p-3.5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon size={16} style={{ color }} /></div>
      </div>
      <p className={cn("mt-2 font-display font-extrabold leading-none", highlight ? "text-xl" : "text-lg")} style={highlight ? { color } : undefined}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] font-semibold" style={{ color }}>{sub}</p>}
    </Card>
  );
}

"use client";

import { useAdminProfitability } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, Bike, CreditCard, Gift, Crown, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, Megaphone } from "lucide-react";
import { cop, copShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";

export function ProfitabilityView() {
  const { data, isLoading } = useAdminProfitability();

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { revenue, costs, neto7d, margin7d, serie7d, perOrder, sustainability } = data;
  const marginPct = (margin7d * 100).toFixed(1);
  const marginHealthy = margin7d >= 0.40;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
            <Percent size={22} style={{ color: "var(--antojo)" }} /> Rentabilidad
          </h1>
          <p className="text-sm text-muted-foreground">Ingresos por stream vs costos operativos</p>
        </div>
        <Badge className="text-white" style={{ background: marginHealthy ? "var(--lima)" : "var(--antojo)" }}>
          Margen {marginPct}%
        </Badge>
      </div>

      {/* ─── KPI cards: Ingreso neto + margen ─── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="p-3.5 shadow-soft">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><ArrowUpRight size={16} style={{ color: "var(--lima)" }} /></div>
          <p className="mt-2 font-display text-lg font-extrabold" style={{ color: "var(--lima)" }}>{copShort(revenue.total7d)}</p>
          <p className="text-[11px] text-muted-foreground">Ingresos 7 días</p>
        </Card>
        <Card className="p-3.5 shadow-soft">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><ArrowDownRight size={16} style={{ color: "var(--antojo)" }} /></div>
          <p className="mt-2 font-display text-lg font-extrabold" style={{ color: "var(--antojo)" }}>{copShort(costs.gateway + costs.driverBasePay + costs.bonuses + costs.promosSubsidized)}</p>
          <p className="text-[11px] text-muted-foreground">Costos 7 días</p>
        </Card>
        <Card className="p-3.5 shadow-soft">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><DollarSign size={16} style={{ color: marginHealthy ? "var(--lima)" : "var(--antojo)" }} /></div>
          <p className="mt-2 font-display text-lg font-extrabold">{copShort(neto7d)}</p>
          <p className="text-[11px] text-muted-foreground">Neto 7 días</p>
        </Card>
        <Card className="p-3.5 shadow-soft">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Percent size={16} style={{ color: marginHealthy ? "var(--lima)" : "var(--antojo)" }} /></div>
          <p className="mt-2 font-display text-lg font-extrabold" style={{ color: marginHealthy ? "var(--lima)" : "var(--antojo)" }}>{marginPct}%</p>
          <p className="text-[11px] text-muted-foreground">Margen neto</p>
        </Card>
      </div>

      {/* ─── Streams de ingreso vs Costos (gráfico de barras apiladas) ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><TrendingUp size={16} /> Ingresos vs Costos (7 días)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie7d}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => copShort(v as number).replace("$ ", "")} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: any) => cop(v as number)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="comision" name="Comisión" stackId="ingresos" fill="var(--lima)" />
              <Bar dataKey="serviceFee" name="Service Fee" stackId="ingresos" fill="var(--mango)" />
              <Bar dataKey="envios" name="Envíos" stackId="ingresos" fill="var(--mora)" />
              <Bar dataKey="gateway" name="Gateway" stackId="costos" fill="var(--cafe)" />
              <Bar dataKey="bonos" name="Bonos" stackId="costos" fill="var(--antojo)" />
              <Bar dataKey="driverPay" name="Pago driver" stackId="costos" fill="oklch(0.6 0.1 50)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ─── Streams de ingreso detallados ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold" style={{ color: "var(--lima)" }}><ArrowUpRight size={16} /> Streams de Ingreso</h3>
          <div className="space-y-2">
            <StreamRow icon={DollarSign} color="var(--lima)" label="Comisiones retenidas" value={cop(revenue.streams.commission)} sub="Por plan de Ads + PYMES" />
            <StreamRow icon={Percent} color="var(--mango)" label="Service fee (8%)" value={cop(revenue.streams.serviceFee)} sub="Cobrado al cliente" />
            <StreamRow icon={Bike} color="var(--mora)" label="Envíos cobrados" value={cop(revenue.streams.deliveryFee)} sub="Cobrado al cliente" />
            <StreamRow icon={Crown} color="var(--mango)" label="Suscripciones Prime" value={cop(revenue.streams.primeSubscriptions)} sub={`${sustainability.primeSubscribers} suscriptores/mes`} />
            <StreamRow icon={Megaphone} color="var(--antojo)" label="Patrocinios Ads" value={cop(revenue.streams.ads)} sub={`${sustainability.proRestaurants} Pro + ${sustainability.premiumRestaurants} Premium`} />
            <div className="mt-2 flex justify-between border-t border-border/40 pt-2 text-sm font-bold">
              <span>Total proyección mensual</span>
              <span style={{ color: "var(--lima)" }}>{copShort(revenue.totalMonthly)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold" style={{ color: "var(--antojo)" }}><ArrowDownRight size={16} /> Costos Operativos</h3>
          <div className="space-y-2">
            <StreamRow icon={Bike} color="var(--cafe)" label="Pago base domiciliarios" value={cop(costs.driverBasePay)} sub="$4.500 por entrega" />
            <StreamRow icon={Gift} color="var(--antojo)" label="Bonos domiciliarios" value={cop(costs.bonuses)} sub="Gamificación 5/10/15" />
            <StreamRow icon={CreditCard} color="var(--cafe)" label="Gateway de pagos" value={cop(costs.gateway)} sub="2.9% + $900 por transacción" />
            <StreamRow icon={Gift} color="var(--antojo)" label="Promos subsidiadas" value={cop(costs.promosSubsidized)} sub="Financiadas por Antojo" />
            <div className="mt-2 flex justify-between border-t border-border/40 pt-2 text-sm font-bold">
              <span>Total costos 7d</span>
              <span style={{ color: "var(--antojo)" }}>{copShort(costs.gateway + costs.driverBasePay + costs.bonuses + costs.promosSubsidized)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─── Margen neto por pedido ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><TrendingUp size={16} /> Margen neto por pedido (recientes)</h3>
        {perOrder.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay pedidos entregados para auditar.</p>
        ) : (
          <div className="space-y-1.5">
            {perOrder.map((o: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-2.5 py-2 text-xs">
                <span className="font-mono font-semibold">{o.code}</span>
                <span className="flex-1 truncate text-muted-foreground">{o.restaurant}</span>
                <span className="text-muted-foreground">Com: {copShort(o.commission)}</span>
                <span className="text-muted-foreground">GW: {copShort(o.gateway)}</span>
                <span className="w-20 text-right font-bold" style={{ color: o.margin >= 0.4 ? "var(--lima)" : "var(--antojo)" }}>{copShort(o.net)}</span>
                <span className="w-12 text-right text-[10px] font-bold" style={{ color: o.margin >= 0.4 ? "var(--lima)" : "var(--antojo)" }}>{(o.margin * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Sostenibilidad ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold">🛡️ Sostenibilidad</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <Crown size={18} className="mx-auto mb-1" style={{ color: "var(--mango)" }} />
            <p className="font-display text-lg font-extrabold">{sustainability.primeSubscribers}</p>
            <p className="text-[10px] text-muted-foreground">Prime subs</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <DollarSign size={18} className="mx-auto mb-1" style={{ color: "var(--lima)" }} />
            <p className="font-display text-lg font-extrabold">{cop(sustainability.primeMin)}</p>
            <p className="text-[10px] text-muted-foreground">Mínimo Prime envío gratis</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <Megaphone size={18} className="mx-auto mb-1" style={{ color: "var(--mora)" }} />
            <p className="font-display text-lg font-extrabold">{sustainability.proRestaurants}</p>
            <p className="text-[10px] text-muted-foreground">Plan Pro</p>
          </div>
          <div className="rounded-xl bg-secondary/40 p-3 text-center">
            <Megaphone size={18} className="mx-auto mb-1" style={{ color: "var(--antojo)" }} />
            <p className="font-display text-lg font-extrabold">{sustainability.premiumRestaurants}</p>
            <p className="text-[10px] text-muted-foreground">Plan Premium</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StreamRow({ icon: Icon, color, label, value, sub }: { icon: any; color: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `oklch(from ${color} l c h / 0.12)` }}><Icon size={14} style={{ color }} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}

"use client";

import { useRestaurantEarnings } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Crown, Clock, Receipt, CreditCard, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cop, copShort, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

export function EarningsView() {
  const { data, isLoading } = useRestaurantEarnings();

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const { kpis, serie7d, plan, pyme, recent, costBreakdown } = data;
  const promoActive = pyme.active;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <Wallet size={22} style={{ color: "var(--mora)" }} /> Ganancias
        </h1>
        <p className="text-sm text-muted-foreground">Tu panorama financiero en tiempo real</p>
      </div>

      {/* ─── KPI cards (altamente escaneables) ─── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <EarningsCard label="Ingreso bruto hoy" value={cop(kpis.brutoHoy)} icon={DollarSign} color="var(--lima)" sub={`${kpis.ordenesHoy} órdenes`} />
        <EarningsCard label="Neto a pagar (liquidación)" value={cop(kpis.netoHoy)} icon={Wallet} color="var(--antojo)" sub="Bruto - comisión - pasarela - promos" />
        <EarningsCard label="Comisión Antojo" value={cop(kpis.comisionHoy)} icon={ArrowDownRight} color="var(--mora)" sub={costBreakdown.commissionLabel} />
        <EarningsCard label="Costo pasarela" value={cop(kpis.gatewayHoy)} icon={CreditCard} color="var(--cafe)" sub={`${(costBreakdown.gatewayRate * 100).toFixed(1)}% + ${cop(costBreakdown.gatewayFixed)}`} />
      </div>

      {/* ─── Plan de Ads + Promo PYMES ─── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Plan Ads */}
        <Card className="p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-display font-bold"><Crown size={16} style={{ color: "var(--mango)" }} /> Plan Antojo Ads</h3>
            <Badge className="capitalize text-white" style={{ background: plan.adsPlan === "premium" ? "var(--mora)" : plan.adsPlan === "pro" ? "var(--antojo)" : "var(--muted-foreground)" }}>{plan.adsPlan}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Comisión actual</span><span className="font-bold">{costBreakdown.commissionLabel}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Posts patrocinados usados</span><span className="font-bold">{plan.sponsoredUsed}</span></div>
            {plan.adsRenewsAt && <div className="flex justify-between"><span className="text-muted-foreground">Renueva</span><span className="font-semibold">{timeAgo(plan.adsRenewsAt)}</span></div>}
          </div>
        </Card>

        {/* Promo PYMES */}
        <Card className={cn("p-4 shadow-soft", promoActive && "ring-1")} style={promoActive ? { borderColor: "var(--lima)" } : undefined}>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-display font-bold"><Clock size={16} style={{ color: promoActive ? "var(--lima)" : "var(--muted-foreground)" }} /> Promo PYMES</h3>
            <Badge style={promoActive ? { background: "var(--lima)", color: "white" } : { background: "var(--muted)" }}>{promoActive ? "Activa" : "Inactiva"}</Badge>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            {promoActive ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Días restantes</span><span className="font-display text-2xl font-black" style={{ color: "var(--lima)" }}>{pyme.daysLeft}</span></div>
                <p className="text-[11px] text-muted-foreground">Publica 1 post/semana en Comunidad para mantener el beneficio (0% comisión)</p>
                {pyme.lastPostAt && <div className="flex justify-between"><span className="text-muted-foreground">Último post</span><span className="font-semibold">{timeAgo(pyme.lastPostAt)}</span></div>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tu promo PYMES ha terminado. Mejora tu plan para reducir comisión.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Gráfico de área: Bruto vs Neto (7 días) ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><TrendingUp size={16} style={{ color: "var(--mora)" }} /> Ingresos Bruto vs Neto (7 días)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie7d}>
              <defs>
                <linearGradient id="bruto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--mora)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--mora)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="neto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lima)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--lima)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => copShort(v as number).replace("$ ", "")} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: any) => cop(v as number)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="bruto" name="Bruto" stroke="var(--mora)" strokeWidth={2.5} fill="url(#bruto)" />
              <Area type="monotone" dataKey="neto" name="Neto" stroke="var(--lima)" strokeWidth={2.5} fill="url(#neto)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Resumen 7 días */}
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center">
          <div><p className="text-[11px] text-muted-foreground">Bruto 7d</p><p className="font-bold">{copShort(kpis.bruto7d)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Neto 7d</p><p className="font-bold" style={{ color: "var(--lima)" }}>{copShort(kpis.neto7d)}</p></div>
          <div><p className="text-[11px] text-muted-foreground">Comisión 7d</p><p className="font-bold" style={{ color: "var(--mora)" }}>{copShort(kpis.comision7d)}</p></div>
        </div>
      </Card>

      {/* ─── Transacciones recientes ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Receipt size={16} /> Transacciones recientes</h3>
        {recent.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aún no hay transacciones. Los pedidos entregados aparecerán aquí.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-2.5 py-2 text-xs">
                <span className="font-mono font-semibold">{t.code}</span>
                <span className="flex-1 text-muted-foreground">{t.paymentMethod} · {timeAgo(t.at)}</span>
                <span className="text-muted-foreground">Bruto: {copShort(t.bruto)}</span>
                <span className="text-muted-foreground">Com: {copShort(t.comision)}</span>
                <span className="w-20 text-right font-bold" style={{ color: "var(--lima)" }}>{copShort(t.neto)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Desglose de costos (transparencia) ─── */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><CreditCard size={16} /> Desglose de liquidación</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5">
            <div><p className="font-semibold">Comisión Antojo</p><p className="text-[11px] text-muted-foreground">Ingreso de la plataforma (18% o 0% si PYME)</p></div>
            <span className="font-bold" style={{ color: "var(--mora)" }}>{costBreakdown.commissionLabel}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5">
            <div><p className="font-semibold">Tarifa pasarela de pagos</p><p className="text-[11px] text-muted-foreground">MercadoPago / Wompi (2.9% + $900)</p></div>
            <span className="font-bold" style={{ color: "var(--cafe)" }}>{(costBreakdown.gatewayRate * 100).toFixed(1)}% + {cop(costBreakdown.gatewayFixed)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5">
            <div><p className="font-semibold">Promos financiadas por ti</p><p className="text-[11px] text-muted-foreground">Descuentos % que tú ofreces</p></div>
            <span className="font-bold" style={{ color: "var(--antojo)" }}>{cop(kpis.promosRestauranteHoy ?? 0)} hoy</span>
          </div>
          <div className="rounded-lg p-2.5 text-[11px] text-muted-foreground" style={{ background: "oklch(0.72 0.17 145 / 0.06)" }}>
            <p className="font-semibold" style={{ color: "var(--lima)" }}>Fórmula de liquidación:</p>
            <p>Neto a pagar = Ventas Brutas − Comisión Antojo − Costo Pasarela − Promos financiadas por ti</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EarningsCard({ label, value, icon: Icon, color, sub }: { label: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <Card className="p-3.5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon size={16} style={{ color }} /></div>
      </div>
      <p className="mt-2 font-display text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] font-semibold" style={{ color }}>{sub}</p>}
    </Card>
  );
}

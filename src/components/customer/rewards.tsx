"use client";

import { useLoyalty, useCustomer, useRedeemReward, useMyCoupons } from "@/hooks/use-data";
import { REWARDS_CATALOG } from "@/lib/rewards";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TIER_INFO } from "@/lib/types";
import { Crown, Flame, TrendingUp, Gift, Sparkles, Check, Copy, Ticket, Bike, Banknote } from "lucide-react";
import { cop } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tierColors: Record<string, string> = {
  Bronce: "var(--cafe)", Plata: "var(--muted-foreground)", Oro: "var(--mango)", Platino: "var(--mora)",
};

export function Rewards() {
  const { data, isLoading } = useLoyalty();
  const redeemMut = useRedeemReward();
  const { data: couponsData } = useMyCoupons();

  if (isLoading || !data) return <div className="px-3 pt-4 space-y-3 sm:px-5 lg:px-0">{[0,1,2].map(i=><Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  const l = data;
  const tiers = Object.entries(TIER_INFO);
  const curIdx = tiers.findIndex(([t]) => t === l.tier);
  const next = tiers[curIdx + 1];
  const progress = next ? Math.min(100, (l.coins / next[1].min) * 100) : 100;
  const coupons = couponsData?.coupons ?? [];

  const handleRedeem = async (rewardId: string, title: string) => {
    try {
      const result = await redeemMut.mutateAsync(rewardId);
      if (result.primeActivated) {
        toast.success(`¡${title} canjeado! Prime activado por 1 mes 👑🎉`);
      } else {
        toast.success(`¡${title} canjeado! Cupón: ${result.coupon.code} 🎫`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo canjear");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Cupón ${code} copiado 📋`);
  };

  return (
    <div className="px-3 pt-4 space-y-5 sm:px-5 lg:px-0">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Recompensas</h1>

      {/* Coins + tier card */}
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${tierColors[l.tier]}, oklch(0.3 0.02 50))` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Tus Antojo Coins</p>
              <p className="font-display text-4xl font-black">{l.coins.toLocaleString("es-CO")}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-bold"><Crown size={14} /> {l.tier}</span>
              <p className="mt-1 flex items-center gap-1 text-xs"><Flame size={12} /> Racha de {l.streakDays} días <Flame size={12} className="inline" style={{ color: "var(--antojo)" }} /></p>
            </div>
          </div>
        </div>
        <div className="p-4">
          {next ? (
            <>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold">Progreso a {next[0]}</span>
                <span className="text-muted-foreground">{l.coins}/{next[1].min}</span>
              </div>
              <Progress value={progress} className="h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">Te faltan <b>{next[1].min - l.coins}</b> coins para subir a {next[0]}. Beneficio: {next[1].perk}</p>
            </>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "var(--mora)" }}><Crown size={14} className="inline" style={{ color: "var(--mora)" }} /> ¡Estás en el tier máximo! Disfrutas de {TIER_INFO[l.tier].perk}</p>
          )}
        </div>
      </Card>

      {/* Tier ladder */}
      <section>
        <h2 className="mb-2 font-display font-bold">Niveles</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiers.map(([name, info], i) => {
            const reached = i <= curIdx;
            return (
              <Card key={name} className={cn("p-3 text-center shadow-soft", reached && "ring-2")} style={reached ? { borderColor: tierColors[name] } : undefined}>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: tierColors[name] }}><Crown size={16} /></div>
                <p className="mt-1.5 font-display font-bold text-sm">{name}</p>
                <p className="text-[10px] text-muted-foreground">{info.min}+ coins</p>
                {reached && <Check size={14} className="mx-auto mt-1" style={{ color: tierColors[name] }} />}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Challenges */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Sparkles size={16} style={{ color: "var(--lima)" }} /> Retos de la semana</h2>
        <div className="space-y-2">
          {l.challenges.map((c: any) => (
            <Card key={c.id} className="flex items-center gap-3 p-3 shadow-soft">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{c.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="text-[11px] text-muted-foreground">{c.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={(c.progress / c.goal) * 100} className="h-1.5 flex-1" />
                  <span className="text-[11px] font-semibold tabular-nums">{c.progress}/{c.goal}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: "var(--mango)" }}>+{c.reward}</p>
                <p className="text-[10px] text-muted-foreground">coins</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Mis Cupones (canjeados con coins) ─── */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Ticket size={16} style={{ color: "var(--mora)" }} /> Mis cupones</h2>
        {coupons.length === 0 ? (
          <Card className="p-4 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Aún no tienes cupones canjeados. ¡Canjea tus coins abajo! 👇</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {coupons.map((c: any) => (
              <Card key={c.id} className={cn("flex items-center gap-3 p-3 shadow-soft", c.used && "opacity-50")}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">
                  {c.type === "free_delivery" ? <Bike size={18} /> : c.type === "fixed" ? <Banknote size={18} /> : <Ticket size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
                </div>
                {c.used ? (
                  <Badge className="bg-muted text-muted-foreground">Usado</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={() => copyCode(c.code)}>
                    <Copy size={12} /> Copiar
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── Canjear recompensas ─── */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Gift size={16} style={{ color: "var(--antojo)" }} /> Canjear recompensas</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REWARDS_CATALOG.map((r) => {
            const can = l.coins >= r.cost;
            return (
              <Card key={r.id} className="flex items-center gap-3 p-3 shadow-soft">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{r.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground">{r.description}</p>
                  <p className="text-xs font-bold" style={{ color: "var(--mango)" }}>{r.cost} coins</p>
                </div>
                <Button
                  size="sm"
                  variant={can ? "default" : "outline"}
                  className="rounded-full"
                  disabled={!can || redeemMut.isPending}
                  style={can ? { background: "var(--antojo)", color: "white" } : undefined}
                  onClick={() => handleRedeem(r.id, r.title)}
                >
                  {redeMutIsPending(redeemMut, r.id) ? "..." : can ? "Canjear" : "Faltan coins"}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// Helper para saber si el botón específico está cargando
function redeMutIsPending(_mut: any, _id: string) {
  return false; // MVP: no tracking por id, el disabled global basta
}

"use client";

import { useCustomer } from "@/hooks/use-data";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Truck, Percent, Headset, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "prime", name: "Antojo Prime", price: 14900, period: "mes", color: "var(--antojo)",
    tagline: "Para los que piden seguido",
    perks: [
      { icon: Truck, text: "Envío gratis en TODOS los pedidos" },
      { icon: Percent, text: "10% off en restaurantes seleccionados" },
      { icon: Zap, text: "Prioridad en horas pico" },
      { icon: Star, text: "2x Antojo Coins siempre" },
    ],
  },
  {
    id: "prime_plus", name: "Prime Plus", price: 24900, period: "mes", color: "var(--mora)",
    tagline: "La experiencia definitiva", popular: true,
    perks: [
      { icon: Truck, text: "Envío gratis + sin costo de servicio" },
      { icon: Percent, text: "15% off + ofertas exclusivas Prime Plus" },
      { icon: Zap, text: "Entrega prioritaria express (20 min)" },
      { icon: Headset, text: "Soporte VIP 24/7 por chat" },
      { icon: Crown, text: "Acceso a menús exclusivos de chefs" },
    ],
  },
];

export function Prime() {
  const { data } = useCustomer();
  const qc = useQueryClient();
  const currentPlan = data?.subscription?.plan ?? "none";

  const subscribe = async (plan: string) => {
    await api.patch("/api/subscription", { plan });
    qc.invalidateQueries({ queryKey: ["customer"] });
    toast.success(`¡Antojo ${plan === "prime_plus" ? "Prime Plus" : "Prime"} activado! 🎉`);
  };

  return (
    <div className="px-3 pt-4 space-y-5 sm:px-5 lg:px-0">
      <div className="overflow-hidden rounded-3xl bg-cafe-gradient p-6 text-white shadow-soft" style={{ background: "linear-gradient(135deg, var(--cafe), #1a1410)" }}>
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "oklch(0.78 0.16 75 / 0.2)" }}><Crown size={28} style={{ color: "var(--mango)" }} /></div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Antojo Prime</h1>
            <p className="text-sm opacity-80">Más antojos, más beneficios, menos espera.</p>
          </div>
        </div>
        {currentPlan !== "none" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm">
            <Check size={16} style={{ color: "var(--mango)" }} /> Tu membresía <b className="ml-1">{currentPlan === "prime_plus" ? "Prime Plus" : "Prime"}</b> está activa
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {PLANS.map((p) => {
          const active = currentPlan === p.id;
          return (
            <Card key={p.id} className={cn("relative overflow-hidden p-5 shadow-soft", p.popular && "ring-2")} style={p.popular ? { borderColor: p.color } : undefined}>
              {p.popular && (
                <span className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: p.color }}>MÁS POPULAR</span>
              )}
              <h3 className="font-display text-xl font-extrabold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="font-display text-3xl font-black">${p.price.toLocaleString("es-CO")}</span>
                <span className="mb-1 text-sm text-muted-foreground">/{p.period}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {p.perks.map((perk, i) => {
                  const Icon = perk.icon;
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Icon size={16} className="mt-0.5 shrink-0" style={{ color: p.color }} />
                      <span>{perk.text}</span>
                    </li>
                  );
                })}
              </ul>
              <Button className="mt-5 w-full rounded-xl py-3" disabled={active}
                style={active ? {} : { background: p.color, color: "white" }}
                variant={active ? "outline" : "default"}
                onClick={() => !active && subscribe(p.id)}>
                {active ? "Plan actual" : `Suscribirme a ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 text-center text-sm text-muted-foreground shadow-soft">
        💡 Ahorro promedio de <b className="text-foreground">$28.000/mes</b> para clientes que piden 3+ veces por semana. Cancela cuando quieras.
      </Card>
    </div>
  );
}

"use client";

import { useApp } from "@/lib/store";
import { useMyOrders } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Price } from "@/components/shared/star-rating";
import { RestaurantCard } from "@/components/shared/restaurant-card";
import { ArrowLeft, RotateCcw, ChevronRight, Receipt, Star, Package } from "lucide-react";
import { timeAgo, dateLabel } from "@/lib/format";
import { useRestaurants } from "@/hooks/use-data";
import type { OrderStatus } from "@/lib/types";

export function Orders() {
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const { data, isLoading } = useMyOrders();
  const orders = data?.orders ?? [];

  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const history = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  return (
    <div className="px-3 pt-4 sm:px-5 lg:px-0">
      <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Mis pedidos</h1>

      {isLoading ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center">
          <Receipt size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">Aún no tienes pedidos</p>
          <Button className="mt-3 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => setCustomerView("discover")}>Hacer mi primer pedido</Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="mb-2 font-display font-bold text-muted-foreground">En curso</h2>
              <div className="space-y-2.5">
                {active.map((o) => (
                  <Card key={o.id} className="cursor-pointer p-3.5 shadow-soft transition hover:shadow-glow" onClick={() => { setActiveOrderId(o.id); setCustomerView("tracking"); }}>
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-2xl"><Package size={24} className="text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-display font-bold">{o.restaurant?.name}</p>
                          <OrderStatusBadge status={o.status as OrderStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">{o.code} · {timeAgo(o.createdAt)}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{o.items.map(i => `${i.qty}× ${i.name}`).join(", ")}</p>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-display font-bold text-muted-foreground">Historial</h2>
            <div className="space-y-2.5">
              {history.map((o) => (
                <Card key={o.id} className="p-3.5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-2xl">{o.items[0]?.emoji ?? "🍽️"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-display font-bold">{o.restaurant?.name}</p>
                        <Price value={o.total} className="font-bold" />
                      </div>
                      <p className="text-xs text-muted-foreground">{dateLabel(o.createdAt)} · {o.code}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        {o.rating ? <span className="flex items-center gap-0.5 text-xs"><Star size={11} style={{ color: "var(--mango)" }} fill="var(--mango)" /> {o.rating}.0</span> : <span className="text-xs text-muted-foreground">Sin calificar</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => { toast("Pedido repetido 🔄"); setCustomerView("discover"); }}>
                      <RotateCcw size={13} /> Repetir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { toast } from "sonner";

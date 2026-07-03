"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useSocket } from "@/components/providers";
import {
  useRestaurantOrders, useUpdateOrderStatus, useAllRestaurants, useToggleMenuItem, useRestaurant, useRegisterRestaurant, useLogout,
} from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, UtensilsCrossed, BarChart3, Tag, Store, Clock, Check, ChefHat, Package,
  TrendingUp, Star, Plus, Flame, ArrowRight, DollarSign, ShoppingBag, LogOut,
} from "lucide-react";
import { cop, copShort, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { BoostView } from "./boost-view";

export function RestaurantApp() {
  const view = useApp((s) => s.restaurantView);
  const [restId, setRestId] = useState<string | undefined>(undefined);
  const { data: allRest } = useAllRestaurants();
  const { data, isLoading } = useRestaurantOrders(restId);

  const restaurant = data?.restaurant;
  const orders = data?.orders ?? [];
  const incoming = orders.filter(o => ["placed","accepted","preparing","ready"].includes(o.status));

  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: "var(--antojo)" }}><Store size={18} /></div>
          <div>
            <h1 className="font-display text-xl font-extrabold tracking-tight">{restaurant?.name ?? "Restaurante"}</h1>
            <p className="text-xs text-muted-foreground">{restaurant?.cuisine} · {restaurant?.neighborhood}</p>
          </div>
        </div>
        <Select value={restId ?? "demo"} onValueChange={(v) => setRestId(v === "demo" ? undefined : v)}>
          <SelectTrigger className="h-9 w-48 rounded-full"><SelectValue placeholder="Cambiar restaurante" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">Automático (con pedidos)</SelectItem>
            {allRest?.restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {view === "orders" && <RestOrders orders={orders} incoming={incoming} isLoading={isLoading} />}
      {view === "menu" && <RestMenu restId={restaurant?.id} />}
      {view === "boost" && <BoostView />}
      {view === "analytics" && <RestAnalytics orders={orders} restaurant={restaurant} />}
      {view === "profile" && <RestProfile restaurant={restaurant} />}
    </div>
  );
}

function RestOrders({ orders, incoming, isLoading }: { orders: Order[]; incoming: Order[]; isLoading: boolean }) {
  const updateStatus = useUpdateOrderStatus();
  const socket = useSocket();
  const advance = async (o: Order) => {
    const flow: OrderStatus[] = ["placed","accepted","preparing","ready","picked_up"];
    const idx = flow.indexOf(o.status as OrderStatus);
    const next = flow[idx + 1];
    if (!next) return;
    await updateStatus.mutateAsync({ orderId: o.id, status: next });
    socket?.emit("order:status", { orderId: o.id, code: o.code, status: next, restaurantId: o.restaurantId });
    toast.success(`Pedido ${o.code} → ${next === "accepted" ? "aceptado" : next === "preparing" ? "en preparación" : next === "ready" ? "listo" : "entregado al domiciliario"}`);
  };

  if (isLoading) return <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <KPI label="Cola activa" value={`${incoming.length}`} icon={Receipt} color="var(--antojo)" />
        <KPI label="Hoy" value={copShort(orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0))} icon={DollarSign} color="var(--lima)" />
        <KPI label="Ticket prom." value={copShort(Math.round(orders.reduce((s,o)=>s+o.total,0) / Math.max(1,orders.length)))} icon={TrendingUp} color="var(--mango)" />
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Flame size={16} style={{ color: "var(--antojo)" }} /> Pedidos entrantes ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground shadow-soft"><Receipt size={28} className="mx-auto mb-2 opacity-50" />No hay pedidos en cola. ¡Todo al día! ✨</Card>
        ) : (
          <div className="space-y-2.5">
            {incoming.map(o => (
              <Card key={o.id} className="p-3.5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold">{o.code}</span>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                      <span className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">📍 {o.address.split(",")[0]} · {o.paymentMethod}</p>
                    <div className="mt-2 space-y-0.5">
                      {o.items.map(it => (
                        <div key={it.id} className="flex items-center gap-2 text-sm">
                          <span className="grid h-6 w-6 place-items-center rounded bg-secondary text-sm">{it.emoji ?? "🍽️"}</span>
                          <span className="font-semibold">{it.qty}×</span>
                          <span>{it.name}</span>
                          {it.notes && <span className="text-xs text-muted-foreground">· {it.notes}</span>}
                        </div>
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm font-bold">{cop(o.total)}</p>
                  </div>
                </div>
                <Button className="mt-2.5 w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }}
                  disabled={updateStatus.isPending} onClick={() => advance(o)}>
                  {o.status === "placed" && <>✓ Aceptar pedido <ArrowRight size={15} /></>}
                  {o.status === "accepted" && <>👨‍🍳 Empezar a preparar <ArrowRight size={15} /></>}
                  {o.status === "preparing" && <>🛍️ Marcar como listo <ArrowRight size={15} /></>}
                  {o.status === "ready" && <>🏍️ Entregar al domiciliario <ArrowRight size={15} /></>}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {orders.filter(o => ["picked_up","en_route","delivered"].includes(o.status)).length > 0 && (
        <section>
          <h2 className="mb-2 font-display font-bold text-muted-foreground">En curso / completados</h2>
          <div className="space-y-2">
            {orders.filter(o => ["picked_up","en_route","delivered"].includes(o.status)).slice(0,8).map(o => (
              <Card key={o.id} className="flex items-center gap-3 p-3 shadow-soft">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-lg">{o.items[0]?.emoji ?? "🍽️"}</div>
                <div className="flex-1"><p className="text-sm font-semibold">{o.code} · {o.items.length} items</p><p className="text-xs text-muted-foreground">{timeAgo(o.createdAt)}</p></div>
                <OrderStatusBadge status={o.status as OrderStatus} />
                <span className="text-sm font-bold">{cop(o.total)}</span>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="p-3 shadow-soft">
      <Icon size={15} style={{ color }} />
      <p className="mt-1 font-display text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}

function RestMenu({ restId }: { restId?: string }) {
  const [cat, setCat] = useState<string>("");
  const { data, isLoading } = useRestaurant(restId ?? null);
  const toggle = useToggleMenuItem();
  const menu = data?.menu ?? {};
  const categories = Object.keys(menu);
  const items = cat ? menu[cat] ?? [] : Object.values(menu).flat();

  if (isLoading) return <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCat("")} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", !cat ? "text-white" : "bg-secondary")}>Todos</button>
        {categories.map(c => <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap", cat === c ? "text-white" : "bg-secondary")} style={cat === c ? { background: "var(--antojo)" } : undefined}>{c}</button>)}
      </div>
      <div className="space-y-2">
        {items.map((m: any) => (
          <Card key={m.id} className="flex items-center gap-3 p-3 shadow-soft">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-2xl">{m.emoji ?? "🍽️"}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{m.name} {m.isPopular && <Badge className="ml-1 h-4 text-[9px]" style={{ background: "var(--antojo)", color: "white" }}>TOP</Badge>}</p>
              <p className="text-xs text-muted-foreground">{m.category} · {cop(m.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-semibold", m.isAvailable ? "" : "text-muted-foreground")}>{m.isAvailable ? "Disponible" : "Agotado"}</span>
              <Switch checked={m.isAvailable} onCheckedChange={(v) => { toggle.mutate({ id: m.id, isAvailable: v }); toast(v ? "Producto disponible" : "Producto marcado como agotado"); }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function RestAnalytics({ orders, restaurant }: { orders: Order[]; restaurant: any }) {
  const delivered = orders.filter(o => o.status === "delivered");
  const salesToday = delivered.reduce((s, o) => s + o.total, 0);
  // popular items
  const itemMap = new Map<string, { count: number; revenue: number; emoji?: string }>();
  for (const o of delivered) for (const it of o.items) {
    const e = itemMap.get(it.name) ?? { count: 0, revenue: 0, emoji: it.emoji ?? undefined };
    e.count += it.qty; e.revenue += it.price * it.qty; e.emoji = it.emoji ?? e.emoji;
    itemMap.set(it.name, e);
  }
  const popular = Array.from(itemMap.entries()).sort((a,b) => b[1].count - a[1].count).slice(0,5);
  const maxCount = popular[0]?.[1].count ?? 1;

  // hourly distribution (mock from createdAt)
  const hours = Array.from({length: 12}, (_, i) => { const h = 10 + i; const c = delivered.filter(o => new Date(o.createdAt).getHours() === h).length; return { h, c }; });
  const maxH = Math.max(1, ...hours.map(x => x.c));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KPI label="Ventas hoy" value={copShort(salesToday)} icon={DollarSign} color="var(--lima)" />
        <KPI label="Pedidos" value={`${delivered.length}`} icon={ShoppingBag} color="var(--antojo)" />
        <KPI label="Rating" value={`${restaurant?.rating ?? 4.7}⭐`} icon={Star} color="var(--mango)" />
        <KPI label="Ticket" value={copShort(Math.round(salesToday / Math.max(1,delivered.length)))} icon={TrendingUp} color="var(--mora)" />
      </div>

      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><BarChart3 size={16} /> Pedidos por hora (hoy)</h3>
        <div className="flex h-28 items-end justify-between gap-1">
          {hours.map(h => (
            <div key={h.h} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t bg-antojo-gradient" style={{ height: `${(h.c/maxH)*100}%`, minHeight: 2 }} />
              <span className="text-[9px] text-muted-foreground">{h.h}h</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Flame size={16} style={{ color: "var(--antojo)" }} /> Platos más vendidos</h3>
        {popular.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay datos suficientes.</p> : (
          <div className="space-y-2">
            {popular.map(([name, info], i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-muted-foreground">{i+1}</span>
                <span className="text-xl">{info.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm"><span className="font-semibold">{name}</span><span className="text-muted-foreground">{info.count} pedidos</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${(info.count/maxCount)*100}%`, background: "var(--antojo)" }} /></div>
                </div>
                <span className="text-sm font-bold">{copShort(info.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function RestPromos({ restaurant }: { restaurant: any }) {
  const promos = [
    { code: restaurant?.promo ? "ACTUAL" : "—", title: restaurant?.promo ?? "Sin promo activa", desc: "Promoción destacada en la app", active: !!restaurant?.promo },
    { code: "ALMUERZO20", title: "20% off almuerzos", desc: "Lun-Vie antes de 2pm", active: true },
    { code: "DOMINGO2x1", title: "2x1 domingos", desc: "Todo el día los domingos", active: false },
  ];
  return (
    <div className="space-y-3">
      <Button className="w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }} onClick={() => toast("Crea una nueva promoción 🎯")}><Plus size={16} /> Crear promoción</Button>
      {promos.map((p, i) => (
        <Card key={i} className="flex items-center gap-3 p-3.5 shadow-soft">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: p.active ? "var(--antojo)" : "var(--muted-foreground)" }}><Tag size={16} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{p.title}</p>
            <p className="text-xs text-muted-foreground">{p.desc}</p>
          </div>
          <Switch defaultChecked={p.active} onCheckedChange={() => toast("Promoción actualizada")} />
        </Card>
      ))}
    </div>
  );
}

function RestProfile({ restaurant }: { restaurant: any }) {
  const authUser = useApp((s) => s.authUser);
  const logout = useApp((s) => s.logout);
  const logoutMut = useLogout();
  const registerMut = useRegisterRestaurant();
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const submit = async () => {
    if (!name || !cuisine) { toast.error("Nombre y cocina son requeridos"); return; }
    try { await registerMut.mutateAsync({ name, cuisine, neighborhood, phone, description }); toast.success("¡Solicitud enviada! Un administrador la revisará 🎉"); setName(""); setCuisine(""); setNeighborhood(""); setPhone(""); setDescription(""); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleLogout = async () => { try { await logoutMut.mutateAsync(); } catch {} logout(); toast("Sesión cerrada 👋"); };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="h-20" style={{ background: "linear-gradient(135deg, var(--mora), oklch(0.4 0.15 320))" }} />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl text-white text-xl font-bold ring-4 ring-card" style={{ background: "var(--mora)" }}>
              {authUser?.name?.split(" ").slice(0,2).map((n) => n[0]).join("") ?? "SR"}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="font-display text-xl font-extrabold">{restaurant?.name ?? authUser?.name}</h1>
              <p className="text-sm text-muted-foreground">{authUser?.email}</p>
            </div>
            {restaurant?.isApproved ? (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: "var(--lima)" }}>✓ Activo</span>
            ) : restaurant ? (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">En revisión</span>
            ) : null}
          </div>
        </div>
      </Card>

      {!restaurant && (
        <Card className="p-4 shadow-soft">
          <h3 className="mb-1 font-display font-bold">Registra tu restaurante</h3>
          <p className="mb-3 text-xs text-muted-foreground">Completa tu información para unirte a Antojo.</p>
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del restaurante" className="h-10 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm outline-none" />
            <input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="Tipo de cocina (Ej: Hamburguesas)" className="h-10 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm outline-none" />
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Barrio (Ej: Zona G)" className="h-10 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm outline-none" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" className="h-10 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm outline-none" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve" className="w-full resize-none rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm outline-none" rows={2} />
            <Button className="w-full rounded-xl" style={{ background: "var(--mora)", color: "white" }} disabled={registerMut.isPending} onClick={submit}>
              {registerMut.isPending ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </div>
        </Card>
      )}

      {restaurant && (
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 font-display font-bold">Información del negocio</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cocina</span><span className="font-semibold">{restaurant.cuisine}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Barrio</span><span className="font-semibold">{restaurant.neighborhood}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold">⭐ {restaurant.rating}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span className="font-semibold">{cop(restaurant.deliveryFee)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span className="font-semibold">{restaurant.isOpen ? "Abierto" : "Cerrado"}</span></div>
          </div>
        </Card>
      )}

      <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</Button>
    </div>
  );
}

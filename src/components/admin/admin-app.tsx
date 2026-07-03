"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAdminStats, useAdminOrders, useAdminDrivers, useAllRestaurants, useAdminUsers, useApprove } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard, Receipt, Store, Bike, TrendingUp, Tag, DollarSign, Users, ShoppingBag,
  Activity, ArrowUpRight, Star, Plus, Settings,
} from "lucide-react";
import { cop, copShort, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { toast } from "sonner";

const PIE_COLORS = ["var(--antojo)", "var(--mango)", "var(--lima)", "var(--mora)", "var(--cafe)"];

export function AdminApp() {
  const view = useApp((s) => s.adminView);
  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0">
      {view === "overview" && <Overview />}
      {view === "orders" && <AllOrders />}
      {view === "restaurants" && <ManageRestaurants />}
      {view === "drivers" && <ManageDrivers />}
      {view === "users" && <ManageUsers />}
      {view === "revenue" && <Revenue />}
      {view === "promos" && <AdminPromos />}
    </div>
  );
}

function Overview() {
  const { data, isLoading } = useAdminStats();
  if (isLoading || !data) return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[0,1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  const k = data.kpis;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Resumen general</h1>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KPICard label="GMV total" value={copShort(k.gmv)} icon={DollarSign} color="var(--lima)" delta="+18%" />
        <KPICard label="Pedidos" value={`${k.totalOrders}`} icon={ShoppingBag} color="var(--antojo)" delta="+12%" />
        <KPICard label="Activos ahora" value={`${k.activeOrders}`} icon={Activity} color="var(--mango)" pulse />
        <KPICard label="Clientes" value={`${k.customers}`} icon={Users} color="var(--mora)" delta="+8%" />
        <KPICard label="Restaurantes" value={`${k.restaurants}`} icon={Store} color="var(--cafe)" />
        <KPICard label="Domiciliarios" value={`${k.drivers}`} icon={Bike} color="var(--lima)" sub={`${k.onlineDrivers} en línea`} />
        <KPICard label="Ticket prom." value={copShort(k.avgTicket)} icon={TrendingUp} color="var(--antojo)" />
        <KPICard label="Promos activas" value={`${k.promosActive}`} icon={Tag} color="var(--mango)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Revenue 7d */}
        <Card className="p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 font-display font-bold"><TrendingUp size={16} style={{ color: "var(--lima)" }} /> Ingresos últimos 7 días</h3>
            <Badge className="bg-lima/15" style={{ color: "var(--lima)" }}>+24% vs sem. anterior</Badge>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue7d}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--antojo)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--antojo)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: any) => cop(v as number)} />
                <Area type="monotone" dataKey="value" stroke="var(--antojo)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Cuisine mix */}
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 font-display font-bold">Mix de cocinas</h3>
          <div className="flex items-center gap-3">
            <div className="h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.cuisineMix} dataKey="value" nameKey="name" innerRadius={32} outerRadius={58} paddingAngle={2}>
                    {data.cuisineMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {data.cuisineMix.slice(0,6).map((c: any, i: number) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-semibold">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top restaurants */}
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Star size={16} style={{ color: "var(--mango)" }} /> Top restaurantes por GMV</h3>
          <div className="space-y-2">
            {data.topRestaurants.map((r: any, i: number) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-muted-foreground">{i+1}</span>
                <img src={r.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                <div className="flex-1"><p className="text-sm font-semibold">{r.name}</p><p className="text-[11px] text-muted-foreground">{r.cuisine} · ⭐{r.rating}</p></div>
                <span className="text-sm font-bold">{copShort(r.gmv)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live feed */}
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Activity size={16} style={{ color: "var(--antojo)" }} /> Pedidos en vivo <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-green-500" /></h3>
          <div className="max-h-64 space-y-1.5 overflow-y-auto scrollbar-thin">
            {data.recentOrders.map((o: Order) => (
              <div key={o.id} className="flex items-center gap-2 rounded-lg bg-secondary/40 px-2.5 py-1.5 text-xs">
                <span className="font-mono font-semibold">{o.code}</span>
                <span className="flex-1 truncate text-muted-foreground">{o.restaurant?.name}</span>
                <OrderStatusBadge status={o.status as OrderStatus} />
                <span className="font-bold">{copShort(o.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, color, delta, sub, pulse }: { label: string; value: string; icon: any; color: string; delta?: string; sub?: string; pulse?: boolean }) {
  return (
    <Card className="p-3.5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon size={16} style={{ color }} /></div>
        {delta && <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: "var(--lima)" }}><ArrowUpRight size={11} />{delta}</span>}
        {pulse && <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />}
      </div>
      <p className="mt-2 font-display text-xl font-extrabold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {sub && <p className="text-[10px] font-semibold" style={{ color }}>{sub}</p>}
    </Card>
  );
}

function AllOrders() {
  const { data, isLoading } = useAdminOrders();
  const orders = data?.orders ?? [];
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Todos los pedidos</h1>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {(["all","placed","preparing","en_route","delivered"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap", filter === f ? "text-white" : "bg-secondary")} style={filter === f ? { background: "var(--antojo)" } : undefined}>
            {f === "all" ? "Todos" : f === "placed" ? "Confirmados" : f === "preparing" ? "Preparando" : f === "en_route" ? "En ruta" : "Entregados"}
          </button>
        ))}
      </div>
      {isLoading ? <div className="space-y-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div> : (
        <div className="space-y-1.5">
          {filtered.map(o => (
            <Card key={o.id} className="flex items-center gap-3 p-3 shadow-soft">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-lg">{o.items[0]?.emoji ?? "🍽️"}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{o.code} · {o.restaurant?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{o.address.split(",")[0]} · {timeAgo(o.createdAt)}</p>
              </div>
              <OrderStatusBadge status={o.status as OrderStatus} />
              <span className="text-sm font-bold">{cop(o.total)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageRestaurants() {
  const { data, isLoading } = useAllRestaurants();
  const approve = useApprove();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Restaurantes</h1>
        <Button size="sm" className="rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => toast("Invitar restaurante")}><Plus size={14} /> Invitar</Button>
      </div>
      <div className="space-y-2">
        {(data?.restaurants ?? []).map(r => (
          <Card key={r.id} className="flex items-center gap-3 p-3 shadow-soft">
            <img src={r.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{r.name}</p>
              <p className="truncate text-xs text-muted-foreground">{r.cuisine} · {r.neighborhood} · {r.orders} pedidos</p>
            </div>
            <div className="flex items-center gap-1 text-xs"><Star size={12} style={{ color: "var(--mango)" }} fill="var(--mango)" />{r.rating}</div>
            <Badge className={r.isOpen ? "bg-lima/15" : "bg-muted"} style={r.isOpen ? { color: "var(--lima)" } : { color: "var(--muted-foreground)" }}>{r.isOpen ? "Abierto" : "Cerrado"}</Badge>
            {r.promo && <Badge className="bg-mango/15" style={{ color: "var(--mango)" }}>🔥</Badge>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Settings size={14} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast(`Suspendiendo ${r.name}…`)}>Suspender</DropdownMenuItem>
                <DropdownMenuItem onClick={() => approve.mutate({ type: "restaurant", id: r.id, approve: !r.isOpen })}>{r.isOpen ? "Cerrar" : "Activar"}</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => toast("Restaurante eliminado")}>Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ManageDrivers() {
  const { data, isLoading } = useAdminDrivers();
  const approve = useApprove();
  return (
    <div className="space-y-3">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Domiciliarios</h1>
      <div className="space-y-2">
        {(data?.drivers ?? []).map(d => (
          <Card key={d.id} className="flex items-center gap-3 p-3 shadow-soft">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-full text-white font-bold" style={{ background: `var(--${d.avatarColor})` }}>{d.name.split(" ").slice(0,2).map(n=>n[0]).join("")}</div>
              <span className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card", d.isOnline ? "bg-green-500" : "bg-muted-foreground")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{d.name}</p>
              <p className="truncate text-xs text-muted-foreground">🏍️ {d.vehicle} · {d.totalDeliveries} entregas · ⭐{d.rating}</p>
            </div>
            {d.isVerified ? (
              <Badge className="bg-lima/15" style={{ color: "var(--lima)" }}>✓ Verificado</Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-600">Pendiente</Badge>
            )}
            <div className="text-right">
              <p className="text-sm font-bold" style={{ color: "var(--lima)" }}>{copShort(d.earningsToday)}</p>
              <p className="text-[10px] text-muted-foreground">{d.completedToday} hoy</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Settings size={14} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!d.isVerified && <DropdownMenuItem onClick={() => approve.mutate({ type: "driver", id: d.id, approve: true })}>✓ Aprobar verificación</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => toast("Domiciliario suspendido")}>Suspender</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => toast("Domiciliario eliminado")}>Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ManageUsers() {
  const { data, isLoading } = useAdminUsers();
  const users = data?.users ?? [];
  const roleColor: Record<string, string> = { cliente: "var(--antojo)", domiciliario: "var(--lima)", restaurante: "var(--mora)", admin: "var(--cafe)" };
  const roleLabel: Record<string, string> = { cliente: "Cliente", domiciliario: "Domiciliario", restaurante: "Restaurante", admin: "Admin" };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Usuarios</h1>
        <Badge className="bg-secondary text-foreground">{users.length} registrados</Badge>
      </div>
      {isLoading ? <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div> : (
        <div className="space-y-2">
          {users.map((u: any) => (
            <Card key={u.id} className="flex items-center gap-3 p-3 shadow-soft">
              <div className="grid h-9 w-9 place-items-center rounded-full text-white text-xs font-bold" style={{ background: roleColor[u.role] }}>
                {u.name.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{u.name}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email} · {u.provider} · {u.city}</p>
              </div>
              <Badge style={{ background: roleColor[u.role], color: "white" }}>{roleLabel[u.role]}</Badge>
              {u.verified && <Badge className="bg-lima/15" style={{ color: "var(--lima)" }}>✓</Badge>}
              <span className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Revenue() {
  const { data } = useAdminStats();
  if (!data) return <Skeleton className="h-64 rounded-2xl" />;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Ingresos</h1>
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 font-display font-bold">Pedidos por día (7 días)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenue7d}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} />
              <Bar dataKey="orders" fill="var(--mango)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 font-display font-bold">GMV por restaurante</h3>
        <div className="space-y-2">
          {data.topRestaurants.map((r: any, i: number) => {
            const max = data.topRestaurants[0].gmv;
            return (
              <div key={r.id} className="flex items-center gap-3">
                <img src={r.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm"><span className="font-semibold">{r.name}</span><span className="font-bold">{cop(r.gmv)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-secondary"><div className="h-full rounded-full" style={{ width: `${(r.gmv/max)*100}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function AdminPromos() {
  const promos = [
    { code: "BIENVENIDA10", title: "10% bienvenida", uses: 4218, active: true },
    { code: "ANTOJO20", title: "20% off", uses: 1842, active: true },
    { code: "ENVIO0", title: "Envío gratis", uses: 5610, active: true },
    { code: "MERIENDA5", title: "$5.000 off", uses: 2987, active: true },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Promociones</h1>
        <Button size="sm" className="rounded-full" style={{ background: "var(--antojo)", color: "white" }}><Plus size={14} /> Nueva promo</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {promos.map(p => (
          <Card key={p.code} className="p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{p.code}</span>
              <Badge className="bg-lima/15" style={{ color: "var(--lima)" }}>Activa</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.title}</p>
            <p className="mt-2 font-display text-xl font-extrabold">{p.uses.toLocaleString("es-CO")}<span className="text-xs font-normal text-muted-foreground"> usos</span></p>
          </Card>
        ))}
      </div>
    </div>
  );
}

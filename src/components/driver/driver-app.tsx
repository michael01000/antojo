"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";
import { useSocket } from "@/components/providers";
import {
  useDriverOrders, useAcceptOrder, useToggleDriverOnline, useCompleteDelivery, useUpdateOrderStatus, useOrderMessages, useSendMessage, useOnboardDriver, useLogout,
} from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveMap } from "@/components/shared/live-map";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Price } from "@/components/shared/star-rating";
import {
  Power, Bike, Star, Wallet, TrendingUp, Navigation, MapPin, Clock, Package,
  CheckCircle2, Phone, Send, ArrowRight, Zap, Trophy, ChevronRight, MessageCircle, LogOut,
} from "lucide-react";
import { cop, copShort } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useState } from "react";

export function DriverApp() {
  const view = useApp((s) => s.driverView);
  const setView = useApp((s) => s.setDriverView);
  const online = useApp((s) => s.driverOnline);
  const setOnline = useApp((s) => s.setDriverOnline);
  const { data, isLoading } = useDriverOrders();
  const toggle = useToggleDriverOnline();

  const driver = data?.driver;
  const active = data?.active ?? null;
  const available = data?.available ?? [];

  const toggleOnline = async () => {
    const next = !online;
    setOnline(next);
    try { await toggle.mutateAsync(next); toast(next ? "🟢 En línea — recibiendo pedidos" : "🔴 Fuera de línea"); }
    catch { setOnline(!next); }
  };

  // If has active delivery, default to active view
  useEffect(() => {
    if (active && online) setView("active");
  }, [active?.id, online]);

  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0">
      {/* Status header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Hola, {driver?.name?.split(" ")[0] ?? "Andrés"} 🏍️</h1>
          <p className="text-sm text-muted-foreground">{online ? "Estás en línea" : "Estás fuera de línea"} · {driver?.vehicle}</p>
        </div>
        <button onClick={toggleOnline}
          className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-soft transition", online ? "text-white" : "bg-secondary")}
          style={online ? { background: "var(--lima)" } : undefined}>
          <Power size={16} className={online ? "animate-pulse" : ""} />
          {online ? "En línea" : "Conectarse"}
        </button>
      </div>

      {/* Quick stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat icon={Wallet} label="Hoy" value={copShort(driver?.earningsToday ?? 0)} color="var(--lima)" />
        <Stat icon={Package} label="Entregas" value={`${driver?.completedToday ?? 0}`} color="var(--antojo)" />
        <Stat icon={Star} label="Rating" value={`${driver?.rating ?? 5}`} color="var(--mango)" />
      </div>

      {view === "home" && <DriverHome online={online} available={available} active={active} isLoading={isLoading} setView={setView} />}
      {view === "active" && <DriverActive order={active} setView={setView} />}
      {view === "earnings" && <DriverEarnings driver={driver} />}
      {view === "profile" && <DriverProfile driver={driver} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <Card className="p-3 shadow-soft">
      <Icon size={15} style={{ color }} />
      <p className="mt-1 font-display text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}

function DriverHome({ online, available, active, isLoading, setView }: any) {
  const accept = useAcceptOrder();
  const acceptOrder = async (o: Order) => {
    try { await accept.mutateAsync(o.id); toast.success(`Pedido ${o.code} aceptado ✅`); setView("active"); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-5">
      {active && (
        <Card className="overflow-hidden p-0 shadow-glow" >
          <button onClick={() => setView("active")} className="flex w-full items-center gap-3 p-4 text-left">
            <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: "var(--lima)" }}><Navigation size={20} /></div>
            <div className="flex-1">
              <p className="font-display font-bold">Entrega en curso</p>
              <p className="text-xs text-muted-foreground">{active.code} · {active.restaurant?.name}</p>
            </div>
            <ChevronRight size={18} />
          </button>
        </Card>
      )}

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Zap size={16} style={{ color: "var(--antojo)" }} /> Pedidos disponibles {online && `(${available.length})`}</h2>
        {!online ? (
          <Card className="p-8 text-center text-muted-foreground shadow-soft">
            <Power size={28} className="mx-auto mb-2 opacity-50" />
            Conéctate para empezar a recibir pedidos cerca de ti.
          </Card>
        ) : isLoading ? (
          <div className="space-y-2">{[0,1].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : available.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground shadow-soft">
            <Bike size={28} className="mx-auto mb-2 opacity-50" />
            No hay pedidos disponibles ahora mismo. ¡Te avisaremos!
          </Card>
        ) : (
          <div className="space-y-2.5">
            {available.map((o: Order) => (
              <Card key={o.id} className="p-3.5 shadow-soft">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold">{o.code}</span>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold">{o.restaurant?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">📍 {o.restaurant?.neighborhood} → {o.address.split(",")[0]}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Package size={11} /> {o.items.length} items</span>
                      <span className="flex items-center gap-0.5"><Clock size={11} /> {o.etaMin} min</span>
                      <span className="flex items-center gap-0.5"><MapPin size={11} /> ~{2 + (o.id.charCodeAt(o.id.length - 1) % 5)} km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold" style={{ color: "var(--lima)" }}>{cop(4500)}</p>
                    <p className="text-[10px] text-muted-foreground">ganancia</p>
                  </div>
                </div>
                <Button className="mt-2.5 w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }}
                  disabled={accept.isPending} onClick={() => acceptOrder(o)}>
                  {accept.isPending ? "Aceptando…" : "Aceptar pedido"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DriverActive({ order, setView }: { order: Order | null; setView: (v: any) => void }) {
  const complete = useCompleteDelivery();
  const updateStatus = useUpdateOrderStatus();
  const socket = useSocket();
  const intervalRef = useRef<any>(null);
  const [useRealGps, setUseRealGps] = useState(false);
  const geo = useGeolocation(useRealGps && order?.status === "en_route");

  // Emitir ubicación GPS REAL cuando esté disponible
  useEffect(() => {
    if (!useRealGps || !order || !socket || geo.lat === null) return;
    socket.emit("driver:location", { orderId: order.id, lat: geo.lat, lng: geo.lng, driverId: order.driverId });
    fetch(`/api/driver/location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat: geo.lat, lng: geo.lng, orderId: order.id }) }).catch(()=>{});
  }, [useRealGps, geo.lat, geo.lng, order?.id, socket]);

  // Simulate live movement toward customer when en_route (fallback si no hay GPS real)
  useEffect(() => {
    if (useRealGps || !order || order.status !== "en_route" || !socket) return;
    let lat = order.driverLat, lng = order.driverLng;
    // destination ~ Chapinero (4.6521, -74.0635)
    const dlat = 4.6521, dlng = -74.0635;
    intervalRef.current = setInterval(() => {
      lat += (dlat - lat) * 0.18;
      lng += (dlng - lng) * 0.18;
      socket.emit("driver:location", { orderId: order.id, lat, lng, driverId: order.driverId });
      fetch(`/api/driver/location`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lat, lng, orderId: order.id }) }).catch(()=>{});
    }, 2500);
    return () => clearInterval(intervalRef.current);
  }, [useRealGps, order?.id, order?.status, socket]);

  if (!order) {
    return (
      <Card className="p-10 text-center text-muted-foreground shadow-soft">
        <Package size={32} className="mx-auto mb-2 opacity-50" />
        No tienes entregas activas. Acepta un pedido para empezar.
        <div><Button className="mt-3 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => setView("home")}>Ver pedidos</Button></div>
      </Card>
    );
  }

  const steps: { status: OrderStatus; label: string; desc: string }[] = [
    { status: "picked_up", label: "Recoger pedido", desc: "Ve al restaurante" },
    { status: "en_route", label: "Iniciar ruta", desc: "Confirma que recogiste" },
    { status: "delivered", label: "Entregar", desc: "Llega al cliente" },
  ];
  const curIdx = steps.findIndex(s => s.status === order.status);

  const goNext = async () => {
    if (order.status === "picked_up") {
      await updateStatus.mutateAsync({ orderId: order.id, status: "en_route", etaMin: 10 });
      toast("📍 Ruta iniciada — ¡manos a la obra!");
    } else if (order.status === "en_route") {
      await complete.mutateAsync(order.id);
      toast.success("🎉 ¡Pedido entregado! +$4.500");
      setView("home");
    }
  };

  const progress = order.status === "delivered" ? 1 : order.status === "en_route" ? 0.7 : 0.3;

  return (
    <div className="space-y-4">
      <LiveMap driverLat={order.driverLat} driverLng={order.driverLng} progress={progress} status={order.status} className="h-56" />
      <Card className="p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display font-bold">{order.code}</p>
            <p className="text-sm text-muted-foreground">{order.restaurant?.name}</p>
          </div>
          <OrderStatusBadge status={order.status as OrderStatus} />
        </div>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0" style={{ color: "var(--mora)" }} /><span><b>Recoger en:</b> {order.restaurant?.name}, {order.restaurant?.neighborhood}</span></div>
          <div className="flex gap-2"><Navigation size={15} className="mt-0.5 shrink-0" style={{ color: "var(--antojo)" }} /><span><b>Entregar en:</b> {order.address}</span></div>
        </div>
        <div className="mt-3 rounded-xl bg-secondary/50 p-2.5 text-sm">
          <p className="font-semibold"> Items del pedido:</p>
          {order.items.map(i => <p key={i.id} className="text-xs text-muted-foreground">{i.qty}× {i.name}</p>)}
        </div>
      </Card>

      {/* GPS real toggle (cuando está en ruta) */}
      {order.status === "en_route" && (
        <Card className="p-3 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: useRealGps ? "oklch(0.72 0.17 145 / 0.15)" : "var(--secondary)" }}>
                <Navigation size={16} style={{ color: useRealGps ? "var(--lima)" : "var(--muted-foreground)" }} />
              </div>
              <div>
                <p className="text-sm font-bold">{useRealGps ? "GPS real activado" : "Ubicación simulada"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {useRealGps
                    ? geo.error ? `Error: ${geo.error}` : geo.lat ? `Precisión ±${Math.round(geo.accuracy || 0)}m` : "Obteniendo ubicación…"
                    : "Activa tu GPS para tracking real"}
                </p>
              </div>
            </div>
            <Button size="sm" variant={useRealGps ? "outline" : "default"} className="rounded-full"
              style={!useRealGps ? { background: "var(--lima)", color: "white" } : undefined}
              onClick={() => { setUseRealGps(!useRealGps); toast(useRealGps ? "GPS desactivado — usando simulación" : "GPS activado 📍"); }}>
              {useRealGps ? "Desactivar" : "Activar GPS"}
            </Button>
          </div>
        </Card>
      )}

      {/* Action button */}
      {order.status !== "delivered" && (
        <Button className="w-full rounded-xl py-4 text-base shadow-glow" style={{ background: "var(--lima)", color: "white" }}
          disabled={updateStatus.isPending || complete.isPending} onClick={goNext}>
          {order.status === "picked_up" && <>📍 Iniciar ruta al cliente <ArrowRight size={18} /></>}
          {order.status === "en_route" && <>✅ Confirmar entrega <CheckCircle2 size={18} /></>}
        </Button>
      )}

      <DriverChat orderId={order.id} customerName="Valentina" />
    </div>
  );
}

function DriverChat({ orderId, customerName }: { orderId: string; customerName: string }) {
  const { data } = useOrderMessages(orderId);
  const send = useSendMessage();
  const socket = useSocket();
  const [text, setText] = useState("");
  const msgs = data?.messages ?? [];
  const handleSend = () => {
    if (!text.trim()) return;
    socket?.emit("chat:message", { orderId, sender: "driver", text: text.trim(), at: new Date().toISOString() });
    send.mutate({ orderId, sender: "driver", text: text.trim() });
    setText("");
  };
  return (
    <Card className="flex flex-col shadow-soft" style={{ height: 280 }}>
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <MessageCircle size={16} style={{ color: "var(--antojo)" }} />
        <h3 className="font-display font-bold text-sm">Chat con {customerName}</h3>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
        {msgs.map((m: any) => (
          <div key={m.id} className={cn("flex", m.sender === "driver" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-2xl px-3 py-1.5 text-sm", m.sender === "driver" ? "rounded-br-sm text-white" : "rounded-bl-sm bg-secondary")} style={m.sender === "driver" ? { background: "var(--lima)" } : undefined}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border/60 p-2">
        <Input placeholder="Mensaje…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="h-9" />
        <Button size="icon" className="h-9 w-9 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={handleSend} disabled={!text.trim()}><Send size={15} /></Button>
      </div>
    </Card>
  );
}

function DriverEarnings({ driver }: { driver: any }) {
  const week = [32000, 42500, 28000, 51000, 39500, 62000, 42500];
  const max = Math.max(...week);
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const cashOwed = driver?.cashOwed ?? 0;
  const cashLimit = 200000;
  const cashBlocked = cashOwed >= cashLimit;
  const cashPct = Math.min(100, (cashOwed / cashLimit) * 100);
  return (
    <div className="space-y-4">
      <Card className="p-5 text-white shadow-soft" style={{ background: "linear-gradient(135deg, var(--lima), oklch(0.5 0.12 160))" }}>
        <p className="text-sm opacity-90">Ganancias de hoy</p>
        <p className="font-display text-4xl font-black">{cop(driver?.earningsToday ?? 42500)}</p>
        <p className="mt-1 flex items-center gap-1 text-sm opacity-90"><TrendingUp size={14} /> +12% vs ayer</p>
      </Card>

      {/* ─── Efectivo por consignar (Ledger) ─── */}
      <Card className={cn("overflow-hidden p-0 shadow-soft", cashBlocked && "ring-2 ring-red-500/40")}>
        <div className="p-4" style={{ background: cashBlocked ? "oklch(0.65 0.22 25 / 0.08)" : "oklch(0.78 0.16 75 / 0.08)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: cashBlocked ? "var(--antojo)" : "var(--mango)" }}>
                <Wallet size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-bold">Efectivo por consignar</p>
                <p className="text-[11px] text-muted-foreground">
                  {cashBlocked ? "⚠️ Pedidos en efectivo bloqueados" : "Saldo pendiente con la plataforma"}
                </p>
              </div>
            </div>
            <p className="font-display text-xl font-black" style={{ color: cashBlocked ? "var(--antojo)" : "var(--cafe)" }}>{cop(cashOwed)}</p>
          </div>
          {/* Barra de progreso hacia el tope */}
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
              <span>$0</span>
              <span>Tope: {cop(cashLimit)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full transition-all" style={{ width: `${cashPct}%`, background: cashBlocked ? "var(--antojo)" : cashPct > 70 ? "var(--mango)" : "var(--lima)" }} />
            </div>
            {cashBlocked && (
              <p className="mt-2 rounded-lg bg-antojo/10 p-2 text-[11px] font-semibold" style={{ background: "oklch(0.628 0.211 29 / 0.1)", color: "var(--antojo)" }}>
                ⛔ Consigna tu saldo para volver a recibir pedidos en efectivo. Mientras tanto, solo recibirás pedidos digitales.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 font-display font-bold">Esta semana</h3>
        <div className="flex h-32 items-end justify-between gap-2">
          {week.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-t-lg" style={{ height: `${(v/max)*100}%`, background: i === 6 ? "var(--lima)" : "oklch(0.72 0.17 145 / 0.4)" }} />
              <span className="text-[10px] text-muted-foreground">{days[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between border-t border-border/60 pt-3 text-sm">
          <span className="text-muted-foreground">Total semanal</span>
          <span className="font-bold">{cop(week.reduce((a,b)=>a+b,0))}</span>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 shadow-soft"><Trophy size={16} style={{ color: "var(--mango)" }} /><p className="mt-1 font-display text-lg font-extrabold">128</p><p className="text-[11px] text-muted-foreground">Entregas totales</p></Card>
        <Card className="p-3 shadow-soft"><Star size={16} style={{ color: "var(--mango)" }} /><p className="mt-1 font-display text-lg font-extrabold">4.9</p><p className="text-[11px] text-muted-foreground">Calificación</p></Card>
      </div>
    </div>
  );
}

function DriverProfile({ driver }: { driver: any }) {
  const authUser = useApp((s) => s.authUser);
  const [vehicle, setVehicle] = useState(driver?.vehicle ?? "Moto");
  const [plate, setPlate] = useState(driver?.plate ?? "");
  const onboard = useOnboardDriver();
  const logout = useApp((s) => s.logout);
  const logoutMut = useLogout();

  const submit = async () => {
    try { await onboard.mutateAsync({ vehicle, plate }); toast.success("Información enviada para verificación ✅"); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleLogout = async () => { try { await logoutMut.mutateAsync(); } catch {} logout(); toast("Sesión cerrada 👋"); };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="h-20" style={{ background: "linear-gradient(135deg, var(--lima), oklch(0.5 0.12 160))" }} />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-2xl text-white text-xl font-bold ring-4 ring-card" style={{ background: "var(--lima)" }}>
              {authUser?.name?.split(" ").slice(0,2).map((n) => n[0]).join("") ?? "AG"}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="font-display text-xl font-extrabold">{authUser?.name ?? driver?.name}</h1>
              <p className="text-sm text-muted-foreground">{authUser?.email}</p>
            </div>
            {driver?.isVerified ? (
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: "var(--lima)" }}>✓ Verificado</span>
            ) : (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">Pendiente verificación</span>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 font-display font-bold">Verificación de domiciliario</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Vehículo</span>
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="h-10 w-full rounded-xl border border-border/60 bg-secondary/40 px-3 text-sm outline-none">
              <option value="Moto">Moto</option>
              <option value="Bicicleta">Bicicleta</option>
              <option value="Carro">Carro</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Placa (si aplica)</span>
            <Input value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="Ej: ABC12D" className="h-10 uppercase" />
          </label>
          <div className="rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
            📋 Documentos requeridos: Licencia de conducción, cédula, SOAT y RTP. Un administrador revisará tu solicitud.
          </div>
          <Button className="w-full rounded-xl" style={{ background: "var(--lima)", color: "white" }} disabled={onboard.isPending} onClick={submit}>
            {onboard.isPending ? "Enviando…" : "Enviar para verificación"}
          </Button>
        </div>
      </Card>

      <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={handleLogout}><LogOut size={16} /> Cerrar sesión</Button>
    </div>
  );
}

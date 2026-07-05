"use client";

import { useApp } from "@/lib/store";
import { useOrder, useOrderMessages, useSendMessage, useMyOrders, useRateOrder } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveMap } from "@/components/shared/live-map";
import { OrderStatusBadge, StatusIcon } from "@/components/shared/status-badge";
import { Price } from "@/components/shared/star-rating";
import { ORDER_STATUS_FLOW, STATUS_INDEX, type OrderStatus } from "@/lib/types";
import { ArrowLeft, Phone, MessageCircle, Send, Check, Star, Share2, Users, Sparkles, ChevronRight, Bike } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/providers";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Tracking() {
  const activeOrderId = useApp((s) => s.activeOrderId);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const { data: myOrders } = useMyOrders();
  const id = activeOrderId ?? myOrders?.orders.find((o) => !["delivered", "cancelled"].includes(o.status))?.id ?? null;

  const { data, isLoading } = useOrder(id);
  const o = data?.order;

  useEffect(() => {
    if (o && !activeOrderId) setActiveOrderId(o.id);
  }, [o, activeOrderId, setActiveOrderId]);

  if (isLoading || !o) {
    return (
      <div className="px-3 pt-4 sm:px-5 lg:px-0">
        <button onClick={() => setCustomerView("orders")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ArrowLeft size={16} /> Mis pedidos</button>
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  const statusIdx = STATUS_INDEX[o.status as OrderStatus] ?? 0;
  const progress = o.status === "delivered" ? 1 : Math.min(0.95, statusIdx / 6 + (o.status === "en_route" ? 0.05 : 0));

  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0">
      <button onClick={() => setCustomerView("orders")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Mis pedidos</button>

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Pedido {o.code}</h1>
          <p className="text-sm text-muted-foreground">{o.restaurant?.name} · {timeAgo(o.createdAt)}</p>
        </div>
        <OrderStatusBadge status={o.status as OrderStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {/* Live map */}
          <LiveMap driverLat={o.driverLat} driverLng={o.driverLng} progress={progress} status={o.status} className="h-64 sm:h-80" />

          {/* ETA banner */}
          {!["delivered", "cancelled"].includes(o.status) && (
            <Card className="flex items-center gap-3 p-4 shadow-soft" style={{ background: "linear-gradient(135deg, oklch(0.628 0.211 29 / 0.08), oklch(0.78 0.16 75 / 0.08))" }}>
              <div className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-glow" style={{ background: "var(--antojo)" }}>
                <Sparkles size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Tiempo estimado de entrega</p>
                <p className="font-display text-2xl font-extrabold">{o.status === "en_route" ? `${Math.max(3, o.etaMin)} min` : `${o.etaMin} min`}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => toast("Ubicación compartida con tu contacto de emergencia")}>
                <Share2 size={14} /> Compartir
              </Button>
            </Card>
          )}

          {/* Status timeline */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-3 font-display font-bold">Seguimiento del pedido</h3>
            <div className="relative">
              {ORDER_STATUS_FLOW.map((s, i) => {
                const done = i <= statusIdx;
                const current = i === statusIdx && o.status !== "delivered";
                const event = o.events.find((e) => e.status === s.status);
                return (
                  <div key={s.status} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < ORDER_STATUS_FLOW.length - 1 && (
                      <div className={cn("absolute left-[15px] top-8 h-full w-0.5", done ? "" : "bg-border")} style={done ? { background: "var(--antojo)" } : undefined} />
                    )}
                    <div className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition", done ? "text-white" : "bg-card text-muted-foreground")}
                      style={done ? { background: "var(--antojo)", borderColor: "var(--antojo)" } : { borderColor: "var(--border)" }}>
                      <StatusIcon status={s.status as OrderStatus} size={14} />
                      {current && <span className="absolute inset-0 animate-pulse-ring rounded-full" style={{ background: "var(--antojo)" }} />}
                    </div>
                    <div className="pt-1">
                      <p className={cn("text-sm font-semibold", done ? "" : "text-muted-foreground")}>{s.label}</p>
                      {event && <p className="text-[11px] text-muted-foreground">{timeAgo(event.at)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Order items */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-2 font-display font-bold">Tu pedido</h3>
            <div className="space-y-1.5">
              {o.items.map((it) => (
                <div key={it.id} className="flex items-center gap-2 text-sm">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-xl">{it.emoji ?? "🍽️"}</span>
                  <span className="flex-1"><b>{it.qty}×</b> {it.name}</span>
                  <Price value={it.price * it.qty} className="font-semibold" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border/60 pt-2 text-sm font-bold">
              <span>Total</span><Price value={o.total} />
            </div>
          </Card>
        </div>

        {/* Right column: driver + chat */}
        <div className="space-y-4">
          {o.driver && o.status !== "delivered" && o.status !== "placed" && (
            <Card className="p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="grid h-14 w-14 place-items-center rounded-full text-white font-bold" style={{ background: "var(--lima)" }}>
                    {o.driver.name.split(" ").slice(0,2).map(n=>n[0]).join("")}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 ring-2 ring-card" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-bold">{o.driver.name}</p>
                  <p className="text-xs text-muted-foreground"><Bike size={11} className="inline" /> {o.driver.vehicle} · <Star size={11} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" /> {o.driver.rating}</p>
                </div>
                <a href={`tel:+573105551234`}><Button size="icon" className="rounded-full" style={{ background: "var(--lima)", color: "white" }}><Phone size={16} /></Button></a>
              </div>
            </Card>
          )}

          {/* Chat */}
          <ChatPanel orderId={o.id} />

          {o.status === "delivered" && <RateCard orderId={o.id} />}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ orderId }: { orderId: string }) {
  const { data } = useOrderMessages(orderId);
  const sendMsg = useSendMessage();
  const socket = useSocket();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    const msg = { orderId, sender: "customer", text: text.trim(), at: new Date().toISOString() };
    socket?.emit("chat:message", msg);
    sendMsg.mutate({ orderId, sender: "customer", text: text.trim() });
    setText("");
  };

  return (
    <Card className="flex flex-col shadow-soft" style={{ height: 360 }}>
      <div className="flex items-center gap-2 border-b border-border/60 p-3">
        <MessageCircle size={16} style={{ color: "var(--antojo)" }} />
        <h3 className="font-display font-bold">Chat del domicilio</h3>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-green-500" /> en línea</span>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay mensajes. ¡Saluda a tu domiciliario!</p>}
        {messages.map((m: any) => (
          <div key={m.id} className={cn("flex", m.sender === "customer" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", m.sender === "customer" ? "rounded-br-sm text-white" : "rounded-bl-sm bg-secondary") }
              style={m.sender === "customer" ? { background: "var(--antojo)" } : undefined}>
              <p>{m.text}</p>
              <p className={cn("mt-0.5 text-[10px]", m.sender === "customer" ? "text-white/70" : "text-muted-foreground")}>{new Date(m.at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        {sendMsg.isPending && (
          <div className="flex justify-end"><div className="rounded-2xl rounded-br-sm bg-secondary px-3 py-2 text-sm text-muted-foreground">Enviando…</div></div>
        )}
      </div>
      <div className="flex gap-2 border-t border-border/60 p-2">
        <Input placeholder="Escribe un mensaje…" value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()} className="h-9" />
        <Button size="icon" className="h-9 w-9 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={send} disabled={!text.trim()}><Send size={15} /></Button>
      </div>
    </Card>
  );
}

function RateCard({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(5);
  const [done, setDone] = useState(false);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const rate = useRateOrder();
  if (done) {
    return (
      <Card className="p-5 text-center shadow-soft">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ background: "oklch(0.72 0.17 145 / 0.15)" }}><Check size={24} style={{ color: "var(--lima)" }} /></div>
        <h3 className="mt-2 font-display font-bold">¡Gracias por calificar!</h3>
        <p className="text-sm text-muted-foreground">Ganaste 50 coins extra <Star size={12} className="inline" style={{ color: "var(--mango)" }} /></p>
        <Button className="mt-3 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => setCustomerView("discover")}>Volver a pedir</Button>
      </Card>
    );
  }
  return (
    <Card className="p-4 shadow-soft">
      <h3 className="mb-2 font-display font-bold">¿Cómo estuvo tu pedido?</h3>
      <div className="flex justify-center gap-1 py-2">
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setRating(n)}><Star size={32} className="transition" style={{ color: n <= rating ? "var(--mango)" : "var(--border)" }} fill={n <= rating ? "var(--mango)" : "none"} /></button>
        ))}
      </div>
      <Button className="mt-2 w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }}
        disabled={rate.isPending} onClick={async () => { await rate.mutateAsync({ orderId, rating }); setDone(true); }}>
        Enviar calificación
      </Button>
    </Card>
  );
}

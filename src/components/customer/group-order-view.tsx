"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useGroupOrder, useAddGroupItem, useRemoveGroupItem, useCheckoutGroupOrder, useCreateGroupOrder } from "@/hooks/use-data";
import { useRestaurant } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Copy, Plus, Trash2, ShoppingCart, ChevronLeft, Share2, Check } from "lucide-react";
import { cop } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GroupOrderView() {
  const code = useApp((s) => s.activeGroupOrderCode);
  const setActiveGroupOrderCode = useApp((s) => s.setActiveGroupOrderCode);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const authUser = useApp((s) => s.authUser);

  if (!code) {
    // No active group order → show create flow
    return (
      <div className="px-3 pt-4 sm:px-5 lg:px-0">
        <button onClick={() => setCustomerView("discover")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} /> Volver
        </button>
        <Card className="p-8 text-center shadow-soft">
          <Users size={32} className="mx-auto mb-2" style={{ color: "var(--mora)" }} />
          <h2 className="font-display text-xl font-extrabold">Pide en grupo</h2>
          <p className="mb-4 text-sm text-muted-foreground">Junta los antojos de tus amigos en un solo pedido. Elige un restaurante y comparte el link.</p>
          <Button className="rounded-full" style={{ background: "var(--mora)", color: "white" }} onClick={() => setCustomerView("discover")}>
            Elegir restaurante
          </Button>
        </Card>
      </div>
    );
  }

  return <ActiveGroupOrder code={code} />;
}

function ActiveGroupOrder({ code }: { code: string }) {
  const { data, isLoading } = useGroupOrder(code);
  const addMut = useAddGroupItem();
  const removeMut = useRemoveGroupItem();
  const checkoutMut = useCheckoutGroupOrder();
  const setActiveGroupOrderCode = useApp((s) => s.setActiveGroupOrderCode);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const authUser = useApp((s) => s.authUser);
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading || !data) return <div className="px-3 pt-4"><Skeleton className="h-64 rounded-3xl" /></div>;
  const go = data.groupOrder;

  if (go.status === "expired") {
    return (
      <div className="px-3 pt-4 text-center">
        <Card className="p-8 shadow-soft">
          <p className="font-semibold">Este pedido grupal expiró</p>
          <Button className="mt-3 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => { setActiveGroupOrderCode(null); setCustomerView("discover"); }}>Crear nuevo</Button>
        </Card>
      </div>
    );
  }

  const subtotal = go.items.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + serviceFee;
  const isHost = go.hostName === authUser?.name;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?g=${code}` : "";

  const copyLink = () => { navigator.clipboard?.writeText(shareUrl); toast.success("¡Link copiado! Compártelo con tus amigos 📤"); };

  // Group items by person
  const byPerson = new Map<string, any[]>();
  for (const item of go.items) {
    if (!byPerson.has(item.addedByName)) byPerson.set(item.addedByName, []);
    byPerson.get(item.addedByName)!.push(item);
  }

  const handleCheckout = async () => {
    try {
      const { order } = await checkoutMut.mutateAsync({ code, address: "Calle 72 #11-25, Chapinero, Apto 402", paymentMethod: "Tarjeta Visa •• 4242" });
      toast.success(`¡Pedido grupal ${order.code} confirmado! 🎉`);
      setActiveGroupOrderCode(null);
      setActiveOrderId(order.id);
      setCustomerView("tracking");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0">
      <button onClick={() => { setActiveGroupOrderCode(null); setCustomerView("discover"); }} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} /> Volver
      </button>

      {/* Header */}
      <Card className="mb-4 overflow-hidden p-0 shadow-soft">
        <div className="relative h-20" style={{ background: "linear-gradient(135deg, var(--mora), oklch(0.4 0.15 320))" }} />
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: "var(--mora)" }} />
            <h1 className="font-display text-xl font-extrabold">Pedido en grupo</h1>
          </div>
          <p className="text-sm text-muted-foreground">{go.restaurant.name} · Código: <b>{code}</b></p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex -space-x-2">
              {go.participants.slice(0, 4).map((p: string, i: number) => (
                <span key={i} className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-card" style={{ background: ["var(--antojo)","var(--lima)","var(--mango)","var(--cafe)"][i % 4] }}>{p[0]}</span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{go.participants.length} participantes</span>
          </div>
          {/* Share link */}
          <div className="mt-3 flex gap-2">
            <div className="flex-1 truncate rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">{shareUrl}</div>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={copyLink}><Copy size={14} /> Copiar</Button>
          </div>
        </div>
      </Card>

      {/* Items by person */}
      <div className="space-y-3">
        {Array.from(byPerson.entries()).map(([person, items]) => (
          <Card key={person} className="p-3 shadow-soft">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
              <span className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--mora)" }}>{person[0]}</span>
              {person}
              {person === authUser?.name && <span className="text-[10px] text-muted-foreground">(tú)</span>}
            </p>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg bg-secondary/40 p-2">
                  <span className="text-lg">{item.emoji ?? "🍽️"}</span>
                  <div className="flex-1"><p className="text-sm font-semibold">{item.qty}× {item.name}</p>{item.notes && <p className="text-[11px] text-muted-foreground">{item.notes}</p>}</div>
                  <span className="text-sm font-bold">{cop(item.price * item.qty)}</span>
                  {person === authUser?.name && <button onClick={() => removeMut.mutate({ code, itemId: item.id })} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Add items button */}
      <Button variant="outline" className="mt-3 w-full rounded-xl gap-2" onClick={() => { setSelectedRestaurant(go.restaurant.id); }}>
        <Plus size={16} /> Añadir platos al pedido
      </Button>

      {/* Summary + checkout (host only) */}
      {isHost && go.items.length > 0 && (
        <Card className="mt-4 p-4 shadow-soft">
          <h3 className="mb-2 font-display font-bold">Resumen total</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal ({go.items.length} items)</span><span className="font-semibold">{cop(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Servicio (8%)</span><span className="font-semibold">{cop(serviceFee)}</span></div>
            <div className="flex justify-between border-t border-border/60 pt-1.5 text-base font-extrabold"><span>Total</span><span>{cop(total)}</span></div>
          </div>
          <Button className="mt-3 w-full rounded-xl py-3 text-base shadow-glow gap-2" style={{ background: "var(--mora)", color: "white" }} disabled={checkoutMut.isPending} onClick={handleCheckout}>
            <ShoppingCart size={18} /> Pagar todo el pedido
          </Button>
          <p className="mt-1 text-center text-[11px] text-muted-foreground">Como host, pagas el pedido completo</p>
        </Card>
      )}
    </div>
  );
}

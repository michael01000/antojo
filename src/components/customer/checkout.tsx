"use client";

import { useApp } from "@/lib/store";
import { useCreateOrder, useValidatePromo, usePromotions, useCustomer, useAddresses, useAddAddress } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Price } from "@/components/shared/star-rating";
import { ArrowLeft, Plus, Minus, Trash2, Tag, Clock, CreditCard, Wallet, Landmark, Check, MapPin, Users, Sparkles, X, Heart, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSocket } from "@/components/providers";
import { cop } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIPS = [0, 2000, 3000, 5000];
const PAYMENTS = [
  { id: "Tarjeta Visa •• 4242", label: "Tarjeta Visa •• 4242", icon: CreditCard },
  { id: "Nequi", label: "Nequi · 311 555 1234", icon: Wallet },
  { id: "Daviplata", label: "Daviplata", icon: Landmark },
  { id: "Efectivo", label: "Efectivo al recibir", icon: Wallet },
];

export function Checkout() {
  const cart = useApp((s) => s.cart);
  const cartRestaurantId = useApp((s) => s.cartRestaurantId);
  const updateQty = useApp((s) => s.updateQty);
  const clearCart = useApp((s) => s.clearCart);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const primeMember = useApp((s) => s.primeMember);
  const groupMode = useApp((s) => s.groupMode);
  const { data: profile } = useCustomer();
  const { data: addressesData } = useAddresses();
  const addAddrMut = useAddAddress();
  const { data: promos } = usePromotions();
  const validatePromo = useValidatePromo();
  const createOrder = useCreateOrder();
  const socket = useSocket();

  const addresses = addressesData?.addresses ?? profile?.addresses ?? [];
  const [address, setAddress] = useState(addresses[0]?.street ?? "Calle 72 #11-25, Chapinero, Apto 402");
  const [payment, setPayment] = useState(PAYMENTS[0].id);
  const [tip, setTip] = useState(2000);
  const [promoCode, setPromoCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number; freeDelivery: boolean } | null>(null);
  const [notes, setNotes] = useState("");

  // ─── Formulario inline de nueva dirección ───
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState("Casa");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrDetails, setAddrDetails] = useState("");

  const handleAddAddress = async () => {
    if (!addrStreet.trim()) { toast.error("Escribe la dirección"); return; }
    try {
      await addAddrMut.mutateAsync({ label: addrLabel, street: addrStreet, details: addrDetails });
      toast.success("Dirección guardada ✓");
      setAddress(addrStreet); // seleccionar automáticamente la nueva
      setAddrStreet(""); setAddrDetails(""); setShowAddrForm(false);
    } catch (e: any) { toast.error(e.message); }
  };

  if (cart.length === 0) {
    return (
      <div className="px-3 pt-10 text-center sm:px-5 lg:px-0">
        <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
        <h2 className="mt-3 font-display text-xl font-bold">Tu carrito está vacío</h2>
        <p className="mt-1 text-sm text-muted-foreground">Añade platos de tus restaurantes favoritos.</p>
        <Button className="mt-4 rounded-full" style={{ background: "var(--antojo)", color: "white" }} onClick={() => setCustomerView("discover")}>Explorar restaurantes</Button>
      </div>
    );
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const baseDelivery = primeMember ? (subtotal >= 25000 ? 0 : 4500) : 4500;
  const deliveryFee = applied?.freeDelivery ? 0 : baseDelivery;
  const serviceFee = Math.round(subtotal * 0.08);
  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + tip - discount);
  const coinsEarned = Math.round(total / 1000) * 2; // Oro tier x2

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const r = await validatePromo.mutateAsync({ code: promoCode, subtotal });
      if (r.valid) {
        setApplied({ code: promoCode.toUpperCase(), discount: r.discount, freeDelivery: r.freeDelivery });
        toast.success(`¡Promo ${promoCode.toUpperCase()} aplicada!`);
      } else {
        toast.error(r.error ?? "Código inválido");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Código inválido");
    }
  };

  const placeOrder = async () => {
    const body = {
      items: cart.map((c) => ({ menuItemId: c.menuItemId, name: c.name, emoji: c.emoji, price: c.price, qty: c.qty, notes: c.notes })),
      restaurantId: cartRestaurantId,
      address,
      paymentMethod: payment,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      tip,
      total,
      promoCode: applied?.code ?? null,
      notes,
      etaMin: 32,
    };
    try {
      const { order } = await createOrder.mutateAsync(body);
      socket?.emit("order:created", order);
      toast.success(`¡Pedido ${order.code} confirmado! 🎉`);
      clearCart();
      setActiveOrderId(order.id);
      setCustomerView("tracking");
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo crear el pedido");
    }
  };

  return (
    <div className="px-3 pt-4 pb-28 sm:px-5 lg:px-0 lg:pb-4">
      <button onClick={() => setCustomerView("restaurant")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Seguir pidiendo
      </button>

      <h1 className="mb-4 font-display text-2xl font-extrabold tracking-tight">Checkout</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Group order banner */}
          {groupMode && (
            <div className="flex items-center gap-3 rounded-2xl border p-3" style={{ borderColor: "oklch(0.55 0.22 340 / 0.3)", background: "oklch(0.55 0.22 340 / 0.06)" }}>
              <div className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: "var(--mora)" }}><Users size={16} /></div>
              <div className="flex-1 text-sm">
                <p className="font-bold">Pedido en grupo activo</p>
                <p className="text-xs text-muted-foreground">Comparte el link para que tus amigos sumen platos a este carrito.</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => { navigator.clipboard?.writeText("antojo.co/g/ANT-8X2K"); toast.success("Link copiado"); }}>Copiar link</Button>
            </div>
          )}

          {/* Cart items */}
          <Card className="p-3 shadow-soft">
            <h3 className="mb-2 px-1 font-display font-bold">Tu pedido · {cart[0]?.restaurantName}</h3>
            <div className="space-y-2">
              {cart.map((c) => (
                <div key={c.menuItemId} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2.5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-background text-2xl">{c.emoji ?? "🍽️"}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <Price value={c.price} className="text-xs text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background p-0.5">
                    <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-secondary" onClick={() => updateQty(c.menuItemId, c.qty - 1)}><Minus size={12} /></button>
                    <span className="w-4 text-center text-xs font-bold tabular-nums">{c.qty}</span>
                    <button className="grid h-6 w-6 place-items-center rounded-full text-white" style={{ background: "var(--antojo)" }} onClick={() => updateQty(c.menuItemId, c.qty + 1)}><Plus size={12} /></button>
                  </div>
                  <Price value={c.price * c.qty} className="w-16 text-right text-sm font-bold" />
                </div>
              ))}
            </div>
          </Card>

          {/* Address */}
          <Card className="p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-display font-bold"><MapPin size={16} style={{ color: "var(--antojo)" }} /> Dirección de entrega</h3>
              <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={() => setShowAddrForm(!showAddrForm)}>
                {showAddrForm ? <X size={13} /> : <Plus size={13} />} {showAddrForm ? "Cancelar" : "Nueva"}
              </Button>
            </div>

            {/* Formulario inline de nueva dirección */}
            {showAddrForm && (
              <div className="mb-3 space-y-2 rounded-xl bg-secondary/40 p-3">
                <div className="flex gap-2">
                  {["Casa", "Trabajo", "Otra"].map((l) => (
                    <button key={l} onClick={() => setAddrLabel(l)} className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold transition", addrLabel === l ? "text-white" : "bg-card")} style={addrLabel === l ? { background: "var(--antojo)" } : undefined}>{l}</button>
                  ))}
                </div>
                <Input value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} placeholder="Ej: Calle 72 #11-25, Chapinero" className="h-10" />
                <Input value={addrDetails} onChange={(e) => setAddrDetails(e.target.value)} placeholder="Detalles (apto, torre, instrucciones)" className="h-10" />
                <Button className="w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }} disabled={addAddrMut.isPending} onClick={handleAddAddress}>
                  Guardar y usar esta dirección
                </Button>
              </div>
            )}

            {/* Lista de direcciones guardadas */}
            <div className="space-y-2">
              {(addresses.length > 0 ? addresses : [{ label: "Casa", street: "Calle 72 #11-25, Chapinero, Apto 402" }]).map((a: any) => (
                <button key={a.id ?? a.label} onClick={() => setAddress(a.street)}
                  className={cn("flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-sm transition", address === a.street ? "" : "border-border/60")}
                  style={address === a.street ? { borderColor: "var(--antojo)", background: "oklch(0.628 0.211 29 / 0.06)" } : undefined}>
                  <span>
                    <span className="font-semibold">{a.label}</span> · {a.street}
                  </span>
                  {address === a.street && <Check size={16} style={{ color: "var(--antojo)" }} />}
                </button>
              ))}
            </div>
            <textarea placeholder="Notas para el domiciliario (ej. tocar timbre 402)" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-secondary/40 p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" rows={2} />
          </Card>

          {/* Payment */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><CreditCard size={16} /> Método de pago</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENTS.map((p) => {
                const Icon = p.icon;
                const active = payment === p.id;
                return (
                  <button key={p.id} onClick={() => setPayment(p.id)}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm transition ${active ? "" : "border-border/60"}`}
                    style={active ? { borderColor: "var(--antojo)", background: "oklch(0.628 0.211 29 / 0.06)" } : undefined}>
                    <Icon size={16} className={active ? "" : "text-muted-foreground"} style={active ? { color: "var(--antojo)" } : undefined} />
                    <span className="flex-1 truncate">{p.label}</span>
                    {active && <Check size={14} style={{ color: "var(--antojo)" }} />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Promo */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Tag size={16} style={{ color: "var(--mango)" }} /> Código promocional</h3>
            {applied ? (
              <div className="flex items-center justify-between rounded-xl border p-2.5" style={{ borderColor: "var(--lima)", background: "oklch(0.72 0.17 145 / 0.08)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--lima)" }}><Check size={14} className="inline mr-1" style={{ color: "var(--lima)" }} /> {applied.code}</span>
                <span className="text-sm font-bold" style={{ color: "var(--lima)" }}>-<Price value={applied.discount} /></span>
                <button className="text-xs text-muted-foreground underline" onClick={() => setApplied(null)}>quitar</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Ej: BIENVENIDA10" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="h-10 uppercase" />
                <Button variant="outline" className="rounded-xl" disabled={validatePromo.isPending || !promoCode} onClick={applyPromo}>Aplicar</Button>
              </div>
            )}
            {(promos?.promotions ?? []).slice(0, 3).map((p: any) => (
              <button key={p.id} onClick={() => setPromoCode(p.code)} className="mt-2 flex w-full items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1.5 text-xs hover:bg-secondary">
                <span className="font-semibold">{p.code}</span><span className="text-muted-foreground">{p.title}</span>
              </button>
            ))}
          </Card>

          {/* Tip */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Heart size={16} style={{ color: "var(--lima)" }} /> Propina para el domiciliario</h3>
            <div className="grid grid-cols-4 gap-2">
              {TIPS.map((t) => (
                <button key={t} onClick={() => setTip(t)}
                  className={`rounded-xl border py-2 text-sm font-bold transition ${tip === t ? "" : "border-border/60"}`}
                  style={tip === t ? { borderColor: "var(--antojo)", background: "var(--antojo)", color: "white" } : undefined}>
                  {t === 0 ? "Sin" : <Price value={t} />}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4 shadow-soft">
            <h3 className="mb-3 font-display font-bold">Resumen</h3>
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={<Price value={subtotal} />} />
              <Row label="Envío" value={deliveryFee === 0 ? <span className="font-bold" style={{ color: "var(--lima)" }}>Gratis</span> : <Price value={deliveryFee} />} />
              <Row label="Servicio" value={<Price value={serviceFee} />} />
              {discount > 0 && <Row label="Descuento" value={<span className="font-bold" style={{ color: "var(--lima)" }}>-<Price value={discount} /></span>} />}
              <Row label="Propina" value={<Price value={tip} />} />
              <div className="my-2 border-t border-border/60" />
              <div className="flex justify-between text-base font-extrabold">
                <span>Total</span><Price value={total} />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-secondary/40 px-2.5 py-1.5 text-xs">
              <Sparkles size={12} style={{ color: "var(--mango)" }} />
              <span>Ganarás <b>{coinsEarned} coins</b> con este pedido</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} /> Entrega estimada: 30-40 min
            </div>
            <Button className="mt-4 w-full rounded-xl py-3 text-base shadow-glow" style={{ background: "var(--antojo)", color: "white" }}
              disabled={createOrder.isPending} onClick={placeOrder}>
              {createOrder.isPending ? "Procesando…" : `Pagar ${cop(total)}`}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">Pago seguro encriptado SSL · Pago contra entrega disponible</p>

            {/* Eco-Antojo */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-lima/5 p-2.5 text-xs text-muted-foreground" style={{ background: "oklch(0.72 0.17 145 / 0.06)" }}>
              <span className="text-base">🌳</span>
              <span>Esta entrega a domicilio ahorra ~2.3kg de CO₂ vs manejar tú mismo</span>
            </div>

            {/* Antojo Wallet (opcional) */}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-secondary/40 p-2.5 text-xs">
              <span className="flex items-center gap-1.5"><Wallet size={14} style={{ color: "var(--mango)" }} /> Antojo Wallet</span>
              <span className="text-muted-foreground">Próximamente: paga con saldo y gana cashback</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

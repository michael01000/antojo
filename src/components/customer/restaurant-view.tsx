"use client";

import { useApp } from "@/lib/store";
import { useRestaurant, useRestaurantReviews } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating, Price } from "@/components/shared/star-rating";
import { ArrowLeft, Clock, Bike, Heart, Share2, Info, Plus, Minus, Flame, Leaf, ChevronUp, Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";

const coverGradients: Record<string, string> = {
  antojo: "bg-antojo-gradient", mango: "bg-mango-gradient", mora: "bg-mora-gradient", lima: "bg-lima-gradient", cafe: "bg-cafe-gradient",
};

export function RestaurantView() {
  const id = useApp((s) => s.selectedRestaurantId);
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const cart = useApp((s) => s.cart);
  const updateQty = useApp((s) => s.updateQty);
  const addToCart = useApp((s) => s.addToCart);
  const { data, isLoading } = useRestaurant(id);

  if (isLoading || !data) {
    return (
      <div className="px-3 pt-4 sm:px-5 lg:px-0">
        <Skeleton className="h-52 w-full rounded-3xl" />
        <div className="mt-4 space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      </div>
    );
  }

  const { restaurant: r, menu } = data;
  const categories = Object.keys(menu);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const qtyOf = (mid: string) => cart.find((c) => c.menuItemId === mid)?.qty ?? 0;

  return (
    <div className="relative pb-28">
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden sm:h-56">
        <div className={cn("absolute inset-0", coverGradients[r.coverColor] ?? "bg-antojo-gradient")} />
        <img src={r.imageUrl} alt={r.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
        <button onClick={() => setSelectedRestaurant(null)} className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full glass shadow-soft">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute right-3 top-3 flex gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-full glass shadow-soft"><Heart size={16} /></button>
          <button className="grid h-9 w-9 place-items-center rounded-full glass shadow-soft"><Share2 size={16} /></button>
        </div>
      </div>

      {/* Info card overlapping cover */}
      <div className="relative -mt-10 px-3 sm:px-5 lg:px-0">
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">{r.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{r.cuisine} · {r.neighborhood}</p>
            </div>
            {r.promo && (
              <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: "oklch(0.78 0.16 75 / 0.18)", color: "var(--mango)" }}>
                🔥 {r.promo}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <StarRating value={r.rating} count={r.reviewCount} />
            <span className="flex items-center gap-1 text-muted-foreground"><Clock size={14} /> {r.deliveryMin}-{r.deliveryMin+8} min</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Bike size={14} style={{ color: "var(--lima)" }} /> Envío <Price value={r.deliveryFee} className={r.deliveryFee === 0 ? "font-bold" : ""} /></span>
            <span className="text-muted-foreground">{"$".repeat(r.priceLevel)}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
        </div>
      </div>

      {/* Menu sections */}
      <div className="mt-5 space-y-6 px-3 sm:px-5 lg:px-0">
        {categories.map((cat) => (
          <section key={cat}>
            <h2 className="mb-2 font-display text-lg font-extrabold tracking-tight">{cat}</h2>
            <div className="space-y-2.5">
              {menu[cat].map((m: any) => {
                const q = qtyOf(m.id);
                return (
                  <div key={m.id} className="flex gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h4 className="font-semibold leading-tight">{m.name}</h4>
                        {m.isPopular && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "var(--antojo)" }}>TOP</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <Price value={m.price} className="text-sm font-bold" />
                        {m.calories && <span className="text-[11px] text-muted-foreground">{m.calories} cal</span>}
                        {m.tags?.split(",").filter(Boolean).map((t: string) => (
                          <span key={t} className="flex items-center gap-0.5 text-[11px]" style={{ color: t === "vegano" ? "var(--lima)" : t === "picante" ? "var(--antojo)" : "var(--muted-foreground)" }}>
                            {t === "vegano" ? <Leaf size={10} /> : t === "picante" ? <Flame size={10} /> : null}{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-between">
                      <div className="grid h-16 w-16 place-items-center rounded-xl bg-secondary text-3xl sm:h-20 sm:w-20">{m.emoji ?? "🍽️"}</div>
                      {q === 0 ? (
                        <Button size="sm" className="mt-2 h-8 w-16 rounded-full shadow-soft" style={{ background: "var(--antojo)", color: "white" }}
                          onClick={() => { addToCart({ menuItemId: m.id, name: m.name, emoji: m.emoji, price: m.price, qty: 1, restaurantId: r.id, restaurantName: r.name }); toast.success(`${m.name} añadido al carrito`); }}>
                          <Plus size={14} /> Añadir
                        </Button>
                      ) : (
                        <div className="mt-2 flex items-center gap-1 rounded-full border border-border/60 bg-card p-0.5 shadow-soft">
                          <button className="grid h-7 w-7 place-items-center rounded-full hover:bg-secondary" onClick={() => updateQty(m.id, q - 1)}><Minus size={13} /></button>
                          <span className="w-5 text-center text-sm font-bold tabular-nums">{q}</span>
                          <button className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: "var(--antojo)" }} onClick={() => updateQty(m.id, q + 1)}><Plus size={13} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Reviews */}
      <ReviewsSection restaurantId={r.id} rating={r.rating} reviewCount={r.reviewCount} />

      {/* Sticky cart bar */}
      {totalQty > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-3 lg:bottom-4 lg:left-60 lg:right-4 lg:px-0">
          <div className="mx-auto max-w-2xl">
            <button
              onClick={() => setCustomerView("checkout")}
              className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-white shadow-glow transition-transform active:scale-[0.98]"
              style={{ background: "var(--antojo)" }}
            >
              <span className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-sm font-bold">{totalQty}</span>
                Ver carrito
              </span>
              <span className="font-bold"><Price value={total} /></span>
              <ChevronUp size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ restaurantId, rating, reviewCount }: { restaurantId: string; rating: number; reviewCount: number }) {
  const { data, isLoading } = useRestaurantReviews(restaurantId);
  const reviews = data?.reviews ?? [];
  return (
    <div className="mt-6 px-3 sm:px-5 lg:px-0">
      <div className="mb-2.5 flex items-end justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight sm:text-xl">
          <MessageSquare size={18} /> Reseñas
        </h2>
        <span className="flex items-center gap-1 text-sm"><Star size={14} fill="var(--mango)" style={{ color: "var(--mango)" }} /> {rating.toFixed(1)} · {reviewCount} reseñas</span>
      </div>
      {isLoading ? (
        <div className="space-y-2">{[0,1].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
          Aún no hay reseñas. ¡Sé el primero en calificar después de tu pedido!
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {reviews.map((rv: any) => (
            <div key={rv.id} className="rounded-2xl border border-border/60 bg-card p-3.5 shadow-soft">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full text-white text-xs font-bold" style={{ background: `var(--${rv.avatarColor})` }}>
                  {rv.customerName.split(" ").slice(0,2).map((n: string) => n[0]).join("")}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{rv.customerName}</p>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} size={11} fill={n <= rv.rating ? "var(--mango)" : "none"} style={{ color: n <= rv.rating ? "var(--mango)" : "var(--border)" }} />)}
                  </div>
                </div>
              </div>
              {rv.comment && <p className="mt-2 text-sm text-muted-foreground">{rv.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

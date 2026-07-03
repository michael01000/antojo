"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useCategories, useRestaurants, useRecommendations, usePopular, useCustomer, useStories, useCreateGroupOrder, useToggleFollow, useFollows } from "@/hooks/use-data";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/shared/restaurant-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cop } from "@/lib/format";
import { Price } from "@/components/shared/star-rating";
import {
  Flame, Sparkles, Clock, Crown, Users, ChevronRight, Wand2, TrendingUp,
  UtensilsCrossed, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Discover() {
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setGroupMode = useApp((s) => s.setGroupMode);
  const searchQuery = useApp((s) => s.searchQuery);
  const activeCategory = useApp((s) => s.activeCategory);
  const setActiveCategory = useApp((s) => s.setActiveCategory);
  const activeSort = useApp((s) => s.activeSort);
  const setActiveSort = useApp((s) => s.setActiveSort);
  const { data: cats } = useCategories();
  const { data: restData, isLoading } = useRestaurants();
  const { data: recs, isLoading: recsLoading } = useRecommendations();
  const { data: popular } = usePopular();
  const { data: profile } = useCustomer();
  const { data: storiesData } = useStories();
  const createGroupOrder = useCreateGroupOrder();
  const setActiveGroupOrderCode = useApp((s) => s.setActiveGroupOrderCode);

  // Compute the time-based greeting only after mount so SSR and the first
  // client paint render the same stable text (avoids hydration mismatch).
  const [greetingText, setGreetingText] = useState("Hola");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreetingText(greeting());
  }, []);

  const restaurants = restData?.restaurants ?? [];
  const tier = profile?.loyalty?.tier ?? "Plata";
  const prime = profile?.subscription?.plan === "prime";

  // filter categories client-side when searching
  const filteredCats = cats?.categories ?? [];

  return (
    <div className="space-y-6 px-3 pt-4 sm:px-5 lg:px-0">
      {/* ---------- Greeting ---------- */}
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">{greetingText}, Valentina 👋</p>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          ¿Qué se te antoja <span className="text-gradient-antojo">hoy</span>?
        </h1>
      </section>

      {/* ---------- Mobile search ---------- */}
      <div className="relative md:hidden">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Busca restaurantes o platos…"
          className="h-11 w-full rounded-full border border-border/60 bg-secondary/50 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={searchQuery}
          onChange={(e) => useApp.getState().setSearchQuery(e.target.value)}
        />
      </div>

      {/* ---------- Hero quick actions ---------- */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickAction icon={Users} label="Pide en grupo" desc="Junta antojos" color="mora" onClick={async () => {
          const firstRest = restaurants[0];
          if (!firstRest) { toast("No hay restaurantes disponibles"); return; }
          try {
            const { groupOrder } = await createGroupOrder.mutateAsync(firstRest.id);
            setActiveGroupOrderCode(groupOrder.code);
            toast.success(`¡Pedido grupal creado! Comparte el código ${groupOrder.code}`);
          } catch (e: any) { toast.error(e.message); }
        }} />
        <QuickAction icon={Crown} label={prime ? "Prime activo" : "Antojo Prime"} desc="Envío gratis" color="mango" onClick={() => setCustomerView("prime")} />
        <QuickAction icon={Flame} label="Ofertas flash" desc="Termina en 2h" color="antojo" onClick={() => document.getElementById("ofertas")?.scrollIntoView({ behavior: "smooth" })} />
        <QuickAction icon={Sparkles} label="Sazón AI" desc="¿Qué pido?" color="lima" onClick={() => setCustomerView("assistant")} />
      </section>

      {/* ---------- Stories bar ---------- */}
      {storiesData?.groups?.length > 0 && (
        <section>
          <div className="no-scrollbar -mx-3 mb-1 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
            {storiesData.groups.slice(0, 8).map((group: any) => {
              const hasUnviewed = group.stories.some((s: any) => !s.viewed);
              return (
                <button key={group.restaurant.id} onClick={() => setCustomerView("community")} className="flex w-16 shrink-0 flex-col items-center gap-1">
                  <div className={cn("rounded-full p-0.5", hasUnviewed ? "bg-antojo-gradient" : "bg-secondary")}>
                    <div className="rounded-full bg-background p-0.5">
                      <img src={group.restaurant.imageUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                    </div>
                  </div>
                  <span className="w-full truncate text-center text-[10px] font-semibold">{group.restaurant.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- Categories (functional filter) ---------- */}
      <section>
        <SectionHeader title="Categorías" subtitle="Filtra restaurantes al instante" />
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
          {filteredCats.map((c: any) => {
            const active = activeCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setActiveCategory(active ? "Todas" : c.name)}
                className={cn("flex min-w-[88px] flex-col items-center gap-1.5 rounded-2xl border p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow", active ? "text-white" : "border-border/60 bg-card")}
                style={active ? { background: "var(--antojo)", borderColor: "var(--antojo)" } : undefined}
              >
                <span className={cn("grid h-11 w-11 place-items-center rounded-xl text-2xl", active ? "bg-white/20" : "bg-secondary")}>{c.icon}</span>
                <span className="text-xs font-semibold">{c.name}</span>
                <span className={cn("text-[10px]", active ? "text-white/80" : "text-muted-foreground")}>{c.count}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---------- AI Recommendations "Para ti" ---------- */}
      <section>
        <SectionHeader
          title="Para ti"
          icon={<Wand2 size={16} style={{ color: "var(--lima)" }} />}
          subtitle={recs?.source === "ai" ? "Recomendado por Sazón AI" : "Curado para ti"}
        />
        {recsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0,1].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(recs?.recommendations ?? []).map((rec: any, i: number) => {
              const r = restaurants.find((x: any) => x.id === rec.restaurantId);
              if (!r) return null;
              return (
                <motion.button
                  key={rec.restaurantId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedRestaurant(r.id)}
                  className="group flex items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-2.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "var(--lima)" }}>TOP</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} style={{ color: "var(--lima)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--lima)" }}>Sugerencia IA</span>
                    </div>
                    <h4 className="truncate font-display text-sm font-bold">{r.name}</h4>
                    <p className="truncate text-xs text-muted-foreground">{rec.reason}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>⭐ {r.rating}</span><span>·</span><span><Clock size={10} className="inline" /> {r.deliveryMin} min</span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- Prime banner ---------- */}
      {!prime && (
        <section className="overflow-hidden rounded-3xl bg-cafe-gradient p-5 text-white shadow-soft" style={{ background: "linear-gradient(135deg, var(--cafe), #000)" }}>
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-mango/20" style={{ background: "oklch(0.78 0.16 75 / 0.2)" }}>
              <Crown size={24} style={{ color: "var(--mango)" }} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-extrabold">Antojo Prime</h3>
              <p className="text-sm opacity-80">Envío gratis + ofertas exclusivas por $14.900/mes</p>
            </div>
            <Button size="sm" className="rounded-full" style={{ background: "var(--mango)", color: "var(--cafe)" }} onClick={() => setCustomerView("prime")}>
              Probar
            </Button>
          </div>
        </section>
      )}

      {/* ---------- Popular items ---------- */}
      {popular?.items?.length ? (
        <section>
          <SectionHeader title="Lo más pedido" icon={<TrendingUp size={16} style={{ color: "var(--antojo)" }} />} />
          <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
            {popular.items.map((it: any) => (
              <button
                key={it.id}
                onClick={() => setSelectedRestaurant(it.restaurant.id)}
                className="w-44 shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div className="relative grid h-24 place-items-center bg-secondary text-5xl">
                  {it.emoji}
                  <span className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "var(--antojo)" }}>POPULAR</span>
                </div>
                <div className="space-y-0.5 p-2.5">
                  <h4 className="truncate font-display text-sm font-bold">{it.name}</h4>
                  <p className="truncate text-[11px] text-muted-foreground">{it.restaurant.name}</p>
                  <Price value={it.price} className="text-sm font-bold" />
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------- Flash deals ---------- */}
      <section id="ofertas">
        <SectionHeader title="Ofertas flash" icon={<Flame size={16} style={{ color: "var(--antojo)" }} />} subtitle="Termina en 01:59:42" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.filter((r: any) => r.promo).slice(0, 6).map((r: any) => (
            <RestaurantCard key={r.id} r={r} onClick={() => setSelectedRestaurant(r.id)} />
          ))}
        </div>
      </section>

      {/* ---------- All restaurants (filtered by category + sort) ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight sm:text-xl">
              {searchQuery ? `Resultados para "${searchQuery}"` : activeCategory !== "Todas" ? activeCategory : "Todos los restaurantes"}
            </h2>
            <p className="text-xs text-muted-foreground">{restaurants.length} lugares {activeCategory !== "Todas" ? "en esta categoría" : "abiertos cerca"}</p>
          </div>
          <div className="flex gap-1.5">
            {activeCategory !== "Todas" && (
              <button onClick={() => setActiveCategory("Todas")} className="flex items-center gap-1 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold">
                ✕ Quitar filtro
              </button>
            )}
            <select value={activeSort} onChange={(e) => setActiveSort(e.target.value)} className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold outline-none">
              <option value="recommended">Recomendados</option>
              <option value="rating">Mejor calificados</option>
              <option value="fast">Más rápidos</option>
              <option value="price">Más económicos</option>
            </select>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0,1,2,3,4,5].map(i => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            <UtensilsCrossed size={32} className="mx-auto mb-2 opacity-50" />
            No encontramos restaurantes. Prueba con otra búsqueda o categoría.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map((r: any) => (
              <RestaurantCard key={r.id} r={r} onClick={() => setSelectedRestaurant(r.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight sm:text-xl">
          {icon}{title}
        </h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, color, onClick }: { icon: any; label: string; desc: string; color: string; onClick?: () => void }) {
  const bg: Record<string, string> = {
    antojo: "bg-antojo-gradient", mango: "bg-mango-gradient", mora: "bg-mora-gradient", lima: "bg-lima-gradient",
  };
  return (
    <button onClick={onClick} className="group flex items-center gap-2.5 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white", bg[color])}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

import { toast } from "sonner";

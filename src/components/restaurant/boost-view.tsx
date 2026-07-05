"use client";

import { useState } from "react";
import { useRestaurantPosts, useCreateRestaurantPost, useRestaurantAds, useSponsorPost, useBoostPlan, useRestaurant } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Sparkles, ImagePlus, Rocket, Crown, Check, Flame, Heart, Eye, Megaphone, Users } from "lucide-react";
import { cop, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FOOD_IMAGES = [
  "https://sfile.chatglm.cn/images-ppt/e7bc8c902f79.jpg",
  "https://sfile.chatglm.cn/images-ppt/6437044a5039.jpg",
  "https://sfile.chatglm.cn/images-ppt/1a2f11106c7f.jpg",
  "https://sfile.chatglm.cn/images-ppt/d6cc7d62b2e3.jpg",
];

export function BoostView() {
  const [tab, setTab] = useState<"impulsa" | "comunidad">("impulsa");
  const { data: adsInfo } = useRestaurantAds();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <TrendingUp size={22} style={{ color: "var(--mora)" }} /> Impulsa tu restaurante
        </h1>
        <p className="text-sm text-muted-foreground">Crece con Ads y contenido social</p>
      </div>

      {/* Plan card */}
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, var(--mora), oklch(0.4 0.15 320))" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Tu plan actual</p>
              <p className="font-display text-2xl font-black capitalize">{adsInfo?.plan ?? "free"}</p>
            </div>
            <Crown size={28} style={{ color: "var(--mango)" }} />
          </div>
          {adsInfo && <p className="mt-1 text-sm opacity-80">Posts patrocinados: {adsInfo.sponsoredUsed} usados · {adsInfo.remaining} disponibles</p>}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1.5">
        <button onClick={() => setTab("impulsa")} className={cn("flex-1 rounded-xl border py-2.5 text-sm font-semibold transition", tab === "impulsa" ? "" : "border-border/60 bg-card text-muted-foreground")} style={tab === "impulsa" ? { borderColor: "var(--mora)", background: "oklch(0.55 0.22 340 / 0.08)", color: "var(--mora)" } : undefined}>
          <Megaphone size={15} className="inline" /> Ads
        </button>
        <button onClick={() => setTab("comunidad")} className={cn("flex-1 rounded-xl border py-2.5 text-sm font-semibold transition", tab === "comunidad" ? "" : "border-border/60 bg-card text-muted-foreground")} style={tab === "comunidad" ? { borderColor: "var(--mora)", background: "oklch(0.55 0.22 340 / 0.08)", color: "var(--mora)" } : undefined}>
          <Users size={15} className="inline" /> Comunidad
        </button>
      </div>

      {tab === "impulsa" && <ImpulsaTab adsInfo={adsInfo} />}
      {tab === "comunidad" && <ComunidadTab />}
    </div>
  );
}

function ImpulsaTab({ adsInfo }: { adsInfo: any }) {
  const boostMut = useBoostPlan();
  const plans = [
    { id: "free", name: "Free", price: 0, commission: "15%", sponsored: "0 posts", stories: "3/día", features: ["5 posts/mes", "Analítica básica"] },
    { id: "pro", name: "Pro", price: 49900, commission: "12%", sponsored: "3 posts", stories: "Ilimitadas", features: ["20 posts/mes", "3 posts patrocinados", "Analítica avanzada"], popular: true },
    { id: "premium", name: "Premium", price: 99900, commission: "10%", sponsored: "10 posts", stories: "Ilimitadas + destacadas", features: ["Posts ilimitados", "10 posts patrocinados", "Analítica pro + audiencia"] },
  ];

  return (
    <div className="space-y-4">
      {/* Plans */}
      <div className="grid gap-2 sm:grid-cols-3">
        {plans.map((p) => {
          const active = adsInfo?.plan === p.id;
          return (
            <Card key={p.id} className={cn("relative p-4 shadow-soft", p.popular && "ring-2")} style={p.popular ? { borderColor: "var(--mora)" } : undefined}>
              {p.popular && <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--mora)" }}>POPULAR</span>}
              <p className="font-display text-lg font-extrabold">{p.name}</p>
              <p className="text-xs text-muted-foreground">Comisión {p.commission}</p>
              <p className="mt-2 font-display text-2xl font-black">{p.price === 0 ? "Gratis" : cop(p.price)}<span className="text-xs font-normal text-muted-foreground">/mes</span></p>
              <ul className="mt-3 space-y-1">
                <li className="flex items-center gap-1.5 text-xs"><Rocket size={12} style={{ color: "var(--mora)" }} /> {p.sponsored} patrocinados</li>
                <li className="flex items-center gap-1.5 text-xs"><Sparkles size={12} style={{ color: "var(--mora)" }} /> Historias {p.stories}</li>
                {p.features.map((f, i) => <li key={i} className="flex items-center gap-1.5 text-xs"><Check size={12} style={{ color: "var(--lima)" }} /> {f}</li>)}
              </ul>
              <Button className="mt-3 w-full rounded-xl" disabled={active || boostMut.isPending} variant={active ? "outline" : "default"} style={!active ? { background: "var(--mora)", color: "white" } : undefined} onClick={() => { boostMut.mutate(p.id); toast.success(`Plan ${p.name} activado 🎉`); }}>
                {active ? "Plan actual" : `Mejorar a ${p.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Sponsor posts */}
      <SponsorPosts adsInfo={adsInfo} />
    </div>
  );
}

function SponsorPosts({ adsInfo }: { adsInfo: any }) {
  const { data: postsData, isLoading } = useRestaurantPosts();
  const sponsorMut = useSponsorPost();
  const posts = postsData?.posts ?? [];

  return (
    <Card className="p-4 shadow-soft">
      <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><Megaphone size={16} style={{ color: "var(--mora)" }} /> Patrocinar posts</h3>
      {adsInfo && !adsInfo.canSponsor && <p className="mb-3 rounded-lg bg-secondary/50 p-2 text-xs text-muted-foreground">{adsInfo.reason ?? "Mejora tu plan para patrocinar posts."}</p>}
      {isLoading ? <div className="space-y-2">{[0,1].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div> : posts.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Aún no tienes posts. Crea uno en la pestaña Comunidad.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5">
              <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.caption}</p><p className="text-xs text-muted-foreground">{p.isSponsored ? <><Flame size={11} className="inline" style={{ color: "var(--mango)" }} /> Patrocinado</> : timeAgo(p.createdAt)}</p></div>
              <Button size="sm" variant="outline" className="rounded-full" disabled={!adsInfo?.canSponsor || p.isSponsored || sponsorMut.isPending} onClick={() => { sponsorMut.mutate(p.id); toast.success("Post patrocinado por 7 días 🔥"); }}>
                {p.isSponsored ? "Activo" : "Patrocinar"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ComunidadTab() {
  const { data: postsData, isLoading } = useRestaurantPosts();
  const createMut = useCreateRestaurantPost();
  const [imageUrl, setImageUrl] = useState(FOOD_IMAGES[0]);
  const [caption, setCaption] = useState("");

  const posts = postsData?.posts ?? [];

  const handleCreate = async () => {
    if (!caption.trim()) { toast.error("Escribe un caption"); return; }
    try { await createMut.mutateAsync({ imageUrl, caption, menuItemId: null }); setCaption(""); toast.success("¡Post publicado en la Comunidad! 🎉"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* Create post */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><ImagePlus size={16} style={{ color: "var(--mora)" }} /> Crear post</h3>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FOOD_IMAGES.map((img) => (
            <button key={img} onClick={() => setImageUrl(img)} className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition", imageUrl === img ? "" : "ring-transparent opacity-60")} style={imageUrl === img ? { boxShadow: "0 0 0 2px var(--mora)" } : undefined}>
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escribe un caption... Ej: 'Big Doble Bacon 2x1 solo hoy 🔥'" className="mb-3 w-full resize-none rounded-xl border border-border/60 bg-secondary/40 p-3 text-sm outline-none focus:ring-2 focus:ring-ring" rows={2} />
        <Button className="w-full rounded-xl" style={{ background: "var(--mora)", color: "white" }} disabled={createMut.isPending} onClick={handleCreate}>
          {createMut.isPending ? "Publicando…" : "Publicar post"}
        </Button>
      </Card>

      {/* My posts */}
      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 font-display font-bold">Mis posts ({posts.length})</h3>
        {isLoading ? <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div> : posts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aún no tienes posts. Crea el primero arriba 👆</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {posts.map((p: any) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl">
                <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1 right-1 flex items-center gap-2 text-white">
                  <span className="flex items-center gap-0.5 text-[10px]"><Heart size={10} className="fill-current" /> {p.likes}</span>
                  {p.isSponsored && <span className="rounded-full bg-mango px-1 py-0.5 text-[8px] font-bold" style={{ background: "var(--mango)", color: "var(--cafe)" }}>AD</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

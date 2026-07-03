"use client";

import { Clock, Bike, Heart, UserPlus, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StarRating, Price } from "./star-rating";
import type { Restaurant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { useToggleFavorite, useToggleFollow } from "@/hooks/use-data";
import { toast } from "sonner";

const coverGradients: Record<string, string> = {
  antojo: "bg-antojo-gradient",
  mango: "bg-mango-gradient",
  mora: "bg-mora-gradient",
  lima: "bg-lima-gradient",
  cafe: "bg-cafe-gradient",
};

export function RestaurantCard({ r, onClick, className }: { r: any; onClick?: () => void; className?: string }) {
  const favoriteIds = useApp((s) => s.favoriteIds);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const toggleFavMut = useToggleFavorite();
  const followIds = useApp((s) => s.followIds);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const toggleFollowMut = useToggleFollow();
  const authUser = useApp((s) => s.authUser);
  const isFav = favoriteIds.includes(r.id);
  const isFollowing = followIds.includes(r.id);

  const onHeart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || authUser.role !== "cliente") { toast("Inicia sesión como cliente para guardar favoritos"); return; }
    toggleFavorite(r.id);
    toggleFavMut.mutate(r.id);
    toast.success(isFav ? "Quitado de favoritos" : "Añadido a favoritos ❤️");
  };

  const onFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUser || authUser.role !== "cliente") { toast("Inicia sesión como cliente para seguir restaurantes"); return; }
    toggleFollow(r.id);
    toggleFollowMut.mutate(r.id);
    toast.success(isFollowing ? "Dejaste de seguir" : `Siguiendo a ${r.name} ✓`);
  };

  return (
    <Card
      onClick={onClick}
      className={cn("group cursor-pointer overflow-hidden border-border/60 p-0 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow", className)}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className={cn("absolute inset-0", coverGradients[r.coverColor] ?? "bg-antojo-gradient")} />
        <img
          src={r.imageUrl}
          alt={r.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {r.promo && (
          <span className="absolute left-2 top-2 rounded-full bg-mango px-2.5 py-1 text-[11px] font-bold shadow-soft" style={{ background: "var(--mango)", color: "var(--cafe)" }}>
            🔥 {r.promo}
          </span>
        )}
        {authUser?.role === "cliente" && (
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button onClick={onFollow} className="grid h-8 w-8 place-items-center rounded-full glass shadow-soft transition hover:scale-110" aria-label="Seguir">
              {isFollowing ? <UserCheck size={15} style={{ color: "var(--lima)" }} /> : <UserPlus size={15} className="text-white" />}
            </button>
            <button onClick={onHeart} className="grid h-8 w-8 place-items-center rounded-full glass shadow-soft transition hover:scale-110" aria-label="Favorito">
              <Heart size={15} className={cn("transition", isFav ? "fill-current" : "")} style={{ color: isFav ? "var(--antojo)" : "white" }} />
            </button>
          </div>
        )}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-white">
          <p className="text-[11px] font-medium opacity-90">{r.cuisine}</p>
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-foreground">
            <Clock size={11} /> {r.deliveryMin} min
          </span>
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-bold leading-tight line-clamp-1">{r.name}</h3>
          <StarRating value={r.rating} count={r.reviewCount} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{r.neighborhood} · {"$".repeat(r.priceLevel)}</p>
        <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
          <Bike size={13} style={{ color: "var(--lima)" }} />
          <span>Envío <Price value={r.deliveryFee} className={r.deliveryFee === 0 ? "font-semibold" : ""} /></span>
        </div>
      </div>
    </Card>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 p-0">
      <div className="aspect-[16/10] bg-muted shimmer" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-2/3 rounded bg-muted shimmer" />
        <div className="h-3 w-1/2 rounded bg-muted shimmer" />
      </div>
    </Card>
  );
}

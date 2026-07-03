"use client";

import { useFavorites } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { RestaurantCard, RestaurantCardSkeleton } from "@/components/shared/restaurant-card";
import { Card } from "@/components/ui/card";
import { Heart, ChevronLeft } from "lucide-react";

export function Favorites() {
  const { data, isLoading } = useFavorites();
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const favorites = data?.favorites ?? [];

  return (
    <div className="px-3 pt-4 sm:px-5 lg:px-0">
      <button onClick={() => setCustomerView("discover")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} /> Volver a explorar
      </button>
      <h1 className="mb-4 flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
        <Heart size={22} className="fill-current" style={{ color: "var(--antojo)" }} /> Favoritos
      </h1>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{[0,1,2,3].map(i => <RestaurantCardSkeleton key={i} />)}</div>
      ) : favorites.length === 0 ? (
        <Card className="p-10 text-center">
          <Heart size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">Aún no tienes favoritos</p>
          <p className="text-sm text-muted-foreground">Toca el corazón en un restaurante para guardarlo aquí.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((f: any) => <RestaurantCard key={f.restaurantId} r={f.restaurant} onClick={() => setSelectedRestaurant(f.restaurantId)} />)}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { useFavorites } from "@/hooks/use-data";
import { Discover } from "./discover";
import { RestaurantView } from "./restaurant-view";
import { Checkout } from "./checkout";
import { Tracking } from "./tracking";
import { Orders } from "./orders";
import { Rewards } from "./rewards";
import { Prime } from "./prime";
import { Assistant } from "./assistant";
import { Favorites } from "./favorites";
import { NotificationsView } from "./notifications-view";
import { Profile } from "./profile";

export function CustomerApp() {
  const view = useApp((s) => s.customerView);
  const setFavoriteIds = useApp((s) => s.setFavoriteIds);
  const { data: favData } = useFavorites();
  useEffect(() => {
    if (favData?.ids) setFavoriteIds(favData.ids);
  }, [favData?.ids, setFavoriteIds]);

  switch (view) {
    case "discover": return <Discover />;
    case "restaurant": return <RestaurantView />;
    case "checkout": return <Checkout />;
    case "tracking": return <Tracking />;
    case "orders": return <Orders />;
    case "rewards": return <Rewards />;
    case "prime": return <Prime />;
    case "assistant": return <Assistant />;
    case "favorites": return <Favorites />;
    case "notifications": return <NotificationsView />;
    case "profile": return <Profile />;
    default: return <Discover />;
  }
}

"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";
import { useFavorites, useFollows } from "@/hooks/use-data";
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
import { Community } from "./community";
import { GroupOrderView } from "./group-order-view";

export function CustomerApp() {
  const view = useApp((s) => s.customerView);
  const setFavoriteIds = useApp((s) => s.setFavoriteIds);
  const setFollowIds = useApp((s) => s.setFollowIds);
  const { data: favData } = useFavorites();
  const { data: followData } = useFollows();
  useEffect(() => { if (favData?.ids) setFavoriteIds(favData.ids); }, [favData?.ids, setFavoriteIds]);
  useEffect(() => { if (followData?.ids) setFollowIds(followData.ids); }, [followData?.ids, setFollowIds]);

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
    case "community": return <Community />;
    case "groupOrder": return <GroupOrderView />;
    default: return <Discover />;
  }
}

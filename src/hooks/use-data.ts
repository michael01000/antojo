"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { CartItem, Order, OrderStatus } from "@/lib/types";

// ---------- Auth ----------
export function useAuthMe() {
  return useQuery({ queryKey: ["auth-me"], queryFn: () => api.get<{ user: any | null }>("/api/auth/me"), staleTime: 60_000 });
}
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post<{ user: any }>("/api/auth/login", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });
}
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ user: any }>("/api/auth/register", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/auth/logout"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });
}
export function useOtpSend() {
  return useMutation({ mutationFn: (phone: string) => api.post<{ sent: boolean; devCode: string }>("/api/auth/otp/send", { phone }) });
}
export function useOtpVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { phone: string; code: string; role: string }) => api.post<{ user: any }>("/api/auth/otp/verify", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });
}
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.patch<{ user: any }>("/api/auth/profile", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-me"] }),
  });
}

// ---------- Customer ----------
export function useCustomer() {
  return useQuery({
    queryKey: ["customer"],
    queryFn: () => api.get<{ customer: any; loyalty: any; subscription: any; addresses: any[] }>("/api/customer"),
  });
}

export function useRestaurants() {
  const searchQuery = useApp((s) => s.searchQuery);
  const activeCategory = useApp((s) => s.activeCategory);
  const activeSort = useApp((s) => s.activeSort);
  const params = new URLSearchParams();
  if (searchQuery) params.set("q", searchQuery);
  if (activeCategory && activeCategory !== "Todas") params.set("cuisine", activeCategory);
  if (activeSort && activeSort !== "recommended") params.set("sort", activeSort);
  const qs = params.toString();
  return useQuery({
    queryKey: ["restaurants", searchQuery, activeCategory, activeSort],
    queryFn: () => api.get<{ restaurants: any[] }>(`/api/restaurants${qs ? `?${qs}` : ""}`),
  });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api.get<{ categories: any[] }>("/api/categories") });
}

export function useRestaurant(id: string | null) {
  return useQuery({
    enabled: !!id,
    queryKey: ["restaurant", id],
    queryFn: () => api.get<{ restaurant: any; menu: Record<string, any[]> }>(`/api/restaurants/${id}`),
  });
}

export function usePopular() {
  return useQuery({ queryKey: ["popular"], queryFn: () => api.get<{ items: any[] }>("/api/popular") });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => api.get<{ recommendations: { restaurantId: string; reason: string }[]; source: string }>("/api/ai/recommend"),
    staleTime: 60_000,
  });
}

export function useLoyalty() {
  return useQuery({ queryKey: ["loyalty"], queryFn: () => api.get<any>("/api/loyalty") });
}

export function usePromotions() {
  return useQuery({ queryKey: ["promotions"], queryFn: () => api.get<{ promotions: any[] }>("/api/promotions") });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get<{ orders: Order[] }>("/api/orders"),
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    enabled: !!id,
    queryKey: ["order", id],
    queryFn: () => api.get<{ order: Order }>(`/api/orders/${id}`),
    refetchInterval: (q) => {
      const st = (q.state.data as any)?.order?.status;
      return st && !["delivered", "cancelled"].includes(st) ? 5000 : false;
    },
  });
}

export function useOrderMessages(orderId: string | null) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ["messages", orderId],
    queryFn: () => api.get<{ messages: any[] }>(`/api/orders/${orderId}/messages`),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ order: Order }>("/api/orders", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["loyalty"] });
    },
  });
}

export function useValidatePromo() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      api.post<{ valid: boolean; discount: number; freeDelivery: boolean; error?: string }>("/api/promotions", { code, subtotal }),
  });
}

export function useRateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, rating, comment }: { orderId: string; rating: number; comment?: string }) =>
      api.patch<{ order: Order }>(`/api/orders/${orderId}`, { rating, comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, sender, text }: { orderId: string; sender: string; text: string }) =>
      api.post<{ message: any }>(`/api/orders/${orderId}/messages`, { sender, text }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["messages", v.orderId] }),
  });
}

// ---------- Driver ----------
export function useDriverOrders() {
  return useQuery({
    queryKey: ["driver-orders"],
    queryFn: () => api.get<{ available: Order[]; active: Order | null; driver: any }>("/api/driver/orders"),
    refetchInterval: 6000,
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.post<{ order: Order }>("/api/driver/orders", { orderId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-orders"] }),
  });
}

export function useToggleDriverOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (online: boolean) => api.patch<{ driver: any }>("/api/driver/toggle", { online }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-orders"] }),
  });
}

export function useCompleteDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.patch<{ ok: boolean }>("/api/driver/location", { orderId, action: "complete" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-orders"] }),
  });
}

// ---------- Restaurant ----------
export function useRestaurantOrders(restaurantId?: string | null) {
  return useQuery({
    queryKey: ["restaurant-orders", restaurantId ?? "demo"],
    queryFn: () => api.get<{ restaurant: any; orders: Order[] }>(`/api/restaurant/orders${restaurantId ? `?restaurantId=${restaurantId}` : ""}`),
    refetchInterval: 5000,
  });
}

export function useToggleMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      api.patch<{ menuItem: any }>(`/api/restaurant/menu/${id}`, { isAvailable }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu"] }),
  });
}
export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ menuItem: any }>("/api/restaurant/menu", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu"] }),
  });
}
export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & any) =>
      api.patch<{ menuItem: any }>(`/api/restaurant/menu/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu"] }),
  });
}
export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/api/restaurant/menu/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["restaurant-menu"] }),
  });
}

export function useAllRestaurants() {
  return useQuery({ queryKey: ["all-restaurants"], queryFn: () => api.get<{ restaurants: any[] }>("/api/admin/restaurants") });
}

// ---------- Admin ----------
export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<any>("/api/admin/stats"),
    refetchInterval: 8000,
  });
}

export function useAdminOrders() {
  return useQuery({ queryKey: ["admin-orders"], queryFn: () => api.get<{ orders: Order[] }>("/api/admin/orders") });
}

export function useAdminDrivers() {
  return useQuery({ queryKey: ["admin-drivers"], queryFn: () => api.get<{ drivers: any[] }>("/api/admin/drivers") });
}

// ---------- Status updates (used by all roles) ----------
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status, driverId, driverLat, driverLng, etaMin }: {
      orderId: string; status?: OrderStatus; driverId?: string;
      driverLat?: number; driverLng?: number; etaMin?: number;
    }) => api.patch<{ order: Order }>(`/api/orders/${orderId}/status`, { status, driverId, driverLat, driverLng, etaMin }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["driver-orders"] });
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ---------- AI chat ----------
export function useAIChat() {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: { role: string; content: string }[] }) =>
      api.post<{ reply: string }>("/api/ai/chat", { message, history }),
  });
}

// ---------- Favorites ----------
export function useFavorites() {
  return useQuery({ queryKey: ["favorites"], queryFn: () => api.get<{ favorites: any[]; ids: string[] }>("/api/favorites") });
}
export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => api.post<{ favorited: boolean }>("/api/favorites", { restaurantId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });
}

// ---------- Notifications ----------
export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: () => api.get<{ notifications: any[]; unread: number }>("/api/notifications"), refetchInterval: 15000 });
}
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/api/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ---------- Restaurant reviews ----------
export function useRestaurantReviews(id: string | null) {
  return useQuery({
    enabled: !!id,
    queryKey: ["reviews", id],
    queryFn: () => api.get<{ reviews: any[] }>(`/api/restaurants/${id}/reviews`),
  });
}

// ---------- Restaurant / Driver registration ----------
export function useRegisterRestaurant() {
  return useMutation({ mutationFn: (body: any) => api.post<{ restaurant: any }>("/api/restaurants/register", body) });
}
export function useOnboardDriver() {
  return useMutation({ mutationFn: (body: any) => api.post<{ driver: any }>("/api/driver/onboard", body) });
}

// ---------- Admin management ----------
export function useAdminUsers() {
  return useQuery({ queryKey: ["admin-users"], queryFn: () => api.get<{ users: any[] }>("/api/admin/users") });
}
export function useApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: "restaurant" | "driver"; id: string; action: "approve" | "suspend" | "delete" }) =>
      api.post<{ ok: boolean }>("/api/admin/approve", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
      qc.invalidateQueries({ queryKey: ["admin-drivers"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ---------- Admin Audit (rentabilidad + kill-switch) ----------
export function useAdminAudit() {
  return useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => api.get<any>("/api/admin/audit"),
    refetchInterval: 60000, // refresca cada minuto para monitoreo
  });
}
export function useRefreshAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/admin/audit"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-audit"] }),
  });
}

// ---------- Earnings (Restaurante + Admin) ----------
export function useRestaurantEarnings() {
  return useQuery({ queryKey: ["restaurant-earnings"], queryFn: () => api.get<any>("/api/restaurant/earnings") });
}
export function useAdminEarnings() {
  return useQuery({ queryKey: ["admin-earnings"], queryFn: () => api.get<any>("/api/admin/earnings"), refetchInterval: 30000 });
}
export function useAdminProfitability() {
  return useQuery({ queryKey: ["admin-profitability"], queryFn: () => api.get<any>("/api/admin/profitability"), refetchInterval: 30000 });
}

// ---------- Rewards (Coins) ----------
export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => api.post<{ ok: boolean; coupon: any; coinsRemaining: number; primeActivated: boolean }>("/api/rewards/redeem", { rewardId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loyalty"] });
      qc.invalidateQueries({ queryKey: ["coupons"] });
      qc.invalidateQueries({ queryKey: ["customer"] });
    },
  });
}
export function useMyCoupons() {
  return useQuery({ queryKey: ["coupons"], queryFn: () => api.get<{ coupons: any[] }>("/api/rewards/coupons") });
}

// ---------- Smart Reorder ----------
export function useSmartReorder() {
  return useQuery({ queryKey: ["smart-reorder"], queryFn: () => api.get<{ suggestion: any }>("/api/smart-reorder"), staleTime: 60000 });
}

// ---------- Combo Builder AI ----------
export function useComboBuilder() {
  return useMutation({
    mutationFn: ({ budget, people, preference }: { budget: number; people?: number; preference?: string }) =>
      api.post<{ combo: any[]; total: number; reason: string; source: string }>("/api/ai/combo-builder", { budget, people, preference }),
  });
}

// ---------- Wallet ----------
export function useWallet() {
  return useQuery({ queryKey: ["wallet"], queryFn: () => api.get<{ wallet: any }>("/api/wallet") });
}
export function useTopUpWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => api.post<{ ok: boolean; newBalance: number; bonus: number }>("/api/wallet", { amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });
}

// ---------- Split Payment ----------
export function usePayShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, paymentMethod }: { code: string; paymentMethod: string }) =>
      api.post<{ ok: boolean; myTotal: number; allPaid: boolean }>(`/api/group-orders/${code}/pay-share`, { paymentMethod }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["group-order", v.code] }),
  });
}

// ---------- Chef's Drops ----------
export function useChefDrops() {
  return useQuery({ queryKey: ["chef-drops"], queryFn: () => api.get<{ drops: any[] }>("/api/chef-drops"), refetchInterval: 30000 });
}

// ---------- Missions ----------
export function useDailyMission() {
  return useQuery({ queryKey: ["mission"], queryFn: () => api.get<{ mission: any }>("/api/missions") });
}
export function useCompleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<{ ok: boolean; reward: number }>("/api/missions"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mission"] }); qc.invalidateQueries({ queryKey: ["loyalty"] }); },
  });
}

// ---------- Driver Leaderboard ----------
export function useDriverLeaderboard() {
  return useQuery({ queryKey: ["driver-leaderboard"], queryFn: () => api.get<any>("/api/driver/leaderboard") });
}

// ---------- Eco ----------
export function useEcoStats() {
  return useQuery({ queryKey: ["eco"], queryFn: () => api.get<{ eco: any }>("/api/eco") });
}

// ---------- Business ----------
export function useBusinessAccount() {
  return useQuery({ queryKey: ["business"], queryFn: () => api.get<{ business: any }>("/api/business") });
}
export function useRegisterBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ business: any }>("/api/business/register", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business"] }),
  });
}

// ---------- Fase 2: Referidos + Respuesta Reseñas ----------
export function useReferrals() {
  return useQuery({ queryKey: ["referrals"], queryFn: () => api.get<{ referral: any }>("/api/referrals") });
}
export function useApplyReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => api.post<{ ok: boolean; message: string }>("/api/referrals", { code }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["referrals"] }); qc.invalidateQueries({ queryKey: ["loyalty"] }); },
  });
}
export function useReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => api.patch<{ ok: boolean }>(`/api/reviews/${id}/reply`, { reply }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

// ---------- Fase 3: Filtros nutricionales + Propina post-entrega ----------
export function usePostDeliveryTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, amount }: { orderId: string; amount: number }) =>
      api.patch<{ ok: boolean }>(`/api/orders/${orderId}`, { tipPostDelivery: amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
  });
}

// ---------- Fase 4: Mood Ordering ----------
export function useMoodRecommendations() {
  return useMutation({
    mutationFn: (mood: string) => api.post<{ recommendations: any[] }>("/api/ai/mood", { mood }),
  });
}

// ---------- Social: Posts ----------
export function usePostsFeed(tab: "following" | "explore" = "following") {
  return useQuery({
    queryKey: ["posts-feed", tab],
    queryFn: () => api.get<{ posts: any[] }>(`/api/posts/feed?tab=${tab}`),
    refetchInterval: 30000,
  });
}
export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post<{ liked: boolean }>(`/api/posts/${postId}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts-feed"] }),
  });
}

// ---------- Social: Stories ----------
export function useStories() {
  return useQuery({ queryKey: ["stories"], queryFn: () => api.get<{ groups: any[] }>("/api/stories"), refetchInterval: 60000 });
}
export function useMarkStoryViewed() {
  return useMutation({ mutationFn: (storyId: string) => api.patch<{ ok: boolean }>("/api/stories", { storyId }) });
}

// ---------- Social: Follows ----------
export function useFollows() {
  return useQuery({ queryKey: ["follows"], queryFn: () => api.get<{ follows: any[]; ids: string[] }>("/api/follows") });
}
export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (restaurantId: string) => api.post<{ following: boolean }>("/api/follows", { restaurantId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["follows"] }); qc.invalidateQueries({ queryKey: ["posts-feed"] }); },
  });
}

// ---------- Group Orders ----------
export function useGroupOrder(code: string | null) {
  return useQuery({
    enabled: !!code,
    queryKey: ["group-order", code],
    queryFn: () => api.get<{ groupOrder: any }>(`/api/group-orders?code=${code}`),
    refetchInterval: 4000,
  });
}
export function useCreateGroupOrder() {
  return useMutation({ mutationFn: (restaurantId: string) => api.post<{ groupOrder: any }>("/api/group-orders", { restaurantId }) });
}
export function useAddGroupItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, ...body }: { code: string } & any) => api.post<{ item: any }>(`/api/group-orders/${code}/items`, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["group-order", v.code] }),
  });
}
export function useRemoveGroupItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, itemId }: { code: string; itemId: string }) => api.del(`/api/group-orders/${code}/items?itemId=${itemId}`),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["group-order", v.code] }),
  });
}
export function useCheckoutGroupOrder() {
  return useMutation({
    mutationFn: ({ code, ...body }: { code: string } & any) => api.post<{ order: any }>(`/api/group-orders/${code}/checkout`, body),
  });
}

// ---------- Addresses ----------
export function useAddresses() {
  return useQuery({ queryKey: ["addresses"], queryFn: () => api.get<{ addresses: any[] }>("/api/addresses") });
}
export function useAddAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ address: any }>("/api/addresses", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & any) => api.patch<{ address: any }>(`/api/addresses/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}
export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/api/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses"] }),
  });
}

// ---------- Restaurant Social + Ads ----------
export function useRestaurantPosts() {
  return useQuery({ queryKey: ["restaurant-posts"], queryFn: () => api.get<{ posts: any[] }>("/api/restaurant/posts") });
}
export function useCreateRestaurantPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api.post<{ post: any }>("/api/restaurant/posts", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["restaurant-posts"] }); qc.invalidateQueries({ queryKey: ["posts-feed"] }); },
  });
}
export function useRestaurantAds() {
  return useQuery({ queryKey: ["restaurant-ads"], queryFn: () => api.get<any>("/api/restaurant/ads") });
}
export function useSponsorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post<{ ok: boolean }>("/api/restaurant/ads", { postId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["restaurant-ads"] }); qc.invalidateQueries({ queryKey: ["restaurant-posts"] }); },
  });
}
export function useBoostPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: string) => api.post<{ ok: boolean }>("/api/restaurant/boost", { plan }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["restaurant-ads"] }); },
  });
}

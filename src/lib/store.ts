"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, CartItem } from "./types";

export type CustomerView =
  | "discover"
  | "restaurant"
  | "checkout"
  | "tracking"
  | "orders"
  | "rewards"
  | "prime"
  | "assistant"
  | "community"
  | "groupOrder";

export type RestaurantView = "orders" | "menu" | "boost" | "earnings" | "analytics" | "profile";

export type DriverView = "home" | "earnings" | "active";
export type AdminView = "overview" | "orders" | "earnings" | "profitability" | "restaurants" | "drivers" | "promos";

interface AuthUser {
  id: string; email: string; name: string; role: Role; avatarColor: string; phone: string | null; city: string; provider: string; verified: boolean; profileId: string | null;
}

interface AppState {
  // Auth
  authUser: AuthUser | null;
  authStatus: "loading" | "unauthed" | "authed";
  setAuth: (u: AuthUser | null) => void;
  logout: () => void;
  // Pre-auth view: landing (marketing home) → login
  preAuthView: "landing" | "login";
  setPreAuthView: (v: "landing" | "login") => void;
  // Derived role (from auth; falls back to "cliente")
  role: Role;
  setRole: (r: Role) => void;

  // Customer
  customerView: CustomerView;
  setCustomerView: (v: CustomerView) => void;
  selectedRestaurantId: string | null;
  setSelectedRestaurant: (id: string | null) => void;
  cart: CartItem[];
  cartRestaurantId: string | null;
  addToCart: (item: CartItem) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  // group ordering
  groupMode: boolean;
  setGroupMode: (v: boolean) => void;
  // promo applied at checkout
  appliedPromoCode: string | null;
  setAppliedPromoCode: (s: string | null) => void;
  primeMember: boolean;
  setPrimeMember: (v: boolean) => void;
  // search query
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  // active category filter + sort
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  activeSort: string;
  setActiveSort: (s: string) => void;
  // favorites cache (ids)
  favoriteIds: string[];
  setFavoriteIds: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  // follows cache (ids)
  followIds: string[];
  setFollowIds: (ids: string[]) => void;
  toggleFollow: (id: string) => void;
  // active group order code
  activeGroupOrderCode: string | null;
  setActiveGroupOrderCode: (code: string | null) => void;

  // Driver
  driverView: DriverView;
  setDriverView: (v: DriverView) => void;
  driverOnline: boolean;
  setDriverOnline: (v: boolean) => void;

  // Restaurant
  restaurantView: RestaurantView;
  setRestaurantView: (v: RestaurantView) => void;

  // Admin
  adminView: AdminView;
  setAdminView: (v: AdminView) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  resetForRole: (r: Role) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      authUser: null,
      authStatus: "loading",
      setAuth: (u) => set({ authUser: u, authStatus: u ? "authed" : "unauthed", role: u?.role ?? "cliente" }),
      logout: () => set({ authUser: null, authStatus: "unauthed", role: "cliente", cart: [], cartRestaurantId: null, customerView: "discover", driverView: "home", restaurantView: "orders", adminView: "overview", preAuthView: "landing" }),
      preAuthView: "landing",
      setPreAuthView: (v) => set({ preAuthView: v }),
      role: "cliente",
      setRole: (r) => set({ role: r }),

      customerView: "discover",
      setCustomerView: (v) => set({ customerView: v }),
      selectedRestaurantId: null,
      setSelectedRestaurant: (id) => set({ selectedRestaurantId: id, customerView: id ? "restaurant" : "discover" }),
      activeCategory: "Todas",
      setActiveCategory: (c) => set({ activeCategory: c }),
      activeSort: "recommended",
      setActiveSort: (s) => set({ activeSort: s }),
      favoriteIds: [],
      setFavoriteIds: (ids) => set({ favoriteIds: ids }),
      toggleFavorite: (id) => {
        const cur = get().favoriteIds;
        set({ favoriteIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
      },
      followIds: [],
      setFollowIds: (ids) => set({ followIds: ids }),
      toggleFollow: (id) => {
        const cur = get().followIds;
        set({ followIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] });
      },
      activeGroupOrderCode: null,
      setActiveGroupOrderCode: (code) => set({ activeGroupOrderCode: code, customerView: code ? "groupOrder" : "discover" }),

      cart: [],
      cartRestaurantId: null,
      addToCart: (item) => {
        const state = get();
        if (state.cartRestaurantId && state.cartRestaurantId !== item.restaurantId) {
          // switching restaurant resets cart
          set({ cart: [item], cartRestaurantId: item.restaurantId });
          return;
        }
        const existing = state.cart.find((c) => c.menuItemId === item.menuItemId);
        if (existing) {
          set({
            cart: state.cart.map((c) =>
              c.menuItemId === item.menuItemId ? { ...c, qty: c.qty + item.qty } : c
            ),
          });
        } else {
          set({ cart: [...state.cart, item], cartRestaurantId: item.restaurantId });
        }
      },
      updateQty: (menuItemId, qty) => {
        const state = get();
        if (qty <= 0) {
          const newCart = state.cart.filter((c) => c.menuItemId !== menuItemId);
          set({ cart: newCart, cartRestaurantId: newCart.length ? state.cartRestaurantId : null });
        } else {
          set({ cart: state.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, qty } : c)) });
        }
      },
      clearCart: () => set({ cart: [], cartRestaurantId: null }),

      activeOrderId: null,
      setActiveOrderId: (id) => set({ activeOrderId: id }),

      groupMode: false,
      setGroupMode: (v) => set({ groupMode: v }),

      appliedPromoCode: null,
      setAppliedPromoCode: (s) => set({ appliedPromoCode: s }),

      primeMember: true,
      setPrimeMember: (v) => set({ primeMember: v }),

      searchQuery: "",
      setSearchQuery: (s) => set({ searchQuery: s }),

      driverView: "home",
      setDriverView: (v) => set({ driverView: v }),
      driverOnline: false,
      setDriverOnline: (v) => set({ driverOnline: v }),

      restaurantView: "orders",
      setRestaurantView: (v) => set({ restaurantView: v }),

      adminView: "overview",
      setAdminView: (v) => set({ adminView: v }),

      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      resetForRole: (r) => {
        if (r === "cliente") set({ customerView: "discover" });
        if (r === "domiciliario") set({ driverView: "home" });
        if (r === "restaurante") set({ restaurantView: "orders" });
        if (r === "admin") set({ adminView: "overview" });
      },
    }),
    {
      name: "antojo-store",
      partialize: (s) => ({
        theme: s.theme,
        primeMember: s.primeMember,
        driverOnline: s.driverOnline,
        cart: s.cart,
        cartRestaurantId: s.cartRestaurantId,
        activeCategory: s.activeCategory,
      }),
    }
  )
);

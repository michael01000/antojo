"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useRealtimeSync } from "@/hooks/use-realtime";
import { useAuthInit } from "@/hooks/use-auth-init";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { useLogout, useNotifications, useMarkNotificationRead } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./shared/brand-logo";
import { LoginScreen } from "./auth/login-screen";
import { LandingPage } from "./landing/landing-page";
import {
  Compass, Receipt, Gift, Crown, Sparkles, Bike, Wallet, Store, UtensilsCrossed,
  BarChart3, Tag, LayoutDashboard, TrendingUp, ShoppingCart, Moon, Sun,
  MapPin, Search as SearchIcon, Bell, Heart, User as UserIcon, LogOut, ChevronDown, CheckCheck, Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomerApp } from "./customer/customer-app";
import { DriverApp } from "./driver/driver-app";
import { RestaurantApp } from "./restaurant/restaurant-app";
import { AdminApp } from "./admin/admin-app";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

type NavItem = { view: string; label: string; icon: any };
const NAV: Record<string, NavItem[]> = {
  cliente: [
    { view: "discover", label: "Descubre", icon: Compass },
    { view: "orders", label: "Pedidos", icon: Receipt },
    { view: "favorites", label: "Favoritos", icon: Heart },
    { view: "rewards", label: "Recompensas", icon: Gift },
    { view: "prime", label: "Prime", icon: Crown },
    { view: "assistant", label: "Sazón AI", icon: Sparkles },
    { view: "notifications", label: "Avisos", icon: Bell },
    { view: "profile", label: "Perfil", icon: UserIcon },
  ],
  domiciliario: [
    { view: "home", label: "Inicio", icon: Compass },
    { view: "active", label: "Entrega", icon: Bike },
    { view: "earnings", label: "Ganancias", icon: Wallet },
    { view: "profile", label: "Perfil", icon: UserIcon },
  ],
  restaurante: [
    { view: "orders", label: "Pedidos", icon: Receipt },
    { view: "menu", label: "Menú", icon: UtensilsCrossed },
    { view: "analytics", label: "Analítica", icon: BarChart3 },
    { view: "promos", label: "Promos", icon: Tag },
    { view: "profile", label: "Perfil", icon: UserIcon },
  ],
  admin: [
    { view: "overview", label: "Resumen", icon: LayoutDashboard },
    { view: "orders", label: "Pedidos", icon: Receipt },
    { view: "restaurants", label: "Restaurantes", icon: Store },
    { view: "drivers", label: "Domiciliarios", icon: Bike },
    { view: "users", label: "Usuarios", icon: UserIcon },
    { view: "revenue", label: "Ingresos", icon: TrendingUp },
    { view: "promos", label: "Promos", icon: Tag },
  ],
};

const ROLE_STORE_PREFIX: Record<string, string> = {
  cliente: "customer", domiciliario: "driver", restaurante: "restaurant", admin: "admin",
};
const ROLE_LABEL: Record<string, string> = {
  cliente: "Cliente", domiciliario: "Domiciliario", restaurante: "Restaurante", admin: "Administrador",
};
const ROLE_COLOR: Record<string, string> = {
  cliente: "var(--antojo)", domiciliario: "var(--lima)", restaurante: "var(--mora)", admin: "var(--cafe)",
};

export function AppShell() {
  const { authStatus } = useAuthInit();
  const role = useApp((s) => s.role);
  const authUser = useApp((s) => s.authUser);
  const preAuthView = useApp((s) => s.preAuthView);
  useRealtimeSync();
  useServiceWorker();

  // Apply theme class to html
  const theme = useApp((s) => s.theme);
  const toggleTheme = useApp((s) => s.toggleTheme);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  // Gate the entire interactive shell until after client mount (hydration safety).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="animate-float"><BrandLogo size="lg" /></div>
        <p className="mt-5 text-sm font-medium text-muted-foreground">Cargando tu antojo…</p>
        <div className="mt-4 flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--antojo)", animationDelay: "0ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--mango)", animationDelay: "150ms" }} />
          <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--lima)", animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  // Auth gate: show landing (marketing home) → login → app.
  if (authStatus === "unauthed" || !authUser) {
    return preAuthView === "login" ? <LoginScreen /> : <LandingPage />;
  }

  const nav = NAV[role] ?? NAV.cliente;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-3 sm:px-5">
          <BrandLogo size="md" showText={false} className="lg:hidden" />
          <BrandLogo size="sm" className="hidden lg:flex" />

          {role === "cliente" && <CustomerLocationPill />}

          {role === "cliente" && (
            <div className="relative hidden flex-1 max-w-md md:block">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Busca restaurantes, platos o cocinas…"
                className="h-9 rounded-full pl-9 bg-secondary/60 border-border/50"
                value={useApp.getState().searchQuery}
                onChange={(e) => useApp.getState().setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={toggleTheme} aria-label="Tema">
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <NotificationsBell role={role} />
            {role === "cliente" && <CartButton />}
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 gap-0 lg:gap-6 px-0 lg:px-5 py-0 lg:py-5">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-secondary/50 px-3 py-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg text-white font-bold text-xs" style={{ background: ROLE_COLOR[role] }}>
                {authUser.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{authUser.name}</p>
                <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[role]}</p>
              </div>
            </div>
            {nav.map((item) => <NavButton key={item.view} item={item} role={role} />)}
            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Superapp de Colombia</p>
              <p className="mt-1 font-display text-sm font-bold">Tu antojo, en minutos 🇨🇴</p>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 lg:pb-4">
          {role === "cliente" && <CustomerApp />}
          {role === "domiciliario" && <DriverApp />}
          {role === "restaurante" && <RestaurantApp />}
          {role === "admin" && <AdminApp />}
        </main>
      </div>

      {/* ---------- Mobile bottom nav ---------- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 glass lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around overflow-x-auto px-2 pb-[env(safe-area-inset-bottom)] no-scrollbar">
          {nav.slice(0, 5).map((item) => <MobileNavButton key={item.view} item={item} role={role} />)}
        </div>
      </nav>

      {/* ---------- Footer ---------- */}
      <footer className="mt-auto border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 px-5 py-5 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showText={false} />
            <span>© 2025 Antojo · Hecho en Colombia 🇨🇴</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Términos</span><span>Privacidad</span><span>Soporte</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Operando en Bogotá</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CustomerLocationPill() {
  return (
    <button className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-semibold hover:bg-secondary sm:flex">
      <MapPin size={13} style={{ color: "var(--antojo)" }} />
      <span>Enviar a</span><span className="text-foreground">Chapinero</span>
    </button>
  );
}

function CartButton() {
  const cart = useApp((s) => s.cart);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (count === 0) return null;
  return (
    <Button size="sm" className="h-9 rounded-full gap-1.5 shadow-glow" style={{ background: "var(--antojo)", color: "white" }} onClick={() => setCustomerView("checkout")}>
      <ShoppingCart size={15} /> {count}
    </Button>
  );
}

function NotificationsBell({ role }: { role: string }) {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const unread = data?.unread ?? 0;
  const notifs = data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Notificaciones">
          <Bell size={17} />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white" style={{ background: "var(--antojo)" }}>{unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border/60 p-3">
          <p className="font-display font-bold">Notificaciones</p>
          {unread > 0 && <Badge style={{ background: "var(--antojo)", color: "white" }}>{unread} nuevas</Badge>}
        </div>
        <ScrollArea className="h-80">
          {notifs.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No tienes notificaciones</p>
          ) : notifs.map((n: any) => (
            <button key={n.id} onClick={() => { markRead.mutate(n.id); if (n.orderId && role === "cliente") { setActiveOrderId(n.orderId); setCustomerView("tracking"); } }}
              className={cn("flex w-full items-start gap-2.5 border-b border-border/40 p-3 text-left transition hover:bg-secondary/50", !n.read && "bg-antojo/[0.03]")}
              style={!n.read ? { background: "oklch(0.628 0.211 29 / 0.04)" } : undefined}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-base">{n.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--antojo)" }} />}
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function AccountMenu() {
  const authUser = useApp((s) => s.authUser);
  const logout = useApp((s) => s.logout);
  const logoutMut = useLogout();
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setDriverView = useApp((s) => s.setDriverView);
  const setRestaurantView = useApp((s) => s.setRestaurantView);
  const setAdminView = useApp((s) => s.setAdminView);
  const role = useApp((s) => s.role);

  const goProfile = () => {
    if (role === "cliente") setCustomerView("profile");
    if (role === "domiciliario") setDriverView("profile");
    if (role === "restaurante") setRestaurantView("profile");
  };

  const handleLogout = async () => {
    try { await logoutMut.mutateAsync(); } catch {}
    logout();
    toast("Sesión cerrada 👋");
  };

  if (!authUser) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/50 py-1 pl-1 pr-2 hover:bg-secondary">
          <span className="grid h-7 w-7 place-items-center rounded-full text-white text-xs font-bold" style={{ background: ROLE_COLOR[authUser.role] }}>
            {authUser.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
          </span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="font-bold">{authUser.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{authUser.email}</p>
          <Badge className="mt-1" style={{ background: ROLE_COLOR[authUser.role], color: "white" }}>{ROLE_LABEL[authUser.role]}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={goProfile}><UserIcon size={14} /> Mi perfil</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Configuración de la cuenta")}><Settings size={14} /> Configuración</DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast("Centro de ayuda · Sazón AI disponible 24/7")}>Centro de ayuda</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive"><LogOut size={14} /> Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavButton({ item, role }: { item: NavItem; role: string }) {
  const prefix = ROLE_STORE_PREFIX[role];
  const view = useApp((s) => (s as any)[`${prefix}View`]);
  const setView = useApp((s) => (s as any)[`set${cap(prefix)}View`]);
  const active = view === item.view;
  const Icon = item.icon;
  return (
    <button onClick={() => setView(item.view)}
      className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all", active ? "bg-secondary text-foreground shadow-soft" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground")}>
      <Icon size={18} className={active ? "" : "opacity-80"} style={active ? { color: "var(--antojo)" } : undefined} />
      {item.label}
    </button>
  );
}

function MobileNavButton({ item, role }: { item: NavItem; role: string }) {
  const prefix = ROLE_STORE_PREFIX[role];
  const view = useApp((s) => (s as any)[`${prefix}View`]);
  const setView = useApp((s) => (s as any)[`set${cap(prefix)}View`]);
  const active = view === item.view;
  const Icon = item.icon;
  return (
    <button onClick={() => setView(item.view)}
      className={cn("flex min-w-[64px] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors", active ? "text-foreground" : "text-muted-foreground")}>
      <div className={cn("grid h-7 w-12 place-items-center rounded-full transition-all", active && "shadow-glow")} style={active ? { background: "var(--antojo)" } : undefined}>
        <Icon size={16} className={active ? "text-white" : ""} />
      </div>
      {item.label}
    </button>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }


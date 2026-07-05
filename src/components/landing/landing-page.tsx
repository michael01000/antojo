"use client";

/**
 * Antojo — Landing Page (Home de marketing)
 * ------------------------------------------
 * Página de inicio pública de Antojo. Es lo primero que ve el usuario.
 * Flujo: Landing → Login → App.
 *
 * Secciones:
 *   1. Navbar
 *   2. Hero
 *   3. Stats bar
 *   4. Features (las 4 apps + IA + tiempo real + recompensas + Prime)
 *   5. How it works (3 pasos)
 *   6. Restaurantes destacados
 *   7. Sazón AI showcase
 *   8. Antojo Prime
 *   9. Testimonios
 *  10. CTA final
 *  11. Footer
 *
 * Todo el contenido es estático/marketing (no requiere auth).
 * Los CTAs llevan al login mediante setPreAuthView("login").
 */
import { useApp } from "@/lib/store";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Zap, Bike, MapPin, Clock, Star, Crown, ShieldCheck,
  UtensilsCrossed, Store, ShoppingBag, Wallet, TrendingUp, Heart, Gift,
  ChevronRight, Apple, Play, Check, Quote, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Imágenes reales de comida (OSS-hosted, estables)
const FOOD_IMAGES = {
  burger: "https://sfile.chatglm.cn/images-ppt/e7bc8c902f79.jpg",
  pizza: "https://sfile.chatglm.cn/images-ppt/6437044a5039.jpg",
  sushi: "https://sfile.chatglm.cn/images-ppt/1a2f11106c7f.jpg",
  arepa: "https://sfile.chatglm.cn/images-ppt/025ad4dd39e6.jpg",
  tacos: "https://sfile.chatglm.cn/images-ppt/1ed5211820fa.jpg",
  cafe: "https://sfile.chatglm.cn/images-ppt/ef253f3ee2e9.jpg",
};

const RESTAURANTS_PREVIEW = [
  { name: "El Corral Gourmet", cuisine: "Hamburguesas", img: FOOD_IMAGES.burger, rating: 4.8, time: "22 min" },
  { name: "Pizzería 900°", cuisine: "Pizza italiana", img: FOOD_IMAGES.pizza, rating: 4.7, time: "28 min" },
  { name: "Sushi Roll Express", cuisine: "Japonesa", img: FOOD_IMAGES.sushi, rating: 4.7, time: "30 min" },
  { name: "Arepa & Co", cuisine: "Colombiana", img: FOOD_IMAGES.arepa, rating: 4.9, time: "25 min" },
  { name: "Taco Loco", cuisine: "Mexicana", img: FOOD_IMAGES.tacos, rating: 4.6, time: "26 min" },
  { name: "Café Devoción", cuisine: "Café", img: FOOD_IMAGES.cafe, rating: 4.7, time: "18 min" },
];

export function LandingPage() {
  const setPreAuthView = useApp((s) => s.setPreAuthView);
  const goLogin = () => setPreAuthView("login");

  return (
    <div className="min-h-screen bg-background">
      {/* ============ 1. NAVBAR ============ */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo size="sm" />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#features" className="transition hover:text-foreground">Características</a>
            <a href="#how" className="transition hover:text-foreground">Cómo funciona</a>
            <a href="#restaurants" className="transition hover:text-foreground">Restaurantes</a>
            <a href="#prime" className="transition hover:text-foreground">Prime</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full text-sm font-semibold" onClick={goLogin}>
              Iniciar sesión
            </Button>
            <Button size="sm" className="rounded-full gap-1.5 shadow-glow" style={{ background: "var(--antojo)", color: "white" }} onClick={goLogin}>
              Pide ahora <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </header>

      {/* ============ 2. HERO ============ */}
      <section className="relative overflow-hidden">
        {/* fondo decorativo */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute -left-32 top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: "oklch(0.628 0.211 29 / 0.12)" }} />
        <div className="absolute -right-32 top-40 h-64 w-64 rounded-full blur-3xl" style={{ background: "oklch(0.78 0.16 75 / 0.12)" }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          {/* texto */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold shadow-soft">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Operando en Bogotá · Colombia 🇨🇴
            </div>
            <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Tu antojo,<br />
              <span className="text-gradient-antojo">en minutos.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              La superapp de domicilios de Colombia. Pide de tus restaurantes favoritos, sigue tu pedido en tiempo real y gana recompensas. Con recomendaciones potenciadas por IA.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="h-12 rounded-full px-6 text-base shadow-glow gap-2" style={{ background: "var(--antojo)", color: "white" }} onClick={goLogin}>
                <ShoppingBag size={18} /> Pide ahora — Gratis
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-6 text-base gap-2" onClick={goLogin}>
                <Play size={16} /> Ver cómo funciona
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Apple size={16} /> App Store</span>
              <span className="flex items-center gap-1"><Play size={16} /> Google Play</span>
              <span className="flex items-center gap-1"><Star size={14} fill="var(--mango)" style={{ color: "var(--mango)" }} /> 4.9 · +12.000 reseñas</span>
            </div>
          </motion.div>

          {/* visual: mockup del teléfono con cards flotantes */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative mx-auto w-full max-w-md">
            <div className="relative">
              {/* card principal con imagen */}
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-0 shadow-glow">
                <div className="relative aspect-[4/5]">
                  <img src={FOOD_IMAGES.burger} alt="Hamburguesa" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="rounded-full bg-mango px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--mango)", color: "var(--cafe)" }}><Flame size={11} className="inline" /> 2x1 en clásicas</span>
                    <h3 className="mt-2 font-display text-xl font-extrabold">El Corral Gourmet</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1"><Star size={13} fill="var(--mango)" style={{ color: "var(--mango)" }} /> 4.8</span>
                      <span className="flex items-center gap-1"><Clock size={13} /> 22 min</span>
                      <span className="flex items-center gap-1"><Bike size={13} /> $3.900</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* card flotante: tracking en vivo */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-4 top-1/3 w-44 rounded-2xl border border-border/60 bg-card p-3 shadow-glow sm:-left-8">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "var(--lima)" }}><Bike size={16} /></div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">En camino</p>
                    <p className="text-sm font-bold">12 min</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-3/4 rounded-full" style={{ background: "var(--lima)" }} />
                </div>
              </motion.div>

              {/* card flotante: recompensas */}
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-4 bottom-8 w-40 rounded-2xl border border-border/60 bg-card p-3 shadow-glow sm:-right-6">
                <div className="flex items-center gap-2">
                  <Gift size={20} style={{ color: "var(--mango)" }} />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Antojo Coins</p>
                    <p className="font-display text-lg font-extrabold" style={{ color: "var(--mango)" }}>1.240</p>
                  </div>
                </div>
              </motion.div>

              {/* card flotante: Sazón AI */}
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-2 top-6 rounded-2xl border border-border/60 bg-card p-2.5 shadow-glow">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} style={{ color: "var(--lima)" }} />
                  <span className="text-[11px] font-bold">Sazón AI</span>
                </div>
                <p className="mt-1 max-w-[120px] text-[10px] text-muted-foreground">¿Algo picante para 2? 🌶️</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ 3. STATS BAR ============ */}
      <section className="border-y border-border/40 bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {[
            { value: "+50.000", label: "Pedidos entregados", icon: ShoppingBag, color: "var(--antojo)" },
            { value: "+200", label: "Restaurantes aliados", icon: Store, color: "var(--mora)" },
            { value: "25 min", label: "Entrega promedio", icon: Zap, color: "var(--lima)" },
            { value: "4.9", label: "Calificación usuarios", icon: Star, color: "var(--mango)" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center">
                <Icon size={22} className="mx-auto mb-1" style={{ color: s.color }} />
                <p className="font-display text-2xl font-black sm:text-3xl">{s.value}</p>
                <p className="text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ 4. FEATURES ============ */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Una superapp, tres experiencias</span>
          <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl text-balance">
            Todo lo que necesitas, <span className="text-gradient-antojo">en un solo lugar</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Antojo conecta clientes, restaurantes y domiciliarios en un ecosistema único, con IA y seguimiento en tiempo real.
          </p>
        </div>

        {/* las 3 apps */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <FeatureCard icon={ShoppingBag} color="var(--antojo)" title="App Cliente" desc="Explora restaurantes, pide con un toque, sigue tu domicilio en vivo y gana recompensas." />
          <FeatureCard icon={Bike} color="var(--lima)" title="App Domiciliario" desc="Recibe pedidos cerca, navega con rutas optimizadas y cobra tus ganancias al instante." />
          <FeatureCard icon={Store} color="var(--mora)" title="Dashboard Restaurante" desc="Gestiona pedidos en vivo, tu menú y promociones. Crece con analítica en tiempo real." />
        </div>

        {/* features adicionales */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniFeature icon={Sparkles} title="Sazón AI" desc="Asistente con IA que te recomienda qué pedir según tu antojo, hora y presupuesto." color="var(--lima)" />
          <MiniFeature icon={MapPin} title="Tracking en vivo" desc="Ve tu domiciliario avanzar en el mapa, minuto a minuto, hasta tu puerta." color="var(--antojo)" />
          <MiniFeature icon={Gift} title="Recompensas" desc="Gana Antojo Coins en cada pedido, sube de tier y canjea descuentos exclusivos." color="var(--mango)" />
          <MiniFeature icon={Crown} title="Antojo Prime" desc="Envío gratis siempre, prioridad en horas pico y ofertas exclusivas por $14.900/mes." color="var(--mora)" />
        </div>
      </section>

      {/* ============ 5. HOW IT WORKS ============ */}
      <section id="how" className="border-y border-border/40 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Pide en 3 simples pasos</h2>
            <p className="mt-2 text-muted-foreground">Desde el antojo hasta la primera mordida en menos de 30 minutos.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Explora", desc: "Descubre restaurantes cerca de ti, filtra por categoría o deja que Sazón AI te recomienda.", icon: UtensilsCrossed, color: "var(--antojo)" },
              { step: "02", title: "Pide", desc: "Añade al carrito, elige tu método de pago y confirma. Pago seguro encriptado SSL.", icon: ShoppingBag, color: "var(--mango)" },
              { step: "03", title: "Disfruta", desc: "Sigue tu pedido en vivo, chatea con tu domiciliario y disfruta. ¡Gana coins!", icon: Heart, color: "var(--lima)" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative text-center">
                  {i < 2 && <div className="absolute left-1/2 top-12 hidden h-px w-full md:block" style={{ background: "linear-gradient(90deg, var(--border), transparent)" }} />}
                  <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-3xl text-white shadow-glow" style={{ background: s.color }}>
                    <Icon size={32} />
                    <span className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full bg-card text-xs font-black shadow-soft" style={{ color: s.color }}>{s.step}</span>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-extrabold">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 6. RESTAURANTS PREVIEW ============ */}
      <section id="restaurants" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Restaurantes</span>
            <h2 className="mt-3 font-display text-3xl font-black tracking-tight sm:text-4xl">Tus favoritos, a un toque</h2>
          </div>
          <Button variant="outline" className="hidden rounded-full sm:flex" onClick={goLogin}>Ver todos <ChevronRight size={15} /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {RESTAURANTS_PREVIEW.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow" onClick={goLogin}>
              <div className="relative aspect-square overflow-hidden">
                <img src={r.img} alt={r.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="truncate font-display text-sm font-bold">{r.name}</p>
                  <div className="flex items-center gap-2 text-[10px] opacity-90">
                    <span className="flex items-center gap-0.5"><Star size={9} fill="var(--mango)" style={{ color: "var(--mango)" }} />{r.rating}</span>
                    <span>·</span>
                    <span>{r.time}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ 7. SAZÓN AI SHOWCASE ============ */}
      <section className="relative overflow-hidden border-y border-border/40" style={{ background: "linear-gradient(135deg, oklch(0.72 0.17 145 / 0.08), oklch(0.628 0.211 29 / 0.06))" }}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold shadow-soft">
              <Sparkles size={13} style={{ color: "var(--lima)" }} /> Potenciado por IA
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl text-balance">
              Conoce a <span className="text-gradient-antojo">Sazón AI</span>, tu asistente de antojos
            </h2>
            <p className="text-muted-foreground">
              Dile qué se te antoja, cuántos comen o tu presupuesto, y Sazón AI te recomienda el plato perfecto en Bogotá. Aprende de tus gustos y te sorprende cada día.
            </p>
            <ul className="space-y-2.5">
              {[
                "Recomendaciones personalizadas según la hora y tu historial",
                "Sugerencias de combos y promociones activas",
                "Responde dudas sobre tu pedido, pagos y recompensas",
                "Disponible 24/7, en español colombiano",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--lima)" }}><Check size={12} /></span>
                  {t}
                </li>
              ))}
            </ul>
            <Button size="lg" className="h-12 rounded-full px-6 text-base shadow-glow gap-2" style={{ background: "var(--lima)", color: "white" }} onClick={goLogin}>
              <Sparkles size={18} /> Prueba Sazón AI
            </Button>
          </div>

          {/* chat mockup */}
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-glow">
              <div className="mb-4 flex items-center gap-2 border-b border-border/40 pb-3">
                <div className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg, var(--lima), var(--antojo))" }}><Sparkles size={16} /></div>
                <div><p className="text-sm font-bold">Sazón AI</p><p className="text-[11px] text-muted-foreground">en línea · responde en segundos</p></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-white" style={{ background: "var(--antojo)" }}>
                    Tengo antojo de algo picante para 2 personas 🌶️
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm">
                    ¡Parce, qué pinta! 🌶️ Te recomiendo <b>Taco Loco Cantina</b> — sus tacos al pastor x3 a $16.900. Y tienen <b>martes 3x2</b>. ¿Te antoja?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm text-white" style={{ background: "var(--antojo)" }}>
                    ¡Sí! ¿Y para compartir?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2 text-sm">
                    Unos <b>nachos supremos</b> 🧀 para dos. Total ~$40.000 con envío. ¿Los agrego? 🛒
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 8. ANTOJO PRIME ============ */}
      <section id="prime" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl p-8 text-white shadow-glow sm:p-12" style={{ background: "linear-gradient(135deg, var(--cafe), #0d0a08)" }}>
          <div className="bg-grid absolute inset-0 opacity-10" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Crown size={13} style={{ color: "var(--mango)" }} /> Membresía
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl text-balance">
                Antojo <span style={{ color: "var(--mango)" }}>Prime</span>
              </h2>
              <p className="text-white/80">
                Más antojos, más beneficios, menos espera. Envío gratis en todos tus pedidos, ofertas exclusivas y prioridad en horas pico.
              </p>
              <div className="flex items-end gap-1">
                <span className="font-display text-4xl font-black">$14.900</span>
                <span className="mb-1 text-sm text-white/60">/mes</span>
              </div>
              <Button size="lg" className="h-12 rounded-full px-6 text-base font-bold gap-2" style={{ background: "var(--mango)", color: "var(--cafe)" }} onClick={goLogin}>
                <Crown size={18} /> Activa Prime
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { icon: Bike, text: "Envío gratis en TODOS los pedidos" },
                { icon: Zap, text: "Prioridad en horas pico (sin esperas)" },
                { icon: Gift, text: "2x Antojo Coins siempre" },
                { icon: ShieldCheck, text: "Soporte VIP 24/7 por chat" },
                { icon: Star, text: "Acceso a menús exclusivos de chefs" },
              ].map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "oklch(0.78 0.16 75 / 0.25)" }}>
                      <Icon size={16} style={{ color: "var(--mango)" }} />
                    </div>
                    <span className="text-sm font-medium">{p.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 9. TESTIMONIOS ============ */}
      <section className="border-y border-border/40 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">Lo que dicen nuestros usuarios</h2>
            <p className="mt-2 text-muted-foreground">+12.000 colombianos ya piden con Antojo</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Valentina Ríos", role: "Cliente · Chapinero", text: "Sazón AI me recomienda siempre lo que necesito. El tracking en vivo es brutal, sé exactamente cuándo llega.", color: "var(--antojo)", rating: 5 },
              { name: "Andrés Gómez", role: "Domiciliario · Bogotá", text: "Con Antojo gano más que con otras apps. Las rutas son claras y cobro al instante. Ya llevo 128 entregas.", color: "var(--lima)", rating: 5 },
              { name: "Hiro Tanaka", role: "Sushi Roll Express", text: "El dashboard del restaurante es claro y rápido. Mis pedidos se triplicaron desde que me uní a Antojo.", color: "var(--mora)", rating: 5 },
            ].map((t, i) => (
              <div key={i} className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
                <Quote size={28} className="mb-3" style={{ color: t.color, opacity: 0.3 }} />
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} fill="var(--mango)" style={{ color: "var(--mango)" }} />)}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-foreground">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full text-white text-xs font-bold" style={{ background: t.color }}>
                    {t.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 10. CTA FINAL ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-antojo-gradient p-10 text-center text-white shadow-glow sm:p-16">
          <div className="bg-grid absolute inset-0 opacity-10" />
          <div className="relative space-y-5">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-black tracking-tight text-balance sm:text-5xl">
              ¿Listo para satisfacer tu antojo?
            </h2>
            <p className="mx-auto max-w-lg text-white/90">
              Únete a Antojo hoy. Crea tu cuenta en menos de un minuto y empieza a pedir.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="lg" className="h-12 rounded-full px-8 text-base font-bold shadow-glow gap-2" style={{ background: "white", color: "var(--antojo)" }} onClick={goLogin}>
                <ShoppingBag size={18} /> Crear cuenta gratis
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-8 text-base gap-2 border-white/40 text-white hover:bg-white/10" onClick={goLogin}>
                Iniciar sesión <ArrowRight size={16} />
              </Button>
            </div>
            <p className="text-xs text-white/70">Sin tarjeta de crédito · Cancela cuando quieras</p>
          </div>
        </div>
      </section>

      {/* ============ 11. FOOTER ============ */}
      <footer className="border-t border-border/40 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <BrandLogo size="sm" />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                La superapp de domicilios de Colombia. Tu antojo, en minutos.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary"><Apple size={16} /></span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary"><Play size={16} /></span>
              </div>
            </div>
            <FooterCol title="Producto" links={["Características", "Restaurantes", "Antojo Prime", "Sazón AI", "Recompensas"]} />
            <FooterCol title="Empresa" links={["Sobre Antojo", "Blog", "Carreras", "Prensa", "Contacto"]} />
            <FooterCol title="Soporte" links={["Centro de ayuda", "Términos", "Privacidad", "Seguridad", "Estado del servicio"]} />
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-sm text-muted-foreground sm:flex-row">
            <span>© 2025 Antojo · Hecho en Colombia 🇨🇴</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Operando en Bogotá · Medellín · Cali</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------- Sub-componentes ----------

function FeatureCard({ icon: Icon, color, title, desc }: { icon: any; color: string; title: string; desc: string }) {
  return (
    <div className="group rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl text-white shadow-soft" style={{ background: color }}>
        <Icon size={22} />
      </div>
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function MiniFeature({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `oklch(from ${color} l c h / 0.12)` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-bold">{title}</p>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}

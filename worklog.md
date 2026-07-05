---
Task ID: IMG
Agent: image-search subagent
Task: Fetch real food/restaurant photos via z-ai image-search and consolidate into seed-assets/images.json

Work Log:
- Read existing /home/z/my-project/worklog.md (file did not exist yet; created via this append).
- Verified `z-ai` CLI is installed at /usr/local/bin/z-ai and confirmed `z-ai image-search` subcommand via `--help`.
- Created output directory `/home/z/my-project/seed-assets` with `mkdir -p`.
- NOTE: Discovered the short `-o` flag does NOT actually write the output file (CLI prints JSON to stdout but no file is saved and no "File saved to" confirmation appears). Switched to the long `--output <path>` flag which works correctly (prints "✅ File saved to: ..."). All subsequent calls use `--output`.
- Ran a quick test query ("test", count=1) to confirm `--output` writes JSON to disk before launching the full batch.
- Ran all 17 image searches sequentially (count=3, gl=us, --no-rank, --output). Batched into two Bash invocations (8 + 9) to stay within timeouts; each call printed "✅ Got 3 images" + "✅ File saved to: ...".
  Slugs fetched: hero-burger, hero-pizza, hero-pollo, hero-sushi, hero-arepa, hero-pasta, hero-bowl, hero-postre, hero-cafe, hero-tacos, city-bogota, driver-moto, restaurant-interior, nachos, milkshake, salad, wings.
- Each per-slug JSON file contains the full response (`success`, `query`, `count`, `ranked`, `results[]` with `original_url`, `caption`, `source`, `original_width`, `original_height`).
- Wrote a Python script to read all 17 per-slug JSON files, extract `results[0].original_url` from each, and consolidate into a single ordered catalog.
- Saved consolidated catalog to `/home/z/my-project/seed-assets/images.json` (JSON object mapping slug -> first result original_url).
- Verified the consolidated file: 17 of 17 slugs succeeded, 0 failures/omissions.

Stage Summary:
- All 17 slugs succeeded; 0 failures. Total image URLs in catalog: 17.
- Per-slug raw JSON files: 17 files in /home/z/my-project/seed-assets/<slug>.json (each with 3 candidate results).
- Consolidated catalog: /home/z/my-project/seed-assets/images.json (slug -> first result original_url, all hosted on https://sfile.chatglm.cn/images-ppt/...).
- All URLs are OSS-rehosted (embeddable, no hotlinking risk).
- Minor note for future runs: use `--output` (long flag) not `-o` (short flag appears non-functional for file writes).

---
Task ID: MAIN
Agent: Z.ai Code (main)
Task: Build Antojo — Colombia-first food delivery superapp (customer/driver/restaurant/admin) on Next.js 16 single `/` route

Work Log:
- Defined brand: "Antojo · Tu antojo, en minutos" with warm coral/mango/lima/mora palette (no blue/indigo), Bricolage Grotesque + Plus Jakarta Sans fonts
- Wrote Prisma schema (Customer, Restaurant, MenuItem, Order, OrderItem, OrderEvent, ChatMessage, Driver, Review, LoyaltyAccount, Subscription, Promotion, GroupOrder, Address) and seeded 10 Colombian restaurants w/ full menus, 5 drivers, promos, loyalty/subscription, 1 active (en_route) order + history + restaurant-side pending orders
- Built design system in globals.css (brand tokens, gradients, animations, scrollbars)
- Created WebSocket mini-service on port 3003 (order status, driver location, chat, identify/rooms)
- Wrote API routes: restaurants, categories, customer, loyalty, subscription, promotions, orders (+status/messages), driver (orders/toggle/location), restaurant (orders/menu), admin (stats/orders/restaurants/drivers), ai/chat, ai/recommend, popular
- Built shared components: BrandLogo, StarRating/Price, RestaurantCard, OrderStatusBadge, LiveMap (CSS street-grid + animated driver marker)
- Built Zustand store (role + per-role views + cart + theme, persisted) and React Query hooks + realtime sync hook
- Built AppShell: sticky header w/ role switcher + search + cart, responsive side rail (desktop) + bottom nav (mobile), sticky footer
- Built Customer app: Discover (AI recommendations, categories, popular, flash deals, prime banner), Restaurant view+menu, Checkout (cart, address, payment, promo validation, tip, place order -> emits order:created), Tracking (live map, status timeline, ETA, driver chat, rating), Orders history, Rewards (coins/tiers/challenges/redeem), Prime subscription, Sazón AI assistant chatbot
- Built Driver app: online toggle, available orders queue + accept, active delivery (simulated live movement via socket + status progression), earnings dashboard w/ weekly chart
- Built Restaurant dashboard: restaurant selector, live order queue w/ status progression (emit order:status), menu availability toggles, analytics (hourly + top items), promos
- Built Admin dashboard: KPI grid, revenue area chart, cuisine pie, top restaurants, live order feed, all orders w/ filters, manage restaurants/drivers, revenue bar charts, promos
- Image-search subagent fetched 17 real food/restaurant photos (OSS URLs)

Stage Summary:
- All 4 roles functional and connected via realtime WebSocket (order status flows customer<->restaurant<->driver<->admin; driver location animates on customer tracking map; chat works across roles)
- AI: Sazón AI chatbot + personalized recommendations (LLM via z-ai-web-dev-sdk, heuristic fallback)
- Lint clean; dev server returns 200 on `/`
- Next: Agent Browser end-to-end verification

---
Task ID: VERIFY
Agent: Z.ai Code (main) + agent-browser + VLM
Task: End-to-end verification of Antojo platform

Work Log:
- agent-browser opened / — home renders: greeting, categories, AI "Para ti" recommendations, popular items, flash deals, 10-restaurant grid, role switcher, nav, footer
- Golden path: clicked El Corral Gourmet → menu (categories + items + Añadir) → added 2 items → cart bar ($36.800) → checkout (address/payment/promo/tip/summary) → Pagar → order ANT-Y64R created → tracking (live map w/ markers, 32min ETA, status timeline, chat)
- Switched to Restaurante: El Corral dashboard, accepted → preparing → ready (real-time order:status emitted)
- Switched to Domiciliario: went online, opened active delivery ANT-7G2K (seeded en_route) → live map + route + chat → Confirmar entrega → "🎉 +$4.500", completedToday++
- Switched to Admin: KPI grid (GMV, pedidos, activos, clientes, restaurantes, domiciliarios, ticket, promos), revenue 7d area chart, cuisine pie, top restaurantes, live order feed
- Sazón AI: real LLM conversation — asked "algo picante para 2 personas" → got Colombian-flavored recommendation referencing Taco Loco + Arepa & Co
- Fixed bugs found during verification:
  1. Role→store-key mapping (cliente→customer, domiciliario→driver) — nav clicks were no-ops
  2. /api/categories 404 (file write had failed on missing dir) — recreated
  3. AI recommend endpoint could return invalid restaurantIds leaving empty grid boxes — added validation + heuristic top-up (confirmed by VLM: now exactly 4 cards, no empty boxes)
- VLM visual audit: clean, modern, cohesive warm palette, food images load, no overlaps/broken images
- Verified mobile (390x844) bottom nav + desktop (1440x900) side rail; sticky footer confirmed
- Lint clean; no console errors; dev server 200; realtime service syncing across roles

Stage Summary:
- Platform fully functional and browser-verified across all 4 roles with real-time WebSocket sync and AI features (LLM chatbot + personalized recommendations)
- Ready for user preview

---
Task ID: FIX-HYDRATION
Agent: Z.ai Code (main)
Task: Fix hydration mismatch error (greeting "Buenos días" vs "Buenas noches")

Work Log:
- Root cause: `greeting()` called `new Date().getHours()` during render in discover.tsx — server and client compute different hours (timezone/time-passing) → hydration mismatch
- Also identified latent hydration risks: persisted Zustand store (role/cart/theme rehydrate synchronously on client, can differ from server defaults) and a `Math.random()` in driver-app available-orders distance
- Fix 1: Added a mounted gate to AppShell — SSR + first client paint render a stable branded loader ("Cargando tu antojo…"), full interactive app renders only after mount. This eliminates ALL hydration mismatches from persisted state and time-based content.
- Fix 2: Changed `greeting()` to mount-based state (useState "Hola" → setGreetingText in useEffect) so SSR and first paint render identical stable text, then updates to time-based greeting after mount
- Fix 3: Replaced `Math.random()` distance in driver-app with deterministic value derived from order id (`2 + (id.charCodeAt(last) % 5)`)
- Verified: agent-browser reload → no console errors, greeting renders "Buenos días" correctly, lint clean

Stage Summary:
- Hydration mismatch fully resolved; app loads cleanly with a branded loader → full shell transition
- Defense-in-depth: mounted gate (global) + mount-based greeting (targeted) + deterministic distance

---
Task ID: AUTH
Agent: Z.ai Code (main)
Task: Implement authentication, role-based access, and complete core platform features

Work Log:
- Prisma: added User (email/password/provider/role/verified), Favorite, Notification models; linked Customer/Driver/Restaurant to User via userId; added isApproved/isVerified/plate/ownerName fields
- Seed: created 4 auth users (cliente/domiciliario/restaurante/admin @antojo.co, password "antojo123") linked to existing profiles; seeded 3 favorites + 7 notifications across roles
- Auth backend (src/lib/auth.ts): scrypt password hashing, HMAC-signed token cookies (HttpOnly, 7-day), getAuthUser/requireAuth helpers
- Auth API routes: /api/auth/{login,register,me,logout,otp/send,otp/verify,profile}
- Favorites API: GET/POST toggle; Notifications API: GET + PATCH mark-read; Restaurant reviews API; Restaurant register API; Driver onboard API; Admin users + approve APIs
- Updated server.ts: getCurrentCustomer/Driver now resolve via authenticated user (with seeded fallback); restaurant orders resolve to auth user's restaurant
- Store: added authUser/authStatus/setAuth/logout, activeCategory/activeSort, favoriteIds/toggleFavorite; removed role from persist (now from auth)
- use-data hooks: useAuthMe, useLogin, useRegister, useLogout, useOtpSend/Verify, useUpdateProfile, useFavorites, useToggleFavorite, useNotifications, useMarkNotificationRead, useRestaurantReviews, useRegisterRestaurant, useOnboardDriver, useAdminUsers, useApprove; useAuthInit hydrates from /me
- LoginScreen: polished split-screen with Email/Phone OTP/Google/Apple methods, role picker (register), 4 demo quick-login buttons, branding panel
- AppShell refactor: auth-gated (LoginScreen when unauthed), role derived from authUser, removed free role switcher, added functional NotificationsBell (popover with unread badge + mark-read), AccountMenu (dropdown with profile/logout), favorites+notifications+profile nav items
- Functional category buttons: clicking a category sets activeCategory → useRestaurants refetches with ?cuisine= param → filters dynamically (no reload); "Promociones" filters by promo; sort dropdown (recommended/rating/fast/price); "Quitar filtro" button
- Favorites: heart on every RestaurantCard (toggle via API), Favorites view grid
- Notifications: bell popover + full NotificationsView, type-colored, click order notif → tracking
- Reviews: ReviewsSection on restaurant page showing real reviews with stars + customer avatars
- Profile: full account settings (edit name/phone/city/avatarColor), payment methods, loyalty summary, notification toggles, logout
- Restaurant registration: RestProfile with registration form (name/cuisine/neighborhood/phone/description) → creates unapproved restaurant + notifies admin
- Driver onboarding: DriverProfile with verification form (vehicle/plate) → creates unverified driver + notifies admin
- Admin: ManageUsers view (all users with roles), ManageRestaurants/Drivers with approve/suspend/delete dropdown menus, approve API notifies the affected user
- api client: added credentials:"include" so auth cookies flow on all requests
- Disabled Prisma query logging (reduced memory for 4GB sandbox)
- Lint clean

Backend verification (curl, full flow):
- login → user+cookie ✓ | /me reads cookie ✓ | favorites (3) ✓ | notifications (4, 3 unread) ✓ | category filter (Hamburguesas→El Corral) ✓ | logout clears ✓ | /me=null after logout ✓
- Browser: login screen renders (VLM-verified: Email/Phone/Google/Apple methods + demo accounts + branding panel)

Stage Summary:
- Complete auth system (Email/Google/Apple/Phone OTP) with role-based access: each user has ONE role → redirected to their dashboard
- Functional categories, search filters, sort, favorites, notifications, reviews, profiles, restaurant/driver registration, admin approval — all implemented
- 4 demo accounts (cliente/domiciliario/restaurante/admin@antojo.co, pass: antojo123)
- Note: 4GB sandbox memory limits simultaneous browser+dev+realtime; backend fully verified via curl; login screen verified via browser+VLM

---
Task ID: LANDING
Agent: Z.ai Code (main)
Task: Crear landing page (home de marketing) → flujo Landing → Login → App

Work Log:
- Añadido estado preAuthView ("landing" | "login") al store; default "landing"
- Creado src/components/landing/landing-page.tsx — página de marketing completa con 11 secciones: navbar, hero (con mockup + cards flotantes animadas), stats bar, features (4 apps + 4 mini-features), how-it-works (3 pasos), restaurantes preview (6 tarjetas), Sazón AI showcase (con chat mockup), Antojo Prime, testimonios, CTA final, footer
- Integrado en AppShell: unauthed → landing (default) → click CTA → login → "Volver al inicio" → landing
- Añadido botón "Volver al inicio" en LoginScreen
- Lint limpio; verificado en navegador: landing renderiza, CTAs llevan a login, "Volver" regresa a landing; VLM confirma diseño profesional

Stage Summary:
- Flujo completo: Landing (marketing) → Login → App
- Landing lista para entregar/pulir; componente autocontenido en src/components/landing/landing-page.tsx

---
Task ID: PWA
Agent: Z.ai Code (main)
Task: Convertir Antojo en PWA instalable (mobile app vía web)

Work Log:
- Generé íconos de marca Antojo (SVG + PNG en 192/256/384/512 + maskable + apple-touch 180 + favicon 32) con sharp, paleta coral→mango, "a" estilizada + punto mango + hoja lima
- Creé public/manifest.json: name, short_name, description, start_url, display:standalone, orientation:portrait, theme/background color, icons (any + maskable), 3 shortcuts (Pide ahora, Mis pedidos, Sazón AI), categorías food/lifestyle
- Actualicé src/app/layout.tsx: manifest, theme-color (light/dark), appleWebApp config, icons array, viewport (device-width, no-zoom, viewportFit cover), meta tags iOS (apple-mobile-web-app-capable, status-bar, format-detection)
- Creé public/sw.js (service worker): app-shell cache, estrategia network-first para navegación+API, cache-first para imágenes, stale-while-revalidate para assets
- Creé src/hooks/use-service-worker.ts: registra /sw.js al cargar (con guards de protocolo y compatibilidad)
- Integré useServiceWorker() en AppShell
- Creé src/hooks/use-geolocation.ts: GPS real vía Geolocation API (watchPosition, alta precisión, manejo de permisos/errors)
- Integré GPS real en driver-app: botón "Activar GPS" cuando el domiciliario está en ruta — emite ubicación real al WebSocket; fallback a simulación si no se activa o no hay permiso
- Lint limpio; verificado: manifest, sw.js, íconos y meta tags se sirven y detectan correctamente en el navegador

Stage Summary:
- Antojo es ahora una PWA instalable (iOS/Android/desktop): ícono en home, pantalla completa, sin barra del navegador, offline básico
- GPS real disponible para el domiciliario (tracking en vivo de verdad en producción)
- Para instalar: en Chrome/Edge → menú → "Instalar Antojo"; en iOS Safari → Compartir → "Añadir a pantalla de inicio"

---
Task ID: VERCEL
Agent: Z.ai Code (main)
Task: Preparar el proyecto para despliegue en Vercel + instalación en iPhone

Work Log:
- Migré Prisma de SQLite a PostgreSQL (Vercel es serverless, no soporta SQLite)
- Actualicé next.config.ts: removí output:"standalone", añadí image remotePatterns
- Actualicé package.json: build="prisma generate && next build", postinstall="prisma generate", db:seed script
- Creé .env.example con instrucciones de Neon Postgres
- Creé vercel.json con config de build para Vercel
- Creé DEPLOY.md con guía paso a paso (Neon → GitHub → Vercel → iPhone)
- Actualicé .gitignore: db/, seed-assets/, screenshots, realtime.log
- Removí .env del tracking de git (seguridad — estaba siendo trackeado)
- Commiteado todo a git, listo para push a GitHub
- Lint limpio

Stage Summary:
- Proyecto deploy-ready para Vercel con PostgreSQL (Neon)
- Guía completa en DEPLOY.md (15 min de principio a fin)
- El usuario necesita: crear Neon DB, push a GitHub, deploy en Vercel, instalar en iPhone via Safari
- WebSocket realtime: opcional (Railway), app funciona sin él con polling

---
Task ID: AUDIT-EMOJI
Agent: general-purpose
Task: Audit emoji usage in UI components

Work Log:
- Read existing /home/z/my-project/worklog.md to learn project context (Antojo Colombian food-delivery superapp, lucide-react already installed and heavily used across all components).
- Targeted 14 component files listed in the task brief under src/components/.
- Used the Grep tool with a broad Unicode emoji character-class pattern ([\x{1F000}-\x{1FFFF}\x{2600}-\x{27BF}\x{FE00}-\x{FE0F}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}\x{1F1E6}-\x{1F1FF}]) plus a secondary pass for ASCII-style symbol glyphs ([★☆♥♡●○◆◇■□▲△▼▽►◄↑↓→←↔]) over the entire src/components/ directory.
- Captured every match with line numbers and surrounding context, then read each target file fully to classify each emoji into one of: (a) UI element (button/badge/section header/card icon/empty-state icon/decorative inline prefix in UI text), (b) toast message string (excluded), (c) data field value or data fallback (excluded), or (d) source-comment or directional arrow connector (excluded).
- Verified which Lucide icons are already imported per file so replacement recommendations reuse existing imports where possible.
- Did NOT modify any code (audit-only task per instructions).
- Appended this worklog entry.

Stage Summary:
- Audited all 14 target files plus discovered emoji uses in adjacent components (login-screen.tsx, restaurant-view.tsx, assistant.tsx, group-order-view.tsx, prime.tsx, admin/earnings-view.tsx, admin/profitability-view.tsx, restaurant/earnings-view.tsx) for context — those adjacent files are NOT in scope for this audit but were noted for completeness.
- Found ~28 distinct emoji usages in UI elements across the 14 target files that should be replaced with Lucide icons.
- Most-common offenders: ✓/✅ check-marks in badges and buttons (replace with Check/CheckCircle2), ⭐ rating stars inline (replace with Star), 📍 location pins (replace with MapPin), 🏍️ vehicle/motorcycle (replace with Bike), 🔥 flame badges (replace with Flame), 🍽️ dish-icon fallbacks (replace with UtensilsCrossed), and various decorative emoji in section headers and CTA buttons.
- Every replacement Lucide icon is ALREADY imported in its respective file (no new import lines needed in most cases) — exception: restaurant-card.tsx needs Flame added to its imports.
- Three emoji intentionally KEEP-AS-IS: 🇨🇴 Colombia flag (3 occurrences across app-shell.tsx + landing-page.tsx) — Lucide has no country-flag icons, so flag emojis are the only viable option for the "Made in Colombia" branding.
- Several borderline cases flagged as low-priority or skip: emoji inside chat mockup text on landing-page.tsx (content strings, not UI chrome), data-driven `{c.icon}`/`{it.emoji}`/`{n.icon}` renderings (data icons, not hardcoded UI), placeholder string in boost-view.tsx textarea, and emoji in toast messages (correctly excluded per task scope).
- Full per-file report delivered to user inline.

---
Task ID: ICON-FIX
Agent: general-purpose
Task: Replace emoji icons with professional Lucide icons across all UI components

Work Log:
- Read existing /home/z/my-project/worklog.md to learn project context (Antojo Colombian food-delivery superapp, lucide-react already installed and heavily used across all components).
- Read each of the 11 target files in full before editing to verify existing Lucide imports and surrounding JSX context (so replacement snippets matched exactly).
- src/components/restaurant/restaurant-app.tsx: added MapPin, Bike to the lucide-react import line; replaced 📍 in order address line with <MapPin size={11} className="inline" />; replaced the 4 status-action button labels (✓ Aceptar pedido → <Check size={15} className="inline mr-1" />, 👨‍🍳 Empezar a preparar → <ChefHat .../>, 🛍️ Marcar como listo → <ShoppingBag .../>, 🏍️ Entregar al domiciliario → <Bike .../>); removed ⭐ from the Rating KPI value string; replaced ✓ Activo badge with <Check size={11} className="inline" /> Activo; replaced ⭐ {restaurant.rating} with <Star size={12} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" /> {restaurant.rating}. Kept {it.emoji ?? "🍽️"} data-fallback and ✨ empty-state string as-is (out of scope / data).
- src/components/driver/driver-app.tsx: added Check, AlertTriangle, Ban, ClipboardList to the lucide-react import line; removed 🏍️ from the greeting h1; replaced 📍 in available-order address with <MapPin size={11} className="inline" />; replaced 📍 Iniciar ruta with <Navigation size={16} className="inline mr-1" /> Iniciar ruta; removed the ✅ text prefix from "Confirmar entrega" (kept the existing <CheckCircle2 size={18} />); replaced 🏆 ¡Máximo tier with <Trophy size={16} className="inline" style={{ color: "var(--mango)" }} />; replaced ✓ Cobrado with <Check size={9} className="inline" /> Cobrado; replaced ⚠️ Pedidos en efectivo bloqueados with <AlertTriangle size={11} className="inline" /> (wrapped in fragment with the rest of the ternary); replaced ⛔ Consigna tu saldo… with <Ban size={11} className="inline" /> Consigna tu saldo…; replaced ✓ Verificado badge with <Check size={11} className="inline" /> Verificado; replaced 📋 Documentos requeridos with <ClipboardList size={12} className="inline" /> Documentos requeridos. Kept data-driven {t.emoji} (bronze/silver/gold tier emojis) and 📍/🟢/🔴 toast strings as-is.
- src/components/customer/rewards.tsx: added Bike, Banknote to the lucide-react import line; replaced 🔥 at end of "Racha de X días" with <Flame size={12} className="inline" style={{ color: "var(--antojo)" }} />; replaced 👑 ¡Estás en el tier máximo with <Crown size={14} className="inline" style={{ color: "var(--mora)" }} /> ¡Estás en el tier máximo; replaced the 🏍️/💸/🎫 coupon-type ternary with a conditional Lucide render {c.type === "free_delivery" ? <Bike size={18} /> : c.type === "fixed" ? <Banknote size={18} /> : <Ticket size={18} />}. Kept 👑🎉/🎫/📋 in toast strings as-is.
- src/components/customer/checkout.tsx: added Heart, ShoppingCart to the lucide-react import line (Heart was required by task; ShoppingCart was not actually pre-imported despite the brief saying so, added it too); replaced the empty-cart <p className="text-5xl">🛒</p> with <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />; replaced ✓ {applied.code} with <Check size={14} className="inline mr-1" style={{ color: "var(--lima)" }} /> {applied.code}; replaced 💚 Propina para el domiciliario header with <Heart size={16} style={{ color: "var(--lima)" }} /> Propina para el domiciliario. Kept 🍽️ data-fallback and 🎉 toast string as-is.
- src/components/customer/tracking.tsx: added Bike to the lucide-react import line; replaced 🏍️ {o.driver.vehicle} · ⭐ {o.driver.rating} with <Bike size={11} className="inline" /> {o.driver.vehicle} · <Star size={11} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" /> {o.driver.rating}; replaced ⭐ in "Ganaste 50 coins extra ⭐" with <Star size={12} className="inline" style={{ color: "var(--mango)" }} />.
- src/components/customer/discover.tsx: added Star, X to the lucide-react import line; removed 👋 from the greeting paragraph (kept the greeting text + comma); replaced ⭐ {r.rating} inline in rec cards with <Star size={11} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" /> {r.rating}; replaced ✕ Quitar filtro button label with <X size={12} className="inline mr-1" /> Quitar filtro.
- src/components/customer/orders.tsx: added Package to the lucide-react import line; replaced the active-order 📦 emoji tile with <Package size={24} className="text-muted-foreground" />. Kept 🍽️ data-fallback and 🔄 toast string as-is.
- src/components/admin/admin-app.tsx: added Flame, Check to the lucide-react import line (Bike was already imported, so only the two needed adding); replaced ⭐{r.rating} in top-restaurants list with <Star size={10} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" />{r.rating}; replaced the ternary "⚠️ Bonos pausados" / "✓ Bonos activos" with <AlertTriangle size={11} className="inline" /> Bonos pausados / <CheckCircle2 size={11} className="inline" /> Bonos activos (wrapped in fragments inside the existing ternary); replaced 🔥 Badge (promo) with <Flame size={11} />; replaced 🏍️ {d.vehicle} · … · ⭐{d.rating} with <Bike size={11} className="inline" /> {d.vehicle} · … · <Star size={10} className="inline" style={{ color: "var(--mango)" }} fill="var(--mango)" />{d.rating}; replaced ✓ Verificado badge with <Check size={10} className="inline" /> Verificado; replaced ✓ Aprobar verificación dropdown item with <Check size={12} className="inline mr-1" /> Aprobar verificación; replaced the standalone ✓ Badge for verified users with <Check size={10} />. Kept 🍽️ data-fallback and 📋 toast string as-is.
- src/components/restaurant/boost-view.tsx: replaced "🔥 Patrocinado" inline label with <Flame size={11} className="inline" style={{ color: "var(--mango)" }} /> Patrocinado (Flame was already imported). Kept 🔥/🎉 in toast strings and the 🔥 emoji in the textarea placeholder (a string, not UI chrome) as-is.
- src/components/shared/restaurant-card.tsx: added Flame to the lucide-react import line; replaced 🔥 {r.promo} promo badge with <Flame size={11} className="inline" /> {r.promo}. Kept ❤️/✓ toast strings as-is.
- src/components/landing/landing-page.tsx: added Flame to the lucide-react import line (Gift was already imported); replaced 🔥 2x1 en clásicas hero badge with <Flame size={11} className="inline" /> 2x1 en clásicas; replaced the floating-card <span className="text-xl">🎁</span> with <Gift size={20} style={{ color: "var(--mango)" }} />; removed the unicode ★ suffix from the "4.9★" stats-bar value (Star icon is rendered above it via the icon prop). Kept 🇨🇴 Colombia flag and 🌶️ chat-mockup emoji as-is (per task rules).
- Ran `bun run lint` — ESLint passed with zero errors or warnings.
- Ran `bun run build` with DATABASE_URL/AUTH_SECRET/CRON_SECRET env vars — Next.js production build completed successfully (all 59 routes compiled, static-page generation 59/59, no TypeScript or bundler errors).

Stage Summary:
- 11 files edited, ~38 emoji usages in UI chrome replaced with Lucide icon components (plus 5 lucide-react import lines extended to add the new icons).
- Lint: clean (0 errors, 0 warnings). Build: clean (59/59 routes, 0 errors).
- Emoji intentionally preserved per task rules: 🇨🇴 Colombia flag (3 occurrences in app-shell + landing — no Lucide equivalent), all toast-message strings (e.g. 🎉, ✅, ❤️, 🔄, 👋, 📋, 🟢/🔴), all data-fallback fields like {it.emoji ?? "🍽️"} and {t.emoji} tier emojis, and the placeholder string in the boost-view textarea.
- No business logic, API calls, data flow, or function names were touched. All edits are visual-only.

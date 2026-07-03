# 🚀 Guía de Despliegue — Antojo en Vercel

Esta guía te lleva desde el código hasta tener Antojo instalada en tu iPhone.

> **Tiempo total:** ~15 minutos

---

## ⚠️ Antes de empezar

Antojo usa **PostgreSQL** (no SQLite) porque Vercel es serverless y no soporta archivos de base de datos locales. Usaremos **Neon** (PostgreSQL gratis en la nube).

El servicio de WebSocket (tiempo real) se despliega por separado (opcional). La app funciona sin él (usa polling como fallback).

---

## Paso 1 — Crear base de datos PostgreSQL gratis (Neon)

1. Ve a **https://neon.tech** → "Sign up" (con GitHub/Google, 30 segundos)
2. Crea un proyecto: nombre `antojo`, región `AWS US East` (o la más cercana)
3. En el dashboard, copia la **Connection string** (empieza con `postgresql://...`)
4. Guárdala, la usarás enseguida

> Neon gratis: 0.5 GB storage, suficiente para el demo.

---

## Paso 2 — Configurar localmente

Abre tu terminal en el proyecto y ejecuta:

```bash
# 1. Instala dependencias (si no están)
bun install

# 2. Edita .env y pega tu DATABASE_URL de Neon
#    Reemplaza la línea DATABASE_URL=... con tu connection string
nano .env
# (o abre .env en tu editor)

# 3. Crea las tablas en Postgres
bun run db:push

# 4. Llena la base de datos con datos de prueba (restaurantes, usuarios, etc.)
bun run db:seed
```

Verifica que todo funciona:
```bash
bun run dev
```
Abre http://localhost:3000 — deberías ver la landing de Antojo. ✅

---

## Paso 3 — Subir a GitHub

Si no tienes el repo en GitHub aún:

```bash
# Ya tienes git inicializado. Solo añade el remote y push:
git remote add origin https://github.com/TU_USUARIO/antojo.git
git add -A
git commit -m "Listo para Vercel: PostgreSQL + PWA"
git branch -M main
git push -u origin main
```

> ¿No tienes repo? Ve a https://github.com/new → nombre `antojo` → Create → copia la URL

---

## Paso 4 — Desplegar en Vercel

1. Ve a **https://vercel.com** → "Sign up" (con GitHub, 1 click)
2. Click **"Add New"** → **"Project"**
3. Importa el repo `antojo` (clic en "Import")
4. En la configuración, Vercel auto-detecta Next.js ✅
5. **Importante — Variables de entorno** (clic en "Environment Variables"):
   - `DATABASE_URL` → pega tu connection string de Neon
   - `AUTH_SECRET` → escribe una cadena aleatoria larga (ej: `antojo-secret-9f2k4m7x2p8q1w6e3r5t`)
6. Click **"Deploy"** 🚀

Vercel tarda ~2 minutos. Al terminar te da una URL pública:
```
https://antojo-tu-usuario.vercel.app
```

---

## Paso 5 — Poblar la base de datos de producción

La base de datos Neon está vacía. Necesitas crear las tablas y sembrar datos:

```bash
# Esto ya apunta a tu DB de Neon (porque DATABASE_URL en .env es de Neon)
bun run db:push
bun run db:seed
```

> Si tenías la DB local apuntando a SQLite, asegúrate de que .env tenga la URL de Neon.

¡Listo! Abre tu URL de Vercel → deberías ver la landing con restaurantes. ✅

---

## Paso 6 — Instalar en tu iPhone 📱

1. Abre **Safari** en tu iPhone
2. Escribe tu URL de Vercel: `https://antojo-tu-usuario.vercel.app`
3. Toca el botón **Compartir** 📤 (cuadrito con flecha, abajo al centro)
4. Desplázate → **"Añadir a pantalla de inicio"**
5. Toca **"Añadir"**
6. 🎉 **¡Antojo está en tu iPhone!** Ábrela desde el ícono → pantalla completa

### Cuentas demo (para probar):
| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `cliente@antojo.co` | `antojo123` |
| Domiciliario | `domiciliario@antojo.co` | `antojo123` |
| Restaurante | `restaurante@antojo.co` | `antojo123` |

---

## 🔧 (Opcional) Servicio de tiempo real

Para tracking en vivo real y chat instantáneo, despliega el WebSocket por separado:

### Opción fácil: Railway
1. Ve a **https://railway.app** → Sign up con GitHub
2. "New Project" → "Deploy from repo" → selecciona `antojo`
3. Root directory: `mini-services/realtime`
4. Railway detecta Bun → Deploy
5. Obtienes una URL: `https://antojo-realtime.up.railway.app`
6. En tu frontend, cambia la conexión del socket a esa URL

> Sin esto, la app funciona pero el tracking se actualiza cada 5 segundos (polling) en vez de en tiempo real.

---

## 🐛 Problemas comunes

| Problema | Solución |
|---|---|
| "Database connection error" | Verifica que DATABASE_URL en Vercel sea la de Neon |
| "No restaurants show" | Ejecuta `bun run db:seed` con la URL de Neon en .env |
| Build fails on Vercel | Verifica que `AUTH_SECRET` esté configurado |
| Hydration error | Es normal en dev, no afecta producción |
| No puedo instalar en iPhone | Debes usar **Safari** (no Chrome) para "Añadir a pantalla de inicio" |

---

## ✅ Checklist final

- [ ] Base de datos Neon creada
- [ ] `.env` con `DATABASE_URL` de Neon
- [ ] `bun run db:push` ejecutado
- [ ] `bun run db:seed` ejecutado
- [ ] Código subido a GitHub
- [ ] Vercel desplegado con env vars configuradas
- [ ] URL pública funciona
- [ ] Instalada en iPhone vía Safari
- [ ] Login con cuenta demo funciona

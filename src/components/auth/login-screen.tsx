"use client";

import { useState } from "react";
import { useLogin, useRegister, useOtpSend, useOtpVerify } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Mail, Lock, Phone, ArrowRight, User, Store, Bike, ShoppingBag, Check,
  ShieldCheck, Sparkles, Zap, Crown, Eye, EyeOff, ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Method = "email" | "google" | "apple" | "phone";
type Mode = "login" | "register";
type RolePick = "cliente" | "domiciliario" | "restaurante";

const ROLE_PICKS: { id: RolePick; label: string; icon: any; color: string; desc: string }[] = [
  { id: "cliente", label: "Cliente", icon: ShoppingBag, color: "var(--antojo)", desc: "Pide comida a domicilio" },
  { id: "domiciliario", label: "Domiciliario", icon: Bike, color: "var(--lima)", desc: "Entrega y gana" },
  { id: "restaurante", label: "Restaurante", icon: Store, color: "var(--mora)", desc: "Vende en Antojo" },
];

// Cuentas demo visibles públicamente. El admin NO se muestra: es una cuenta
// interna del creador de la plataforma. Se accede escribiendo email + contraseña
// manualmente en el formulario (admin@antojo.co / antojo123).
const DEMO_ACCOUNTS = [
  { email: "cliente@antojo.co", role: "cliente", label: "Cliente · Valentina", color: "var(--antojo)", icon: ShoppingBag },
  { email: "domiciliario@antojo.co", role: "domiciliario", label: "Domiciliario · Andrés", color: "var(--lima)", icon: Bike },
  { email: "restaurante@antojo.co", role: "restaurante", label: "Restaurante · Sushi Roll", color: "var(--mora)", icon: Store },
];

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("email");
  const [role, setRole] = useState<RolePick>("cliente");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const login = useLogin();
  const register = useRegister();
  const otpSend = useOtpSend();
  const otpVerify = useOtpVerify();

  const busy = login.isPending || register.isPending || otpSend.isPending || otpVerify.isPending;

  const submitEmail = async () => {
    if (mode === "login") {
      if (!email || !password) { toast.error("Completa email y contraseña"); return; }
      try {
        await login.mutateAsync({ email, password });
        toast.success("¡Bienvenido de vuelta! 🎉");
      } catch (e: any) { toast.error(e.message ?? "Error al iniciar sesión"); }
    } else {
      if (!name || !email || !password) { toast.error("Completa todos los campos"); return; }
      try {
        await register.mutateAsync({ name, email, password, role, provider: "email" });
        toast.success("¡Cuenta creada! 🎉");
      } catch (e: any) { toast.error(e.message ?? "Error al registrarse"); }
    }
  };

  const socialLogin = async (provider: "google" | "apple") => {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === (mode === "login" ? "cliente" : role)) ?? DEMO_ACCOUNTS[0];
    try {
      try {
        await login.mutateAsync({ email: demo.email, password: "antojo123" });
        toast.success(`Conectado con ${provider === "google" ? "Google" : "Apple"} ✅`);
      } catch {
        await register.mutateAsync({ name: demo.label.split(" · ")[1], email: demo.email, password: "antojo123", role: demo.role, provider });
        toast.success(`Cuenta ${provider} creada ✅`);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 7) { toast.error("Ingresa un teléfono válido"); return; }
    try {
      const r = await otpSend.mutateAsync(phone);
      setOtpSent(true);
      toast.success(`Código enviado. (Demo: ${r.devCode})`);
    } catch (e: any) { toast.error(e.message); }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { toast.error("Ingresa el código de 6 dígitos"); return; }
    try {
      await otpVerify.mutateAsync({ phone, code: otp, role });
      toast.success("¡Teléfono verificado! 🎉");
    } catch (e: any) { toast.error(e.message); }
  };

  const quickDemo = async (accEmail: string) => {
    try {
      await login.mutateAsync({ email: accEmail, password: "antojo123" });
      toast.success("Sesión demo iniciada 🚀");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left: branding */}
        <div className="relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between" style={{ background: "linear-gradient(150deg, var(--cafe), #0d0a08 70%)" }}>
          <div className="bg-grid absolute inset-0 opacity-20" />
          <div className="relative">
            <BrandLogo size="lg" className="[&_span]:text-white" />
          </div>
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Operando en Bogotá · Colombia 🇨🇴
            </div>
            <h1 className="font-display text-4xl font-black leading-tight text-balance xl:text-5xl">
              Tu antojo,<br /><span className="text-gradient-antojo">en minutos.</span>
            </h1>
            <p className="max-w-md text-base text-white/80">
              La superapp de domicilios de Colombia. Pide de tus restaurantes favoritos, sigue tu domicilio en tiempo real y gana recompensas.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Feature icon={Zap} title="Entrega express" desc="20-35 min promedio" />
              <Feature icon={Sparkles} title="Sazón AI" desc="Recomendaciones con IA" />
              <Feature icon={Crown} title="Prime" desc="Envío gratis siempre" />
              <Feature icon={ShieldCheck} title="Pago seguro" desc="Encriptación SSL" />
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-white/60">
            <span>★ 4.9</span><span>·</span><span>+50.000 pedidos</span><span>·</span><span>+200 restaurantes</span>
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex flex-col items-center text-center lg:hidden">
              <BrandLogo size="md" />
            </div>

            <button onClick={() => useApp.getState().setPreAuthView("landing")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
              <ChevronLeft size={16} /> Volver al inicio
            </button>

            <div className="mb-5">
              <h2 className="font-display text-2xl font-extrabold tracking-tight">
                {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Elige cómo quieres entrar a Antojo" : "Únete a Antojo en menos de un minuto"}
              </p>
            </div>

            <div className="mb-5 flex rounded-xl bg-secondary p-1">
              <button onClick={() => setMode("login")} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold transition", mode === "login" ? "bg-card shadow-soft" : "text-muted-foreground")}>Iniciar sesión</button>
              <button onClick={() => setMode("register")} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold transition", mode === "register" ? "bg-card shadow-soft" : "text-muted-foreground")}>Registrarme</button>
            </div>

            {(mode === "register" || method === "phone") && (
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Soy…</p>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_PICKS.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.id;
                    return (
                      <button key={r.id} onClick={() => setRole(r.id)}
                        className={cn("flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition", active ? "" : "border-border/60 bg-card")}
                        style={active ? { borderColor: r.color, background: `oklch(from ${r.color} l c h / 0.08)` } : undefined}>
                        <Icon size={18} style={{ color: r.color }} />
                        <span className="text-xs font-bold">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 flex gap-1.5">
              <MethodTab active={method === "email"} onClick={() => setMethod("email")} icon={Mail} label="Email" />
              <MethodTab active={method === "phone"} onClick={() => setMethod("phone")} icon={Phone} label="Teléfono" />
              <MethodTab active={method === "google"} onClick={() => setMethod("google")} icon={GoogleIcon} label="Google" />
              <MethodTab active={method === "apple"} onClick={() => setMethod("apple")} icon={AppleIcon} label="Apple" />
            </div>

            <Card className="p-4 shadow-soft">
              {method === "email" && (
                <div className="space-y-3">
                  {mode === "register" && (
                    <Field icon={User} label="Nombre completo">
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Valentina Ríos" className="h-11 border-0 bg-transparent px-0 focus-visible:ring-0" />
                    </Field>
                  )}
                  <Field icon={Mail} label="Correo electrónico">
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className="h-11 border-0 bg-transparent px-0 focus-visible:ring-0" />
                  </Field>
                  <Field icon={Lock} label="Contraseña">
                    <div className="relative flex-1">
                      <Input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 border-0 bg-transparent px-0 pr-8 focus-visible:ring-0" />
                      <button onClick={() => setShowPass((v) => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </Field>
                  {mode === "login" && <button onClick={() => toast("Te enviamos un enlace de recuperación 📧")} className="text-xs font-semibold text-right w-full block" style={{ color: "var(--antojo)" }}>¿Olvidaste tu contraseña?</button>}
                  <Button className="w-full h-11 rounded-xl text-base shadow-glow" style={{ background: "var(--antojo)", color: "white" }} disabled={busy} onClick={submitEmail}>
                    {busy ? "Procesando…" : <>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"} <ArrowRight size={17} /></>}
                  </Button>
                </div>
              )}

              {method === "phone" && (
                <div className="space-y-3">
                  <Field icon={Phone} label="Número de teléfono">
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 555 1234" className="h-11 border-0 bg-transparent px-0 focus-visible:ring-0" disabled={otpSent} />
                  </Field>
                  {otpSent && (
                    <Field icon={Lock} label="Código de verificación">
                      <Input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="h-11 border-0 bg-transparent px-0 tracking-[0.5em] focus-visible:ring-0" />
                    </Field>
                  )}
                  {!otpSent ? (
                    <Button className="w-full h-11 rounded-xl text-base shadow-glow" style={{ background: "var(--antojo)", color: "white" }} disabled={busy} onClick={sendOtp}>
                      {busy ? "Enviando…" : <>Enviar código <ArrowRight size={17} /></>}
                    </Button>
                  ) : (
                    <Button className="w-full h-11 rounded-xl text-base shadow-glow" style={{ background: "var(--lima)", color: "white" }} disabled={busy} onClick={verifyOtp}>
                      {busy ? "Verificando…" : <>Verificar e ingresar <Check size={17} /></>}
                    </Button>
                  )}
                  {otpSent && <button onClick={() => { setOtpSent(false); setOtp(""); }} className="text-xs font-semibold w-full text-center block text-muted-foreground">Cambiar número</button>}
                  <p className="text-center text-[11px] text-muted-foreground">Demo: usa el código <b>123456</b></p>
                </div>
              )}

              {method === "google" && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">Continúa con tu cuenta de Google. Serás redirigido de forma segura.</p>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-border/60 bg-white text-base font-semibold" disabled={busy} onClick={() => socialLogin("google")}>
                    <GoogleIcon size={18} /> Continuar con Google
                  </Button>
                </div>
              )}

              {method === "apple" && (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">Usa tu Apple ID para entrar a Antojo de forma privada.</p>
                  <Button className="w-full h-11 rounded-xl text-base font-semibold text-white" style={{ background: "#000" }} disabled={busy} onClick={() => socialLogin("apple")}>
                    <AppleIcon size={18} /> Continuar con Apple
                  </Button>
                </div>
              )}
            </Card>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cuentas demo</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.email} onClick={() => quickDemo(a.email)} disabled={busy}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card p-2.5 text-center text-xs transition hover:shadow-soft disabled:opacity-50">
                      <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: a.color }}><Icon size={15} /></span>
                      <span className="font-semibold leading-tight">{a.label.split(" · ")[0]}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{a.email}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Contraseña demo: <b>antojo123</b></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodTab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-[11px] font-semibold transition", active ? "" : "border-border/60 bg-card text-muted-foreground")}
      style={active ? { borderColor: "var(--antojo)", background: "oklch(0.628 0.211 29 / 0.08)", color: "var(--antojo)" } : undefined}>
      <Icon size={16} /> {label}
    </button>
  );
}

function Field({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 focus-within:ring-2 focus-within:ring-ring">
        <Icon size={16} className="shrink-0 text-muted-foreground" />
        {children}
      </div>
    </label>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
      <Icon size={18} style={{ color: "var(--mango)" }} />
      <p className="mt-1 text-sm font-bold">{title}</p>
      <p className="text-[11px] text-white/70">{desc}</p>
    </div>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function AppleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.95.94-.82 0-2.07-.92-3.41-.89-1.75.03-3.37 1.02-4.27 2.59-1.83 3.17-.47 7.86 1.31 10.43.87 1.26 1.91 2.67 3.27 2.62 1.32-.05 1.82-.85 3.41-.85 1.59 0 2.04.85 3.43.82 1.42-.02 2.32-1.28 3.18-2.55 1-1.47 1.42-2.9 1.44-2.97-.03-.01-2.76-1.06-2.79-4.2ZM14.5 4.36c.72-.88 1.21-2.09 1.08-3.3-1.04.04-2.31.69-3.06 1.56-.67.77-1.26 2.01-1.1 3.19 1.16.09 2.35-.59 3.08-1.45Z" />
    </svg>
  );
}

"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useUpdateProfile, useCustomer, useAddresses, useAddAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/use-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, User, Mail, Phone, MapPin, CreditCard, Shield, Bell, Crown, LogOut, Check, Bike, Store, ShoppingBag, Plus, Trash2, Pencil, Home, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useLogout } from "@/hooks/use-data";
import { cop } from "@/lib/format";

const AVATAR_COLORS = [
  { id: "antojo", color: "var(--antojo)" }, { id: "mango", color: "var(--mango)" },
  { id: "lima", color: "var(--lima)" }, { id: "mora", color: "var(--mora)" }, { id: "cafe", color: "var(--cafe)" },
];
const ROLE_LABEL: Record<string, string> = { cliente: "Cliente", domiciliario: "Domiciliario", restaurante: "Restaurante", admin: "Administrador" };
const ROLE_ICON: Record<string, any> = { cliente: ShoppingBag, domiciliario: Bike, restaurante: Store, admin: Shield };

export function Profile() {
  const authUser = useApp((s) => s.authUser);
  const logout = useApp((s) => s.logout);
  const setCustomerView = useApp((s) => s.setCustomerView);
  const updateProfile = useUpdateProfile();
  const logoutMut = useLogout();
  const { data: profile } = useCustomer();

  const [name, setName] = useState(authUser?.name ?? "");
  const [phone, setPhone] = useState(authUser?.phone ?? "");
  const [city, setCity] = useState(authUser?.city ?? "Bogotá");
  const [avatarColor, setAvatarColor] = useState(authUser?.avatarColor ?? "antojo");

  if (!authUser) return null;
  const RoleIcon = ROLE_ICON[authUser.role];

  const save = async () => {
    try {
      await updateProfile.mutateAsync({ name, phone, city, avatarColor });
      toast.success("Perfil actualizado ✅");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleLogout = async () => {
    try { await logoutMut.mutateAsync(); } catch {}
    logout();
    toast("Sesión cerrada 👋");
  };

  return (
    <div className="px-3 pt-4 sm:px-5 lg:px-0">
      <button onClick={() => setCustomerView("discover")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} /> Volver
      </button>

      {/* Profile header */}
      <Card className="mb-4 overflow-hidden p-0 shadow-soft">
        <div className="h-20" style={{ background: `linear-gradient(135deg, var(--${authUser.avatarColor}), oklch(0.3 0.02 50))` }} />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-3 flex items-end justify-between">
            <div className="grid h-16 w-16 place-items-center rounded-2xl text-white text-xl font-bold ring-4 ring-card" style={{ background: `var(--${authUser.avatarColor})` }}>
              {authUser.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
            </div>
            <Badge className="gap-1" style={{ background: `var(--${authUser.avatarColor})`, color: "white" }}><RoleIcon size={12} /> {ROLE_LABEL[authUser.role]}</Badge>
          </div>
          <h1 className="font-display text-xl font-extrabold">{authUser.name}</h1>
          <p className="text-sm text-muted-foreground">{authUser.email}</p>
          {authUser.provider !== "email" && <Badge variant="outline" className="mt-1">Conectado via {authUser.provider}</Badge>}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Edit form */}
        <Card className="p-4 shadow-soft">
          <h3 className="mb-3 flex items-center gap-1.5 font-display font-bold"><User size={16} style={{ color: "var(--antojo)" }} /> Información personal</h3>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Nombre</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Teléfono</span>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 000 0000" className="h-10" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">Ciudad</span>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-10" />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Color de avatar</span>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button key={c.id} onClick={() => setAvatarColor(c.id)} className="grid h-8 w-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-card transition" style={{ background: c.color, boxShadow: avatarColor === c.id ? `0 0 0 2px ${c.color}` : "none" }}>
                    {avatarColor === c.id && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }} disabled={updateProfile.isPending} onClick={save}>
              {updateProfile.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          {/* Account info */}
          <Card className="p-4 shadow-soft">
            <h3 className="mb-3 font-display font-bold">Cuenta</h3>
            <div className="space-y-2 text-sm">
              <Row icon={Mail} label="Email" value={authUser.email} />
              <Row icon={Phone} label="Teléfono" value={authUser.phone || "No registrado"} />
              <Row icon={MapPin} label="Ciudad" value={authUser.city} />
              <Row icon={Shield} label="Verificado" value={authUser.verified ? "Sí ✓" : "Pendiente"} />
            </div>
          </Card>

          {/* Loyalty quick stats (customer) */}
          {authUser.role === "cliente" && profile?.loyalty && (
            <Card className="p-4 shadow-soft">
              <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Crown size={16} style={{ color: "var(--mango)" }} /> Recompensas</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Coins" value={`${profile.loyalty.coins}`} />
                <Stat label="Tier" value={profile.loyalty.tier} />
                <Stat label="Racha" value={`${profile.loyalty.streakDays}d`} />
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full rounded-full" onClick={() => setCustomerView("rewards")}>Ver recompensas</Button>
            </Card>
          )}

          {/* Addresses management (customer) */}
          {authUser.role === "cliente" && <AddressesSection />}

          {/* Payment methods (customer) */}
          {authUser.role === "cliente" && (
            <Card className="p-4 shadow-soft">
              <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><CreditCard size={16} /> Métodos de pago</h3>
              <div className="space-y-1.5">
                <PaymentRow brand="Visa" last4="4242" primary />
                <PaymentRow brand="Nequi" last4="311 555 1234" />
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full rounded-full" onClick={() => toast("Agregar método de pago")}>+ Agregar</Button>
            </Card>
          )}

          <Card className="p-4 shadow-soft">
            <h3 className="mb-2 flex items-center gap-1.5 font-display font-bold"><Bell size={16} /> Notificaciones</h3>
            <Toggle label="Push de pedidos" defaultOn />
            <Toggle label="Promociones y ofertas" defaultOn />
            <Toggle label="Novedades de restaurantes" defaultOn={false} />
          </Card>

          <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={handleLogout}>
            <LogOut size={16} /> Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div><p className="font-display text-lg font-extrabold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>;
}
function PaymentRow({ brand, last4, primary }: { brand: string; last4: string; primary?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 p-2 text-sm">
      <div className="grid h-7 w-10 place-items-center rounded text-[10px] font-bold text-white" style={{ background: "var(--cafe)" }}>{brand.slice(0,4)}</div>
      <span className="font-medium">{brand} •• {last4}</span>
      {primary && <Badge className="ml-auto" style={{ background: "var(--lima)", color: "white" }}>Principal</Badge>}
    </div>
  );
}
function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span>{label}</span>
      <button onClick={() => setOn(!on)} className="relative h-5 w-9 rounded-full transition" style={{ background: on ? "var(--antojo)" : "var(--muted)" }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? "18px" : "2px" }} />
      </button>
    </div>
  );
}

function AddressesSection() {
  const { data, isLoading } = useAddresses();
  const addMut = useAddAddress();
  const updateMut = useUpdateAddress();
  const delMut = useDeleteAddress();
  // `editingId` null = modo crear; string = modo editar esa dirección
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("Casa");
  const [street, setStreet] = useState("");
  const [details, setDetails] = useState("");
  const addresses = data?.addresses ?? [];

  const isEditMode = !!editingId;

  // Abrir formulario en modo creación
  const openCreate = () => {
    setEditingId(null);
    setLabel("Casa");
    setStreet("");
    setDetails("");
    setShowForm(true);
  };

  // Abrir formulario en modo edición (pre-llenado)
  const openEdit = (a: any) => {
    setEditingId(a.id);
    setLabel(a.label);
    setStreet(a.street);
    setDetails(a.details ?? "");
    setShowForm(true);
  };

  // Cerrar formulario
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setStreet(""); setDetails(""); setLabel("Casa");
  };

  // Guardar (crear o editar según modo)
  const handleSave = async () => {
    if (!street.trim()) { toast.error("Escribe la dirección"); return; }
    try {
      if (isEditMode) {
        await updateMut.mutateAsync({ id: editingId!, label, street, details });
        toast.success("Dirección actualizada ✓");
      } else {
        await addMut.mutateAsync({ label, street, details });
        toast.success("Dirección guardada ✓");
      }
      closeForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const labelIcon = (l: string) => l.toLowerCase().includes("casa") ? Home : l.toLowerCase().includes("trab") ? Briefcase : MapPin;

  return (
    <Card className="p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-display font-bold"><MapPin size={16} style={{ color: "var(--antojo)" }} /> Mis direcciones</h3>
        <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={showForm ? closeForm : openCreate}>
          <Plus size={13} /> {showForm ? "Cancelar" : "Agregar"}
        </Button>
      </div>

      {/* Formulario (crear O editar — pre-llenado en modo edición) */}
      {showForm && (
        <div className="mb-3 space-y-2 rounded-xl bg-secondary/40 p-3">
          <div className="flex gap-2">
            {["Casa", "Trabajo", "Otra"].map((l) => (
              <button key={l} onClick={() => setLabel(l)} className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold transition", label === l ? "text-white" : "bg-card")} style={label === l ? { background: "var(--antojo)" } : undefined}>{l}</button>
            ))}
          </div>
          <Input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Ej: Calle 72 #11-25, Chapinero" className="h-10" />
          <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Detalles (apto, torre, instrucciones)" className="h-10" />
          <Button className="w-full rounded-xl" style={{ background: "var(--antojo)", color: "white" }} disabled={addMut.isPending || updateMut.isPending} onClick={handleSave}>
            {isEditMode ? "Guardar cambios" : "Guardar dirección"}
          </Button>
        </div>
      )}

      {/* Lista de direcciones */}
      {isLoading ? <div className="space-y-2">{[0,1].map(i => <div key={i} className="h-14 rounded-xl bg-secondary/40 shimmer" />)}</div> : addresses.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No tienes direcciones guardadas</p>
      ) : (
        <div className="space-y-1.5">
          {addresses.map((a: any) => {
            const Icon = labelIcon(a.label);
            return (
              <div key={a.id} className="flex items-center gap-2.5 rounded-xl border border-border/60 p-2.5">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary"><Icon size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.street}{a.details ? ` · ${a.details}` : ""}</p>
                </div>
                {/* Botón Editar (lápiz) */}
                <button onClick={() => openEdit(a)} className="text-muted-foreground transition hover:text-foreground" aria-label="Editar dirección">
                  <Pencil size={14} />
                </button>
                {/* Botón Eliminar */}
                <button onClick={() => { delMut.mutate(a.id); toast.success("Dirección eliminada"); }} className="text-muted-foreground transition hover:text-destructive" aria-label="Eliminar dirección">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

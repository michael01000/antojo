"use client";

import { useNotifications, useMarkNotificationRead } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_COLOR: Record<string, string> = {
  order: "var(--antojo)", promo: "var(--mango)", reward: "var(--lima)", system: "var(--cafe)", chat: "var(--mora)",
};

export function NotificationsView() {
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const setCustomerView = useApp((s) => s.setCustomerView);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const notifs = data?.notifications ?? [];

  return (
    <div className="px-3 pt-4 sm:px-5 lg:px-0">
      <button onClick={() => setCustomerView("discover")} className="mb-3 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ChevronLeft size={16} /> Volver
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <Bell size={22} style={{ color: "var(--antojo)" }} /> Avisos
        </h1>
        {notifs.some((n: any) => !n.read) && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => { notifs.forEach((n: any) => !n.read && markRead.mutate(n.id)); toast.success("Todos marcados como leídos"); }}>
            <CheckCheck size={14} /> Marcar todos
          </Button>
        )}
      </div>

      {notifs.length === 0 ? (
        <Card className="p-10 text-center">
          <Bell size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">No tienes notificaciones</p>
          <p className="text-sm text-muted-foreground">Aquí verás el estado de tus pedidos, promos y recompensas.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifs.map((n: any) => (
            <Card key={n.id} onClick={() => { markRead.mutate(n.id); if (n.orderId) { setActiveOrderId(n.orderId); setCustomerView("tracking"); } }}
              className={cn("flex cursor-pointer items-start gap-3 p-3.5 shadow-soft transition hover:shadow-glow", !n.read && "ring-1")}
              style={!n.read ? { borderColor: TYPE_COLOR[n.type] ?? "var(--border)" } : undefined}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{ background: `oklch(from ${TYPE_COLOR[n.type] ?? "var(--cafe)"} l c h / 0.12)` }}>{n.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-bold">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
              </div>
              {!n.read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "var(--antojo)" }} />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export function useRealtimeSync() {
  const socket = useSocket();
  const qc = useQueryClient();
  const role = useApp((s) => s.role);
  const setActiveOrderId = useApp((s) => s.setActiveOrderId);
  const activeOrderId = useApp((s) => s.activeOrderId);

  useEffect(() => {
    if (!socket) return;
    const onConnect = () => {
      socket.emit("identify", { role, id: "demo", name: role === "domiciliario" ? "Andrés Gómez" : role === "restaurante" ? "Sushi Roll Express" : role === "admin" ? "Admin" : "Valentina" });
    };
    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    const onOrderUpdate = (payload: any) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["order", payload.orderId] });
      qc.invalidateQueries({ queryKey: ["driver-orders"] });
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      if (payload.type === "status" && payload.status && role === "cliente" && payload.orderId === activeOrderId) {
        const labels: Record<string, string> = {
          accepted: "🏪 El restaurante aceptó tu pedido",
          preparing: "👨‍🍳 Están preparando tu antojo",
          ready: "🛍️ Listo para recoger",
          picked_up: "🏍️ ¡El domiciliario va en camino!",
          en_route: "📍 Tu pedido está en ruta",
          delivered: "🎉 ¡Pedido entregado! ¡Buen provecho!",
        };
        if (labels[payload.status]) toast(labels[payload.status]);
      }
      if (payload.type === "driver" && role === "cliente" && payload.orderId === activeOrderId) {
        toast(`🏍️ ${payload.driverName} es tu domiciliario`);
      }
      if (payload.type === "status" && role === "restaurante" && payload.status === "placed") {
        toast("🔔 ¡Nuevo pedido entrante!");
      }
    };

    const onOrderNew = (order: any) => {
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      if (role === "restaurante" || role === "admin") toast(`🔔 Nuevo pedido ${order.code}`);
    };

    const onDriverLocation = (payload: any) => {
      qc.setQueryData(["order", payload.orderId], (old: any) => {
        if (!old) return old;
        return { ...old, order: { ...old.order, driverLat: payload.lat, driverLng: payload.lng } };
      });
    };

    const onChatMessage = (msg: any) => {
      qc.invalidateQueries({ queryKey: ["messages", msg.orderId] });
      if (msg.orderId === activeOrderId && msg.sender !== "customer" && msg.sender !== "ai") {
        toast(`💬 ${msg.sender === "driver" ? "Domiciliario" : msg.sender}: ${msg.text}`);
      }
    };

    socket.on("order:update", onOrderUpdate);
    socket.on("order:new", onOrderNew);
    socket.on("driver:location", onDriverLocation);
    socket.on("chat:message", onChatMessage);

    return () => {
      socket.off("connect", onConnect);
      socket.off("order:update", onOrderUpdate);
      socket.off("order:new", onOrderNew);
      socket.off("driver:location", onDriverLocation);
      socket.off("chat:message", onChatMessage);
    };
  }, [socket, role, qc, activeOrderId, setActiveOrderId]);
}

"use client";

import { useEffect } from "react";

/**
 * Registra el service worker de Antojo para habilitar PWA (instalable + offline).
 * Solo se registra en producción o cuando el archivo /sw.js existe.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Solo registrar en https/localhost (no en file://)
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // Silencioso: la app sigue funcionando sin SW
        console.warn("[PWA] SW no registrado:", err.message);
      });
    };

    // Registrar después de que la página cargue para no bloquear el primer render
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => window.removeEventListener("load", register);
  }, []);
}

"use client";

import { useEffect, useRef, useState } from "react";

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  permission: "prompt" | "granted" | "denied" | "unsupported";
  watching: boolean;
}

/**
 * Hook para acceder al GPS real del dispositivo (Geolocation API).
 * - watchPosition: actualiza continuamente la ubicación
 * - Maneja permisos, errores y compatibilidad
 *
 * Uso típico: el domiciliario activa esto durante una entrega para
 * emitir su ubicación real al WebSocket (en vez de la simulación).
 */
export function useGeolocation(active: boolean) {
  const [state, setState] = useState<GeoState>({
    lat: null, lng: null, accuracy: null, error: null,
    permission: "prompt", watching: false,
  });
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState((s) => ({ ...s, watching: false }));
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, permission: "unsupported", error: "GPS no soportado en este dispositivo" }));
      return;
    }

    // Verificar permisos si la API lo permite
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((result) => {
        setState((s) => ({ ...s, permission: result.state as any }));
        result.onchange = () => setState((s) => ({ ...s, permission: result.state as any }));
      }).catch(() => {});
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState((s) => ({
        ...s,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        error: null,
        watching: true,
        permission: "granted",
      }));
    };

    const onError = (err: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        error: err.message,
        watching: false,
        permission: err.code === 1 ? "denied" : s.permission,
      }));
    };

    watchId.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [active]);

  return state;
}

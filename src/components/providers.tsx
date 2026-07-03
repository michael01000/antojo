"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: false, retry: 1 },
        },
      })
  );
  return (
    <QueryClientProvider client={qc}>
      <SocketProvider>{children}</SocketProvider>
    </QueryClientProvider>
  );
}

// ---- Socket ----
const SocketCtx = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const s = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      timeout: 10000,
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);
  return <SocketCtx.Provider value={socket}>{children}</SocketCtx.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketCtx);
}

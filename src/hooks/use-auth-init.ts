"use client";

import { useEffect } from "react";
import { useAuthMe, useLogout } from "./use-data";
import { useApp } from "@/lib/store";

/**
 * Hydrates the auth store from /api/auth/me on mount and keeps it in sync
 * whenever the cached /me response changes (e.g. after login/register/logout).
 */
export function useAuthInit() {
  const { data, isLoading, isError } = useAuthMe();
  const setAuth = useApp((s) => s.setAuth);

  useEffect(() => {
    if (isLoading) return;
    if (isError || !data?.user) {
      setAuth(null);
      return;
    }
    setAuth(data.user);
  }, [data, isLoading, isError, setAuth]);

  return { isLoading, authStatus: useApp((s) => s.authStatus) };
}

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AppState } from "@/server/state";
import { api, ApiError } from "@/src/lib/api";

export interface AppContextType {
  state: AppState | null;
  loading: boolean;
  error: string;
  busy: boolean;
  toast: string;
  setToast: (msg: string) => void;
  setError: (err: string) => void;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
  isGuardian: boolean;
  actor: AppState["actor"] | null;
  run: (action: () => Promise<unknown>, message?: string) => Promise<void>;
  save: (endpoint: string, values: unknown, id?: string) => Promise<unknown>;
  studentName: (id: string) => string;
  className: (id: string) => string;
  yearName: (id: string) => string;
  debts: (studentId: string) => AppState["invoices"];
  balance: (studentId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    pathnameRef.current = pathname;
    setError("");
  }, [pathname]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<AppState>("state");
      setState(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setState(null);
        if (pathnameRef.current !== "/masuk") {
          router.push("/masuk");
        }
      } else {
        setError(e instanceof Error ? e.message : "Gagal memuat data");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const can = useCallback(
    (permission: string) => {
      if (!state?.actor) return false;
      return state.actor.permissions.includes(permission);
    },
    [state],
  );

  const isGuardian = state ? !can("read") : false;
  const actor = state?.actor || null;

  const run = useCallback(
    async (action: () => Promise<unknown>, message = "Data tersimpan") => {
      if (busy) return;
      setBusy(true);
      setError("");
      try {
        await action();
        await refresh();
        setToast(message);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Permintaan gagal");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [busy, refresh],
  );

  const save = useCallback(
    async (endpoint: string, values: unknown, id?: string) => {
      const res = await api(
        endpoint + (id ? "/" + id : ""),
        id ? "PATCH" : "POST",
        values,
      );
      await refresh();
      setToast("Data tersimpan");
      return res;
    },
    [refresh],
  );

  const studentName = useCallback(
    (id: string) => state?.students.find((s) => s.id === id)?.name || "Siswa",
    [state],
  );

  const className = useCallback(
    (id: string) => state?.classes.find((c) => c.id === id)?.name || "—",
    [state],
  );

  const yearName = useCallback(
    (id: string) =>
      state?.academicYears.find((y) => y.id === id)?.name || "—",
    [state],
  );

  const debts = useCallback(
    (id: string) =>
      state?.invoices.filter((i) => i.studentId === id && i.status !== "PAID") ||
      [],
    [state],
  );

  const balance = useCallback(
    (id: string) => debts(id).reduce((sum, i) => sum + i.amount, 0),
    [debts],
  );

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        error,
        busy,
        toast,
        setToast,
        setError,
        refresh,
        can,
        isGuardian,
        actor,
        run,
        save,
        studentName,
        className,
        yearName,
        debts,
        balance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

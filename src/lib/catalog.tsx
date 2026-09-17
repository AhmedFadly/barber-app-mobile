import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api } from "./api";
import type { Catalog, Service } from "./types";

type CatalogState = {
  catalog: Catalog | null;
  error: string | null;
  reload: () => Promise<void>;
  serviceById: (id: string) => Service | undefined;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setCatalog(await api.catalog());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    api.catalog().then(setCatalog, (e: Error) => setError(e.message));
  }, []);

  const value = useMemo<CatalogState>(() => {
    const services = new Map(catalog?.categories.flatMap((c) => c.services.map((s) => [s.id, s] as const)));
    return { catalog, error, reload, serviceById: (id) => services.get(id) };
  }, [catalog, error, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}

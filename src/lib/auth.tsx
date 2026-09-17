import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, setAuthToken, setUnauthenticatedHandler } from "./api";
import { registerForPush } from "./notifications";
import { storage } from "./storage";
import type { Customer } from "./types";

const TOKEN_KEY = "regent.token";

type AuthState = {
  ready: boolean;
  customer: Customer | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: Parameters<typeof api.register>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  setCustomer: (c: Customer) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setCustomer(null);
    await storage.remove(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => void signOut());
    (async () => {
      const token = await storage.get(TOKEN_KEY);
      if (token) {
        setAuthToken(token);
        try {
          setCustomer((await api.me()).customer);
          void registerForPush();
        } catch {
          // Offline or expired: expired tokens are cleared by the 401 handler; offline keeps the token.
        }
      }
      setReady(true);
    })();
  }, [signOut]);

  const startSession = useCallback(async ({ token, customer }: { token: string; customer: Customer }) => {
    setAuthToken(token);
    await storage.set(TOKEN_KEY, token);
    setCustomer(customer);
    void registerForPush();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      customer,
      setCustomer,
      signOut,
      signIn: async (email, password) => startSession(await api.login(email, password)),
      signUp: async (input) => startSession(await api.register(input)),
      refresh: async () => {
        if (customer) setCustomer((await api.me()).customer);
      },
    }),
    [ready, customer, signOut, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

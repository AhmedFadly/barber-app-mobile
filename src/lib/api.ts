import Constants from "expo-constants";
import { Platform } from "react-native";

import type { Appointment, Catalog, Checkout, Customer, GiftCardSent, NewsPost, NewsSummary, Slot, WalletActivity } from "./types";

const API_PORT = 4800;

/** EXPO_PUBLIC_API_URL wins; in development we reach the backend on the same machine as the Metro bundler. */
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
  return `http://${host}:${API_PORT}`;
}

export const API_URL = `${resolveBaseUrl()}/api/v1`;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function setUnauthenticatedHandler(fn: () => void) {
  onUnauthenticated = fn;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach REGENT right now. Check your connection and try again.", "network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthenticated?.();
    throw new ApiError(res.status, data.error ?? "Something went wrong", data.code);
  }
  return data as T;
}

type AuthResult = { token: string; customer: Customer };

export const api = {
  register: (input: { firstName: string; lastName: string; email: string; phone: string; password: string; marketingOptIn: boolean }) =>
    request<AuthResult>("POST", "/auth/register", input),
  login: (email: string, password: string) => request<AuthResult>("POST", "/auth/login", { email, password }),
  me: () => request<{ customer: Customer }>("GET", "/me"),
  updateMe: (patch: Partial<Pick<Customer, "firstName" | "lastName" | "phone" | "birthday" | "marketingOptIn" | "favouriteBarberId">>) =>
    request<{ customer: Customer }>("PATCH", "/me", patch),
  deleteMe: () => request<{ ok: true }>("DELETE", "/me"),
  registerPushToken: (token: string, platform: string) => request<{ ok: true }>("POST", "/me/push-tokens", { token, platform }),

  catalog: () => request<Catalog>("GET", "/catalog"),
  news: () => request<{ posts: NewsSummary[] }>("GET", "/news"),
  newsPost: (id: string) => request<{ post: NewsPost }>("GET", `/news/${id}`),

  availability: (q: { branchId: string; serviceIds: string[]; date: string; barberId?: string | null; excludeAppointmentId?: string }) => {
    const params = new URLSearchParams({ branchId: q.branchId, serviceIds: q.serviceIds.join(","), date: q.date });
    if (q.barberId) params.set("barberId", q.barberId);
    if (q.excludeAppointmentId) params.set("excludeAppointmentId", q.excludeAppointmentId);
    return request<{ durationMin: number; slots: Slot[] }>("GET", `/availability?${params}`);
  },

  appointments: () => request<{ appointments: Appointment[] }>("GET", "/appointments"),
  appointment: (id: string) => request<{ appointment: Appointment }>("GET", `/appointments/${id}`),
  book: (input: { branchId: string; serviceIds: string[]; barberId: string | null; startsAt: string; notes?: string; useCredit: boolean; returnUrl: string }) =>
    request<{ appointment: Appointment; checkout: Checkout | null }>("POST", "/appointments", input),
  cancel: (id: string) => request<{ appointment: Appointment; refundedFils: number; forfeitedFils: number }>("POST", `/appointments/${id}/cancel`),
  reschedule: (id: string, startsAt: string, barberId: string | null) =>
    request<{ appointment: Appointment }>("POST", `/appointments/${id}/reschedule`, { startsAt, barberId }),
  resumePayment: (id: string, returnUrl: string) => request<{ checkout: Checkout }>("POST", `/appointments/${id}/pay`, { returnUrl }),

  payment: (id: string) =>
    request<{ state: "PENDING" | "SUCCEEDED" | "FAILED"; appointmentId: string | null; giftCard: { code: string; amountFils: number; recipientName: string } | null }>(
      "GET",
      `/payments/${id}`,
    ),
  confirmDemoPayment: (id: string) => request<{ ok: true }>("POST", `/payments/${id}/demo-confirm`),

  wallet: () => request<{ customer: Customer; activity: WalletActivity[]; giftCardsSent: GiftCardSent[] }>("GET", "/wallet"),
  redeemPoints: (blocks: number) => request<{ customer: Customer }>("POST", "/wallet/redeem-points", { blocks }),
  buyGiftCard: (input: { amountFils: number; recipientName: string; recipientEmail?: string; message?: string; returnUrl: string }) =>
    request<{ giftCardId: string; checkout: Checkout }>("POST", "/gift-cards", input),
  redeemGiftCard: (code: string) => request<{ amountFils: number; customer: Customer }>("POST", "/gift-cards/redeem", { code }),
};

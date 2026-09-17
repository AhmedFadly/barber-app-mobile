import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { api } from "./api";
import type { Checkout } from "./types";

export const paymentReturnUrl = () => Linking.createURL("payment-complete");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Opens Stripe Checkout in a secure browser sheet, then confirms with the backend.
 * Resolves true when paid. Demo mode is handled by the in-app /pay screen instead.
 */
export async function payWithStripe(checkout: Checkout): Promise<boolean> {
  if (!checkout.checkoutUrl) return false;
  await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, paymentReturnUrl());
  // Whether the sheet closed via redirect or the user dismissed it, the server is the source of truth.
  for (let i = 0; i < 6; i++) {
    const { state } = await api.payment(checkout.paymentId);
    if (state === "SUCCEEDED") return true;
    if (state === "FAILED") return false;
    await sleep(1000);
  }
  return false;
}

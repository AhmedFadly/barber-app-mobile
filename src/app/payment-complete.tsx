import { Redirect } from "expo-router";

// Deep-link landing for Stripe's return redirect. The checkout flow already handles the result;
// if the OS routes the link into the app instead, just send the customer to their bookings.
export default function PaymentComplete() {
  return <Redirect href="/bookings" />;
}

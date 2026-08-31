import { loadStripe, Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

// Publishable key for the connected Stripe account (safe to ship in the client).
const PUBLISHABLE_KEY =
  "pk_live_51UAPhZAdDSnOK0Gp37AmrV5TD1dbW1EbsWmw2qozQGY4SAIzkum1KHeczIFSkPAdYtLoVIBnSsUYjd1wrTfCqSDq00PLGnAAAS";

const clientToken =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) || PUBLISHABLE_KEY;

const environment: StripeEnv = clientToken.startsWith("pk_test_") ? "sandbox" : "live";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}

export function isTestMode(): boolean {
  return clientToken.startsWith("pk_test_");
}

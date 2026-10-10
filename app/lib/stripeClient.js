import Stripe from "stripe";

export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function publicOrigin(value) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (host === "gemelo.online" || host === "127.0.0.1" || host === "localhost" || host.endsWith(".vercel.app")) {
      return url.origin;
    }
  } catch {
    /* ignore */
  }
  return "https://gemelo.online";
}

export function integrationLabel() {
  const suffix = Math.random().toString(36).replace(/[^a-z]/g, "").slice(2, 10).padEnd(8, "x");
  return `gemelo-campaign-${suffix}`;
}

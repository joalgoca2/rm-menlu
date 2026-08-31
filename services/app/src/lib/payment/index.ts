import { MockProvider } from "./mock.provider";
import type { PaymentProvider } from "./provider.interface";

export * from "./provider.interface";
export * from "./mock.provider";
export * from "./stripe.provider";

/**
 * Payment Provider Factory
 * Returns MockProvider by default (or StripeProvider when activated via env)
 */
export function getPaymentProvider(): PaymentProvider {
  const providerType = process.env.PAYMENT_PROVIDER?.toLowerCase() ?? "mock";

  if (providerType === "mock") {
    return new MockProvider();
  }

  // Fallback to MockProvider when no external provider package is active
  return new MockProvider();
}

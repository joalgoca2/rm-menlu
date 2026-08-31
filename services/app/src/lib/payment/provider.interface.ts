export interface CheckoutSessionOptions {
  userId: string;
  userEmail: string;
  planName: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

export interface WebhookEventPayload {
  event:
    | "payment.success"
    | "payment.failed"
    | "subscription.created"
    | "subscription.canceled";
  userId: string;
  planName: string;
  amount: number;
  billingCycle: "MONTHLY" | "YEARLY";
  startDate: Date;
  endDate: Date;
  providerTransactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResult>;
  verifyAndParseWebhook(req: Request): Promise<WebhookEventPayload | null>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}

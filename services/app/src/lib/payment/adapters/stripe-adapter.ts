import type {
  IPaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentWebhookEvent,
  PaymentGatewayType,
} from "@/types";

export class StripeAdapter implements IPaymentProvider {
  readonly gatewayType: PaymentGatewayType = "STRIPE";

  constructor(
    private readonly publicKey: string,
    private readonly secretKey: string,
    private readonly webhookSecret?: string
  ) {}

  async createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput> {
    const isMock = this.secretKey.includes("mock");
    const sessionId = `cs_stripe_${Date.now()}`;
    const checkoutUrl = isMock
      ? `${input.returnUrl}?session_id=${sessionId}`
      : `https://checkout.stripe.com/c/pay/${sessionId}`;

    return {
      sessionId,
      checkoutUrl,
      gatewayType: "STRIPE",
    };
  }

  verifyWebhookSignature(
    payload: string,
    headers: Record<string, string>
  ): boolean {
    if (!this.webhookSecret) return true;
    const signature = headers["stripe-signature"];
    return Boolean(payload && signature);
  }

  async parseWebhookEvent(payload: unknown): Promise<PaymentWebhookEvent> {
    const data = payload as {
      id?: string;
      data?: { object?: { id?: string; amount_total?: number; status?: string } };
    };

    const externalId = data.data?.object?.id || data.id || `evt_stripe_${Date.now()}`;
    const rawStatus = data.data?.object?.status || "complete";

    const status = rawStatus === "complete" ? "APPROVED" : "PENDING";

    return {
      externalId,
      status,
      amount: (data.data?.object?.amount_total || 0) / 100,
      currency: "USD",
      rawPayload: payload,
    };
  }
}

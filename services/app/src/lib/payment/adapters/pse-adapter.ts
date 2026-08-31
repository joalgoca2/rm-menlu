import type {
  IPaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentWebhookEvent,
  PaymentGatewayType,
} from "@/types";

export class PSEAdapter implements IPaymentProvider {
  readonly gatewayType: PaymentGatewayType = "PSE";

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret?: string
  ) {}

  async createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput> {
    const sessionId = `pse_txn_${Date.now()}`;
    const checkoutUrl = `${input.returnUrl}?pse_ref=${sessionId}`;

    return {
      sessionId,
      checkoutUrl,
      gatewayType: "PSE",
    };
  }

  verifyWebhookSignature(
    payload: string,
    headers: Record<string, string>
  ): boolean {
    if (!this.webhookSecret) return true;
    return Boolean(payload && headers);
  }

  async parseWebhookEvent(payload: unknown): Promise<PaymentWebhookEvent> {
    const data = payload as { ticketId?: string; status?: string };
    return {
      externalId: data.ticketId || `pse_${Date.now()}`,
      status: data.status === "OK" ? "APPROVED" : "PENDING",
      amount: 0,
      currency: "COP",
      rawPayload: payload,
    };
  }
}

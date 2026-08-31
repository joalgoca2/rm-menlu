import type {
  IPaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentWebhookEvent,
  PaymentGatewayType,
} from "@/types";

export class MockAdapter implements IPaymentProvider {
  gatewayType: PaymentGatewayType = "MOCK";

  async createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput> {
    const sessionId = `mock_sess_${Date.now()}`;
    const checkoutUrl = `${input.returnUrl}?mock_session_id=${sessionId}&status=APPROVED`;

    return {
      sessionId,
      checkoutUrl,
      gatewayType: this.gatewayType,
    };
  }

  verifyWebhookSignature(_payload: string, _headers: Record<string, string>): boolean {
    return true;
  }

  async parseWebhookEvent(payload: unknown): Promise<PaymentWebhookEvent> {
    const p = (payload || {}) as Record<string, unknown>;
    return {
      externalId: String(p.sessionId || p.id || `mock_tx_${Date.now()}`),
      status: "APPROVED",
      amount: Number(p.amount || 10),
      currency: String(p.currency || "MXN"),
      metadata: (p.metadata || {}) as Record<string, string>,
      rawPayload: payload,
    };
  }
}

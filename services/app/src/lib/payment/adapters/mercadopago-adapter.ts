import type {
  IPaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentWebhookEvent,
  PaymentGatewayType,
} from "@/types";

export class MercadoPagoAdapter implements IPaymentProvider {
  readonly gatewayType: PaymentGatewayType = "MERCADOPAGO";

  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret?: string
  ) {}

  async createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput> {
    const isMock = this.accessToken.includes("mock");
    const sessionId = `mp_pref_${Date.now()}`;
    const checkoutUrl = isMock
      ? `${input.returnUrl}?pref_id=${sessionId}`
      : `https://www.mercadopago.com/checkout/v1/redirect?pref_id=${sessionId}`;

    return {
      sessionId,
      checkoutUrl,
      gatewayType: "MERCADOPAGO",
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
    const data = payload as {
      id?: string;
      action?: string;
      data?: { id?: string };
    };

    const externalId = data.data?.id || data.id || `mp_evt_${Date.now()}`;
    return {
      externalId,
      status: "APPROVED",
      amount: 0,
      currency: "MXN",
      rawPayload: payload,
    };
  }
}

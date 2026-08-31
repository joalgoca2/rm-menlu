import type {
  IPaymentProvider,
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentWebhookEvent,
  PaymentGatewayType,
} from "@/types";

export class ClipAdapter implements IPaymentProvider {
  readonly gatewayType: PaymentGatewayType = "CLIP";

  constructor(
    private readonly apiKey: string,
    private readonly secretKey: string,
    private readonly webhookSecret?: string
  ) {}

  async createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput> {
    const isSandbox = this.secretKey.startsWith("sk_test");
    const baseUrl = isSandbox
      ? "https://api-stage.payclip.com"
      : "https://api.payclip.com";

    const payload = {
      amount: input.amount,
      currency: input.currency || "MXN",
      purchase_description: input.description,
      redirection_url: {
        success: input.returnUrl,
        error: input.cancelUrl,
        default: input.returnUrl,
      },
      metadata: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        brandId: input.brandId || "",
        customerEmail: input.customerEmail,
        ...input.metadata,
      },
    };

    const authToken = Buffer.from(
      `${this.apiKey}:${this.secretKey}`
    ).toString("base64");

    const response = await fetch(`${baseUrl}/v2/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Clip API error [${response.status}]: ${errorText}`);
    }

    const data = (await response.json()) as {
      id?: string;
      checkout_url?: string;
      url?: string;
    };

    const sessionId = data.id || `clip_${Date.now()}`;
    const checkoutUrl =
      data.checkout_url || data.url || `${baseUrl}/checkout/${sessionId}`;

    return {
      sessionId,
      checkoutUrl,
      gatewayType: "CLIP",
    };
  }

  verifyWebhookSignature(
    payload: string,
    headers: Record<string, string>
  ): boolean {
    if (!this.webhookSecret) return true;
    const signature = headers["x-clip-signature"] || headers["clip-signature"];
    if (!signature) return false;
    return Boolean(payload && signature);
  }

  async parseWebhookEvent(payload: unknown): Promise<PaymentWebhookEvent> {
    const data = payload as {
      id?: string;
      checkout_id?: string;
      status?: string;
      amount?: number;
      currency?: string;
      metadata?: Record<string, string>;
    };

    const externalId = data.id || data.checkout_id || `clip_evt_${Date.now()}`;
    const rawStatus = (data.status || "APPROVED").toUpperCase();

    let status: "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" = "PENDING";
    if (rawStatus === "PAID" || rawStatus === "APPROVED" || rawStatus === "SUCCESS") {
      status = "APPROVED";
    } else if (rawStatus === "FAILED" || rawStatus === "REJECTED") {
      status = "REJECTED";
    } else if (rawStatus === "CANCELLED" || rawStatus === "EXPIRED") {
      status = "CANCELLED";
    }

    return {
      externalId,
      status,
      amount: data.amount || 0,
      currency: data.currency || "MXN",
      metadata: data.metadata,
      rawPayload: payload,
    };
  }
}

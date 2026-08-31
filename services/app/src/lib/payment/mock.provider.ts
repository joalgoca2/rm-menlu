import type {
  CheckoutSessionOptions,
  CheckoutSessionResult,
  PaymentProvider,
  WebhookEventPayload,
} from "./provider.interface";

export class MockProvider implements PaymentProvider {
  name = "MockProvider";

  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResult> {
    const mockSessionId = `mock_sess_${Date.now()}`;
    const separator = options.successUrl.includes("?") ? "&" : "?";
    const checkoutUrl = `${options.successUrl}${separator}mock_session_id=${mockSessionId}`;

    return {
      sessionId: mockSessionId,
      checkoutUrl,
    };
  }

  async verifyAndParseWebhook(req: Request): Promise<WebhookEventPayload | null> {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      const userId = (body.userId as string) ?? "usr_mock_123";
      const planName = (body.planName as string) ?? "Pro";
      const amount = Number(body.amount ?? 19.0);
      const billingCycle =
        (body.billingCycle as "MONTHLY" | "YEARLY") ?? "MONTHLY";

      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === "YEARLY") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      return {
        event: "payment.success",
        userId,
        planName,
        amount,
        billingCycle,
        startDate,
        endDate,
        providerTransactionId: `mock_tx_${Date.now()}`,
        metadata: body,
      };
    } catch (_err: unknown) {
      return null;
    }
  }

  async cancelSubscription(_subscriptionId: string): Promise<boolean> {
    return true;
  }
}

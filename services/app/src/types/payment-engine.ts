export type PaymentOwnerType = "BRAND" | "USER";

export type PaymentGatewayType = "CLIP" | "STRIPE" | "MERCADOPAGO" | "PSE" | "MOCK";

export interface BrandPaymentConfig {
  id: string;
  brandId: string;
  gatewayType: PaymentGatewayType;
  publicKey: string;
  encryptedSecretKey: string;
  webhookSecret?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentTransaction {
  id: string;
  ownerType: PaymentOwnerType;
  ownerId: string;
  brandId?: string | null;
  gatewayType: PaymentGatewayType;
  externalId?: string | null;
  checkoutUrl?: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | string;
  metadata?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CheckoutSessionInput {
  ownerType: PaymentOwnerType;
  ownerId: string;
  brandId?: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  returnUrl: string;
  cancelUrl: string;
  gatewayType?: PaymentGatewayType;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionOutput {
  sessionId: string;
  checkoutUrl: string;
  gatewayType: PaymentGatewayType;
}

export interface PaymentWebhookEvent {
  externalId: string;
  status: "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING";
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
  rawPayload: unknown;
}

export interface IPaymentProvider {
  gatewayType: PaymentGatewayType;
  createCheckoutSession(
    input: CheckoutSessionInput
  ): Promise<CheckoutSessionOutput>;
  verifyWebhookSignature(
    payload: string,
    headers: Record<string, string>
  ): boolean;
  parseWebhookEvent(payload: unknown): Promise<PaymentWebhookEvent>;
}

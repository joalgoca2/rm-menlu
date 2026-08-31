import type { IPaymentProvider } from "@/types";
import { prisma } from "@/lib/prisma";
import { ClipAdapter } from "./adapters/clip-adapter";
import { StripeAdapter } from "./adapters/stripe-adapter";
import { MercadoPagoAdapter } from "./adapters/mercadopago-adapter";
import { PSEAdapter } from "./adapters/pse-adapter";
import { MockAdapter } from "./adapters/mock-adapter";
import { decryptSecret } from "@/lib/crypto";

export class PaymentGatewayFactory {
  static async getAdapterForBrand(
    brandId: string,
    requestedGateway?: string
  ): Promise<IPaymentProvider> {
    // 1. If requested specific gateway or for SaaS System ("brand-general" / "global"),
    // use getSaaSPlatformAdapter
    if (brandId === "brand-general" || brandId === "global" || !brandId) {
      return this.getSaaSPlatformAdapter(requestedGateway);
    }

    // 2. Query Tenant Brand payment configuration from DB
    const config = await prisma.brandPaymentConfig.findFirst({
      where: { brandId, isActive: true },
    });

    // Fallback to SaaS platform env variables if tenant brand has no active config
    if (!config || !config.isActive) {
      return this.getSaaSPlatformAdapter(requestedGateway);
    }

    const secretKey = decryptSecret(config.encryptedSecretKey);
    const publicKey = config.publicKey;
    const webhookSecret = config.webhookSecret
      ? decryptSecret(config.webhookSecret)
      : undefined;

    switch (config.gatewayType as string) {
      case "CLIP":
        return new ClipAdapter(publicKey, secretKey, webhookSecret);
      case "STRIPE":
        return new StripeAdapter(publicKey, secretKey, webhookSecret);
      case "MERCADOPAGO":
        return new MercadoPagoAdapter(secretKey, webhookSecret);
      case "PSE":
        return new PSEAdapter(secretKey, webhookSecret);
      case "MOCK":
        return new MockAdapter();
      default:
        return new ClipAdapter(publicKey, secretKey, webhookSecret);
    }
  }

  static getSaaSPlatformAdapter(requestedGateway?: string): IPaymentProvider {
    const providerList = (process.env.PAYMENT_PROVIDERS || process.env.PAYMENT_PROVIDER || "CLIP")
      .toUpperCase()
      .split(",")
      .map((p) => p.trim());

    const targetProvider = (requestedGateway || providerList[0] || "CLIP").toUpperCase();

    if (targetProvider === "MOCK") {
      return new MockAdapter();
    }

    if (targetProvider === "STRIPE") {
      const pubKey = process.env.STRIPE_PUBLIC_KEY || "mock_stripe_pub";
      const secKey = process.env.STRIPE_SECRET_KEY || "mock_stripe_sec";
      const whSec = process.env.STRIPE_WEBHOOK_SECRET;
      return new StripeAdapter(pubKey, secKey, whSec);
    }

    if (targetProvider === "MERCADOPAGO") {
      const secKey = process.env.MERCADOPAGO_ACCESS_TOKEN || "mock_mp_token";
      const whSec = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      return new MercadoPagoAdapter(secKey, whSec);
    }

    if (targetProvider === "PSE") {
      const secKey = process.env.PSE_SECRET_KEY || "mock_pse_key";
      const whSec = process.env.PSE_WEBHOOK_SECRET;
      return new PSEAdapter(secKey, whSec);
    }

    // Default: Clip Hosted Checkout
    const pubKey = process.env.CLIP_PUBLIC_KEY || "mock_clip_pub_key";
    const secKey = process.env.CLIP_SECRET_KEY || "sk_test_mock_clip_secret";
    const whSec = process.env.CLIP_WEBHOOK_SECRET;
    return new ClipAdapter(pubKey, secKey, whSec);
  }

  static async getAdapterForUser(_userId: string): Promise<IPaymentProvider> {
    return this.getSaaSPlatformAdapter();
  }
}

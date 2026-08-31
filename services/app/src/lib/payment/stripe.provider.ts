/**
 * ==============================================================================
 * PLANTILLA DE ADAPTADOR PARA STRIPE (Activable al instalar el paquete `stripe`)
 * ==============================================================================
 *
 * Para activar Stripe en este proyecto en el futuro:
 * 1. Instala el SDK oficial de Stripe:
 *    npm install stripe --save
 *
 * 2. Descomenta el código a continuación y exporta la clase StripeProvider.
 *
 * 3. En services/app/src/lib/payment/index.ts, descomenta la importación
 *    de StripeProvider e inicialízala cuando `process.env.PAYMENT_PROVIDER === "stripe"`.
 *
 * 4. Define en tu archivo .env:
 *    PAYMENT_PROVIDER=stripe
 *    STRIPE_SECRET_KEY=sk_test_...
 *    STRIPE_WEBHOOK_SECRET=whsec_...
 * ==============================================================================
 */

/*
import Stripe from "stripe";
import type {
  CheckoutSessionOptions,
  CheckoutSessionResult,
  PaymentProvider,
  WebhookEventPayload,
} from "./provider.interface";

export class StripeProvider implements PaymentProvider {
  name = "StripeProvider";
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || "";
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });
  }

  async createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: options.userEmail,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        userId: options.userId,
        planName: options.planName,
        billingCycle: options.billingCycle,
        ...options.metadata,
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Plan ${options.planName}`,
            },
            unit_amount: Math.round(options.price * 100),
            recurring: {
              interval: options.billingCycle === "YEARLY" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url || options.cancelUrl,
    };
  }

  async verifyAndParseWebhook(req: Request): Promise<WebhookEventPayload | null> {
    try {
      const signature = req.headers.get("stripe-signature");
      if (!signature) return null;

      const body = await req.text();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || "";
        const planName = session.metadata?.planName || "Pro";
        const billingCycle = (session.metadata?.billingCycle || "MONTHLY") as "MONTHLY" | "YEARLY";
        const amount = (session.amount_total || 0) / 100;

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
          providerTransactionId: session.id,
          metadata: session.metadata,
        };
      }

      return null;
    } catch (_err: unknown) {
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
      return true;
    } catch (_err: unknown) {
      return false;
    }
  }
}
*/

export const STRIPE_PROVIDER_TEMPLATE_INFO =
  "StripeProvider template is ready in stripe.provider.ts. Install 'stripe' npm package to activate.";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayFactory } from "@/lib/payment/factory";
import type { PaymentGatewayType } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const provider = (resolvedParams.provider.toUpperCase() || "CLIP") as PaymentGatewayType;

  const url = req.url;
  const brandId = req.nextUrl.searchParams.get("brandId") || undefined;
  const rawBody = await req.text();

  let payloadObj: unknown = {};
  try {
    payloadObj = JSON.parse(rawBody);
  } catch {
    payloadObj = { raw: rawBody };
  }

  const headersObj: Record<string, string> = {};
  req.headers.forEach((val, key) => {
    headersObj[key.toLowerCase()] = val;
  });

  try {
    const adapter = brandId
      ? await PaymentGatewayFactory.getAdapterForBrand(brandId)
      : await PaymentGatewayFactory.getAdapterForUser("global");

    const isValid = adapter.verifyWebhookSignature(rawBody, headersObj);
    if (!isValid) {
      await logWebhookAttempt({
        brandId,
        event: `payment.webhook.${provider}.unauthorized`,
        url,
        status: 401,
        success: false,
        payload: rawBody,
        errorMessage: "Invalid signature header",
        durationMs: Date.now() - startTime,
      });

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = await adapter.parseWebhookEvent(payloadObj);

    if (event.externalId) {
      await prisma.paymentTransaction.updateMany({
        where: { externalId: event.externalId },
        data: {
          status: event.status,
          updatedAt: new Date(),
        },
      });
    }

    await logWebhookAttempt({
      brandId,
      event: `payment.webhook.${provider}.${event.status.toLowerCase()}`,
      url,
      status: 200,
      success: true,
      payload: rawBody,
      response: JSON.stringify({ received: true, externalId: event.externalId }),
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ received: true, status: event.status });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Webhook handling failed";

    await logWebhookAttempt({
      brandId,
      event: `payment.webhook.${provider}.error`,
      url,
      status: 500,
      success: false,
      payload: rawBody,
      errorMessage: errorMsg,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

async function logWebhookAttempt(data: {
  brandId?: string;
  event: string;
  url: string;
  status: number;
  success: boolean;
  payload: string;
  response?: string;
  errorMessage?: string;
  durationMs: number;
}) {
  try {
    await prisma.webhookLog.create({
      data: {
        brandId: data.brandId || null,
        event: data.event,
        url: data.url,
        status: data.status,
        success: data.success,
        payload: data.payload,
        response: data.response || null,
        errorMessage: data.errorMessage || null,
        durationMs: data.durationMs,
      },
    });
  } catch {
    // Fail-safe log capture
  }
}

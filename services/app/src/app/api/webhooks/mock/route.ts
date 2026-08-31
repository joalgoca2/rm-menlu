import { NextResponse } from "next/server";
import { toUtcDate } from "@/lib/date";
import { getPaymentProvider } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { triggerOutboundWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  try {
    const provider = getPaymentProvider();
    const parsedPayload = await provider.verifyAndParseWebhook(req);

    if (!parsedPayload) {
      return NextResponse.json(
        { success: false, error: "Evento de pago simulado no válido." },
        { status: 400 }
      );
    }

    const {
      userId,
      planName,
      amount,
      billingCycle,
      startDate,
      endDate,
    } = parsedPayload;

    let targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, brandId: true },
    });

    if (!targetUser) {
      // Fallback: look up by admin email or first active user in system
      targetUser = await prisma.user.findFirst({
        where: { email: "admin@remotemonkeys.ai" },
        select: { id: true, brandId: true },
      }) ?? await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, brandId: true },
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "No existe un usuario en el sistema para asociar la suscripción." },
        { status: 400 }
      );
    }

    const targetBrandId = targetUser.brandId ?? (await prisma.brand.findFirst())?.id;

    if (!targetBrandId) {
      return NextResponse.json(
        { success: false, error: "No existe una marca en el sistema para asociar la suscripción." },
        { status: 400 }
      );
    }

    const validUserId = targetUser.id;
    const utcStart = toUtcDate(startDate) ?? new Date();
    const utcEnd = toUtcDate(endDate) ?? new Date();

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        brandId: targetBrandId,
        userId: validUserId,
        planName,
        status: "ACTIVE",
        billingCycle,
        startDate: utcStart,
        endDate: utcEnd,
        price: amount,
        discount: 0,
        finalPrice: amount,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        brandId: targetBrandId,
        userId: validUserId,
        amount,
        discountApplied: 0,
        paymentDate: utcStart,
        status: "SUCCESS",
        billingPeriodStart: utcStart,
        billingPeriodEnd: utcEnd,
        notes: `Pago procesado vía ${provider.name}`,
      },
    });

    // Trigger outbound webhook to n8n / brand billingWebhookUrl asynchronously
    triggerOutboundWebhook(targetUser.brandId, "payment.success", {
      paymentId: payment.id,
      subscriptionId: subscription.id,
      userId: validUserId,
      planName,
      amount,
      billingCycle,
      provider: provider.name,
      paidAtUtc: utcStart.toISOString(),
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "Webhook error";
      console.error("Outbound webhook trigger failed:", msg);
    });

    return NextResponse.json({
      success: true,
      message: "Pago simulado procesado y registrado correctamente en UTC.",
      data: {
        subscriptionId: subscription.id,
        paymentId: payment.id,
        paidAtUtc: utcStart.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al procesar pago simulado.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

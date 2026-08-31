"use server";

import { toUtcDate } from "@/lib/date";
import { getPaymentProvider } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { createLocalizedNotification } from "@/lib/notifications";
import { triggerOutboundWebhook } from "@/lib/webhook";
import {
  exchangeRateSchema,
  paymentSchema,
  planConfigSchema,
  subscriptionSchema,
  type ExchangeRateInput,
  type PaymentInput,
  type SubscriptionInput,
} from "@/lib/validations/billing";
import type {
  ApiResponse,
  ExchangeRate,
  Payment,
  PlanConfig,
  Subscription,
} from "@/types";

const CORE_PLANS = ["Free", "Pro", "Enterprise"];

export async function getPlanConfigs(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{ plans: PlanConfig[]; total: number; totalPages: number }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? { planName: { contains: search, mode: "insensitive" as const } }
      : {};

    const [total, rawPlans] = await Promise.all([
      prisma.planConfig.count({ where }),
      prisma.planConfig.findMany({
        where,
        orderBy: { priceMonthly: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const plans: PlanConfig[] = rawPlans.map((p) => ({
      id: p.id,
      planName: p.planName,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      currency: p.currency ?? "USD",
      maxProjects: p.maxProjects,
      allowCSVImportExport: p.allowCSVImportExport,
      hasLiveSupport: p.hasLiveSupport,
      hasAiAgent: (p as unknown as { hasAiAgent?: boolean }).hasAiAgent ?? false,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      success: true,
      data: {
        plans,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch plan configs.";
    return { success: false, error: message };
  }
}

export async function createPlanConfig(data: {
  planName: string;
  priceMonthly: number;
  priceYearly: number;
  currency?: string;
  maxProjects: number;
  allowCSVImportExport: boolean;
  hasLiveSupport: boolean;
}): Promise<ApiResponse<PlanConfig>> {
  try {
    const parsed = planConfigSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { planName } = parsed.data;
    const existing = await prisma.planConfig.findUnique({
      where: { planName },
    });

    if (existing) {
      return { success: false, error: `El plan ${planName} ya existe.` };
    }

    const created = await prisma.planConfig.create({
      data: parsed.data,
    });

    return {
      success: true,
      data: created,
      message: "Plan creado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create plan config.";
    return { success: false, error: message };
  }
}

export async function updatePlanConfig(
  id: string,
  data: {
    planName: string;
    priceMonthly: number;
    priceYearly: number;
    currency?: string;
    maxProjects: number;
    allowCSVImportExport: boolean;
    hasLiveSupport: boolean;
  }
): Promise<ApiResponse<PlanConfig>> {
  try {
    const parsed = planConfigSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const updated = await prisma.planConfig.update({
      where: { id },
      data: parsed.data,
    });

    return {
      success: true,
      data: updated,
      message: "Plan actualizado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update plan config.";
    return { success: false, error: message };
  }
}

export async function deletePlanConfig(id: string): Promise<ApiResponse<null>> {
  try {
    const existing = await prisma.planConfig.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Plan no encontrado." };
    }

    if (CORE_PLANS.includes(existing.planName)) {
      return {
        success: false,
        error:
          "Los planes base del sistema (Free, Pro, Enterprise) no se pueden eliminar.",
      };
    }

    await prisma.planConfig.delete({ where: { id } });
    return {
      success: true,
      data: null,
      message: "Plan eliminado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete plan config.";
    return { success: false, error: message };
  }
}

export async function checkAndSyncBrandSubscriptionGracePeriod(
  brandId: string,
  userId?: string
): Promise<void> {
  try {
    const now = new Date();

    const sub = await prisma.subscription.findFirst({
      where: {
        brandId,
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) return;

    if (
      sub.planName.toLowerCase() === "free" ||
      sub.planName.toLowerCase().includes("gratuito")
    ) {
      return;
    }

    const endDate = new Date(sub.endDate);
    const GRACE_PERIOD_DAYS = 5;
    const graceEndDate = new Date(
      endDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    // CASE A: Expired beyond 5 days grace period -> Downgrade to FREE
    if (now > graceEndDate) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELED" },
      });

      const targetPlanName = sub.scheduledPlanName || "Free";

      await prisma.subscription.create({
        data: {
          brandId,
          userId: userId || sub.userId || null,
          planName: targetPlanName,
          status: "ACTIVE",
          billingCycle: "MONTHLY",
          price: 0,
          discount: 0,
          finalPrice: 0,
          startDate: now,
          endDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      const targetUserId = userId || sub.userId;
      if (targetUserId) {
        await createLocalizedNotification({
          userId: targetUserId,
          type: "SUBSCRIPTION_EXPIRED_DOWNGRADE_FREE",
          data: { plan: targetPlanName },
        });
      }
    }
    // CASE B: Between expiration and 5 days grace period -> Mark PAST_DUE & Notify
    else if (now > endDate && sub.status !== "PAST_DUE") {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE" },
      });

      const targetUserId = userId || sub.userId;
      if (targetUserId) {
        await createLocalizedNotification({
          userId: targetUserId,
          type: "SUBSCRIPTION_PAST_DUE_WARNING",
        });
      }
    }
    // CASE C: Active and about to expire in less than 3 days -> Pre-warning Notification
    else if (now <= endDate) {
      const daysUntilExpiration =
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiration <= 3) {
        const targetUserId = userId || sub.userId;
        if (targetUserId) {
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: targetUserId,
              type: "SUBSCRIPTION_EXPIRING_SOON",
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
              },
            },
          });

          if (!existingNotif) {
            await createLocalizedNotification({
              userId: targetUserId,
              type: "SUBSCRIPTION_EXPIRING_SOON",
              data: {
                planName: sub.planName,
                endDate: new Date(sub.endDate).toLocaleDateString("es-ES"),
              },
            });
          }
        }
      }
    }
  } catch (_err) {
    // Ignore errors so app execution is never blocked
  }
}

export async function getBrandActiveSubscriptionAction(
  brandId: string,
  userId?: string
): Promise<
  ApiResponse<{
    planName: string;
    status: string;
    endDate?: string | null;
    scheduledPlanName?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null>
> {
  try {
    await checkAndSyncBrandSubscriptionGracePeriod(brandId, userId);

    const sub = await prisma.subscription.findFirst({
      where: { brandId, status: { in: ["ACTIVE", "PAST_DUE"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!sub) {
      return {
        success: true,
        data: { planName: "Plan Gratuito / Base", status: "ACTIVE" },
      };
    }

    return {
      success: true,
      data: {
        planName: sub.planName,
        status: sub.status,
        endDate: sub.endDate ? sub.endDate.toISOString() : null,
        scheduledPlanName: sub.scheduledPlanName,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brand subscription.";
    return { success: false, error: message };
  }
}

export async function switchBrandSubscriptionPlanAction(params: {
  userId: string;
  brandId: string;
  newPlanName: string;
  billingCycle?: "MONTHLY" | "YEARLY" | string;
  gatewayProvider?: string;
  trackingId?: string;
  rawGatewayStatus?: string;
  notes?: string;
}): Promise<ApiResponse<boolean>> {
  try {
    const trimmedName = params.newPlanName.split("?")[0].split("&")[0].trim();
    let plan = await prisma.planConfig.findFirst({
      where: {
        planName: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (!plan) {
      // Fallback: try searching contains or create default plan if db seed wasn't run
      plan = await prisma.planConfig.findFirst({
        where: {
          planName: {
            contains: trimmedName,
            mode: "insensitive",
          },
        },
      });
    }

    const effectivePlanName = plan?.planName ?? trimmedName;
    const cycle = (params.billingCycle || "MONTHLY").toUpperCase();
    const isYearly = cycle === "YEARLY";

    const effectivePrice = isYearly
      ? plan?.priceYearly ?? ((plan?.priceMonthly ?? 19) * 10)
      : plan?.priceMonthly ?? (trimmedName.toLowerCase().includes("pro") ? 19 : 99);

    // Get current active subscription for the brand
    const currentSub = await prisma.subscription.findFirst({
      where: { brandId: params.brandId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    const isDowngrade =
      Boolean(currentSub) &&
      effectivePrice < currentSub!.price &&
      currentSub!.endDate > new Date();

    if (isDowngrade && currentSub) {
      // Schedule Downgrade at Period End
      await prisma.subscription.update({
        where: { id: currentSub.id },
        data: {
          scheduledPlanName: effectivePlanName,
          cancelAtPeriodEnd: true,
        },
      });

      // Create Notification for User
      if (params.userId) {
        await createLocalizedNotification({
          userId: params.userId,
          type: "PLAN_DOWNGRADE_SCHEDULED",
          data: {
            targetPlan: effectivePlanName,
            endDate: currentSub.endDate
              ? new Date(currentSub.endDate).toLocaleDateString("es-ES")
              : "final del período",
          },
        });
      }

      const activePlan = currentSub.planName;
      const msg =
        `Cambio a ${effectivePlanName} programado exitosamente. ` +
        `Mantendrás tu plan ${activePlan} hasta su fecha de vencimiento.`;

      return {
        success: true,
        data: true,
        message: msg,
      };
    }

    // Immediate Upgrade / Plan Switch: cancel prior active subscriptions
    await prisma.subscription.updateMany({
      where: { brandId: params.brandId, status: "ACTIVE" },
      data: { status: "CANCELED" },
    });

    const periodStart = new Date();
    const periodEnd = isYearly
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create new active subscription directly for the brand
    await prisma.subscription.create({
      data: {
        brandId: params.brandId,
        userId: params.userId || null,
        planName: effectivePlanName,
        status: "ACTIVE",
        billingCycle: cycle,
        price: effectivePrice,
        discount: isYearly ? 20 : 0,
        finalPrice: effectivePrice,
        startDate: periodStart,
        endDate: periodEnd,
      },
    });

    // Record Payment transaction in database
    const providerName = params.gatewayProvider || "MOCK";
    const trackingIdVal = params.trackingId || `mock_sess_${Date.now()}`;
    const rawStatusVal = params.rawGatewayStatus || "APPROVED";

    await prisma.payment.create({
      data: {
        brandId: params.brandId,
        userId: params.userId || null,
        amount: effectivePrice,
        discountApplied: 0,
        paymentDate: periodStart,
        status:
          rawStatusVal === "APPROVED" ||
          rawStatusVal === "CHARGED" ||
          rawStatusVal === "SUCCESS"
            ? "SUCCESS"
            : "FAILED",
        gatewayProvider: providerName,
        trackingId: trackingIdVal,
        rawGatewayStatus: rawStatusVal,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        notes:
          params.notes ||
          `Cobro automático de suscripción al plan ${effectivePlanName} vía ${providerName}`,
      },
    });

    // Create Notification for Payment & Upgrade
    if (params.userId) {
      await createLocalizedNotification({
        userId: params.userId,
        type: "PAYMENT_SUCCESS",
        data: {
          amount: effectivePrice.toFixed(2),
          provider: providerName,
          plan: effectivePlanName,
        },
      });
    }

    return { success: true, data: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al cambiar el plan.";
    return { success: false, error: msg };
  }
}

export async function cancelScheduledBrandDowngradeAction(params: {
  userId: string;
  brandId: string;
}): Promise<ApiResponse<boolean>> {
  try {
    const activeSub = await prisma.subscription.findFirst({
      where: { brandId: params.brandId, status: "ACTIVE", cancelAtPeriodEnd: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSub) {
      return { success: false, error: "No hay un cambio de plan programado para cancelar." };
    }

    const previousScheduled = activeSub.scheduledPlanName;

    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: {
        scheduledPlanName: null,
        cancelAtPeriodEnd: false,
      },
    });

    // Create Notification for User
    if (params.userId) {
      await createLocalizedNotification({
        userId: params.userId,
        type: "PLAN_DOWNGRADE_CANCELED",
        data: {
          previousPlan: previousScheduled || "",
          plan: activeSub.planName,
        },
      });
    }

    return {
      success: true,
      data: true,
      message: `Se ha cancelado la reducción programada. Continuarás en el plan ${activeSub.planName}.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al cancelar el cambio de plan.";
    return { success: false, error: msg };
  }
}

export async function getUserSubscription(
  userId: string
): Promise<ApiResponse<Subscription | null>> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: sub };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch subscription.";
    return { success: false, error: message };
  }
}

export async function createSubscription(
  data: SubscriptionInput
): Promise<ApiResponse<Subscription>> {
  try {
    const parsed = subscriptionSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const {
      userId,
      planName,
      status,
      billingCycle,
      startDate,
      endDate,
      price,
      discount,
      finalPrice,
      timezone,
    } = parsed.data;

    const utcStart = toUtcDate(startDate, timezone);
    const utcEnd = toUtcDate(endDate, timezone);

    if (!utcStart || !utcEnd) {
      return {
        success: false,
        error: "Las fechas de inicio y fin deben ser válidas.",
      };
    }

    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { brandId: true },
    });

    if (!userObj?.brandId) {
      return {
        success: false,
        error: "El usuario debe pertenecer a una marca/empresa.",
      };
    }

    const subscription = await prisma.subscription.create({
      data: {
        brandId: userObj.brandId,
        userId,
        planName,
        status,
        billingCycle,
        startDate: utcStart,
        endDate: utcEnd,
        price,
        discount,
        finalPrice,
      },
    });

    prisma.user
      .findUnique({ where: { id: userId }, select: { brandId: true } })
      .then((u) => {
        triggerOutboundWebhook(u?.brandId ?? null, "subscription.created", {
          subscriptionId: subscription.id,
          userId,
          planName,
          finalPrice,
        }).catch(() => {});
      })
      .catch(() => {});

    return {
      success: true,
      data: subscription,
      message: "Suscripción creada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al crear la suscripción.";
    return { success: false, error: message };
  }
}

export async function updateSubscription(
  id: string,
  data: Partial<SubscriptionInput>
): Promise<ApiResponse<Subscription>> {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Suscripción no encontrada." };
    }

    const timezone = data.timezone ?? "UTC";
    const updateData: Record<string, unknown> = {};

    if (data.planName) updateData.planName = data.planName;
    if (data.status) updateData.status = data.status;
    if (data.billingCycle) updateData.billingCycle = data.billingCycle;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discount !== undefined) updateData.discount = data.discount;
    if (data.finalPrice !== undefined) updateData.finalPrice = data.finalPrice;

    if (data.startDate) {
      const utcStart = toUtcDate(data.startDate, timezone);
      if (!utcStart) {
        return { success: false, error: "Fecha de inicio inválida." };
      }
      updateData.startDate = utcStart;
    }

    if (data.endDate) {
      const utcEnd = toUtcDate(data.endDate, timezone);
      if (!utcEnd) {
        return { success: false, error: "Fecha de fin inválida." };
      }
      updateData.endDate = utcEnd;
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      data: updated,
      message: "Suscripción actualizada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar la suscripción.";
    return { success: false, error: message };
  }
}

export async function createPayment(
  data: PaymentInput
): Promise<ApiResponse<Payment>> {
  try {
    const parsed = paymentSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const {
      userId,
      amount,
      discountApplied,
      paymentDate,
      status,
      billingPeriodStart,
      billingPeriodEnd,
      notes,
      timezone,
    } = parsed.data;

    const utcPaymentDate = toUtcDate(paymentDate, timezone);
    const utcPeriodStart = toUtcDate(billingPeriodStart, timezone);
    const utcPeriodEnd = toUtcDate(billingPeriodEnd, timezone);

    if (!utcPaymentDate || !utcPeriodStart || !utcPeriodEnd) {
      return {
        success: false,
        error: "Las fechas de pago y período deben ser válidas.",
      };
    }

    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { brandId: true },
    });

    if (!userObj?.brandId) {
      return {
        success: false,
        error: "El usuario debe pertenecer a una marca/empresa.",
      };
    }

    const payment = await prisma.payment.create({
      data: {
        brandId: userObj.brandId,
        userId,
        amount,
        discountApplied,
        paymentDate: utcPaymentDate,
        status,
        billingPeriodStart: utcPeriodStart,
        billingPeriodEnd: utcPeriodEnd,
        notes: notes ?? null,
      },
    });

    prisma.user
      .findUnique({ where: { id: userId }, select: { brandId: true } })
      .then((u) => {
        triggerOutboundWebhook(u?.brandId ?? null, "payment.success", {
          paymentId: payment.id,
          userId,
          amount,
          status,
        }).catch(() => {});
      })
      .catch(() => {});

    return {
      success: true,
      data: payment,
      message: "Pago registrado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al registrar el pago.";
    return { success: false, error: message };
  }
}

export async function createCheckoutSession(data: {
  userId: string;
  userEmail: string;
  planName: string;
  price: number;
  billingCycle: "MONTHLY" | "YEARLY";
  successUrl: string;
  cancelUrl: string;
}): Promise<ApiResponse<{ sessionId: string; checkoutUrl: string }>> {
  try {
    const provider = getPaymentProvider();
    const result = await provider.createCheckoutSession(data);

    return {
      success: true,
      data: result,
      message: `Sesión de checkout generada con ${provider.name}.`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al generar sesión de checkout.";
    return { success: false, error: message };
  }
}

export async function getExchangeRates(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{ rates: ExchangeRate[]; total: number; totalPages: number }>
> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error:
          "El cliente Prisma Client no incluye el modelo ExchangeRate. " +
          "Ejecuta 'make db-generate' y reinicia el contenedor app.",
      };
    }

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, rawRates] = await Promise.all([
      prisma.exchangeRate.count({ where }),
      prisma.exchangeRate.findMany({
        where,
        orderBy: { code: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const rates: ExchangeRate[] = rawRates.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      symbol: r.symbol,
      rateAgainstUsd: r.rateAgainstUsd,
      isDefault: r.isDefault,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return {
      success: true,
      data: {
        rates,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener tipos de cambio.";
    return { success: false, error: message };
  }
}

export async function createExchangeRate(
  data: ExchangeRateInput
): Promise<ApiResponse<ExchangeRate>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const parsed = exchangeRateSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { code } = parsed.data;
    const existing = await prisma.exchangeRate.findUnique({
      where: { code },
    });

    if (existing) {
      return { success: false, error: `La divisa ${code} ya existe.` };
    }

    const created = await prisma.exchangeRate.create({
      data: parsed.data,
    });

    return {
      success: true,
      data: created,
      message: "Tipo de cambio creado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create exchange rate.";
    return { success: false, error: message };
  }
}

export async function updateExchangeRate(
  id: string,
  data: ExchangeRateInput
): Promise<ApiResponse<ExchangeRate>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const parsed = exchangeRateSchema.safeParse(data);
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const updated = await prisma.exchangeRate.update({
      where: { id },
      data: parsed.data,
    });

    return {
      success: true,
      data: updated,
      message: "Tipo de cambio actualizado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update exchange rate.";
    return { success: false, error: message };
  }
}

export async function deleteExchangeRate(
  id: string
): Promise<ApiResponse<null>> {
  try {
    const prismaAny = prisma as unknown as Record<string, unknown>;
    if (!prismaAny.exchangeRate) {
      return {
        success: false,
        error: "El modelo ExchangeRate no está disponible en Prisma Client.",
      };
    }

    const existing = await prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Divisa no encontrada." };
    }

    if (existing.code === "USD") {
      return {
        success: false,
        error: "La divisa base del sistema (USD) no se puede eliminar.",
      };
    }

    await prisma.exchangeRate.delete({ where: { id } });
    return {
      success: true,
      data: null,
      message: "Tipo de cambio eliminado exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete exchange rate.";
    return { success: false, error: message };
  }
}


"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { triggerOutboundWebhook } from "@/lib/webhook";
import { slugify } from "@/lib/slug";
import {
  validateSlugSchema,
  customerCheckoutSchema,
  createBrandPlanSchema,
} from "@/lib/validations/brand-portal";
import type {
  ApiResponse,
  BrandPortalData,
  BrandCustomerPayment,
  BrandPlanConfig,
  BrandPaymentStats,
  PaginatedResult,
} from "@/types";

export async function checkBrandSlugAvailabilityAction(
  slug: string,
  currentBrandId?: string
): Promise<ApiResponse<{ available: boolean; suggestedSlug: string }>> {
  try {
    const formattedSlug = slugify(slug);
    const validation = validateSlugSchema.safeParse({ slug: formattedSlug });

    if (!validation.success) {
      const msg = validation.error.issues[0]?.message || "Slug no válido.";
      return { success: false, error: msg };
    }

    const existing = await prisma.brand.findFirst({
      where: {
        slug: formattedSlug,
        id: currentBrandId ? { not: currentBrandId } : undefined,
      },
    });

    if (existing) {
      return {
        success: true,
        data: {
          available: false,
          suggestedSlug: `${formattedSlug}-1`,
        },
      };
    }

    return {
      success: true,
      data: {
        available: true,
        suggestedSlug: formattedSlug,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al validar slug.";
    return { success: false, error: msg };
  }
}

export async function updateBrandSlugAction(
  brandId: string,
  slug: string
): Promise<ApiResponse<{ slug: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const formattedSlug = slugify(slug);
    const validation = validateSlugSchema.safeParse({ slug: formattedSlug });

    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Slug no válido.";
      return { success: false, error: issue };
    }

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return { success: false, error: "Marca no encontrada." };
    }

    if (brand.isSlugLocked && brand.slug !== formattedSlug) {
      return {
        success: false,
        error: "El identificador (slug) ya fue confirmado anteriormente y no se puede modificar.",
      };
    }

    const collision = await prisma.brand.findFirst({
      where: {
        slug: formattedSlug,
        id: { not: brandId },
      },
    });

    if (collision) {
      return {
        success: false,
        error: `El slug '${formattedSlug}' ya está registrado por otra marca.`,
      };
    }

    const updated = await prisma.brand.update({
      where: { id: brandId },
      data: {
        slug: formattedSlug,
        isSlugLocked: true,
      },
    });

    return {
      success: true,
      data: { slug: updated.slug || formattedSlug },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar el slug.";
    return { success: false, error: msg };
  }
}

export async function getPublicBrandPortalAction(
  slugOrId: string
): Promise<ApiResponse<BrandPortalData>> {
  try {
    const brand = await prisma.brand.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        brandPlans: {
          where: { isActive: true },
          orderBy: { priceMonthly: "asc" },
        },
        paymentConfigs: {
          where: { isActive: true },
          select: { gatewayType: true, publicKey: true },
        },
      },
    });

    if (!brand) {
      return { success: false, error: "Marca no encontrada." };
    }

    const data: BrandPortalData = {
      id: brand.id,
      name: brand.name,
      slug: brand.slug || slugify(brand.name),
      logoUrl: brand.logoUrl,
      description: brand.description,
      currency: brand.currency || "MXN",
      defaultLocale: brand.defaultLocale || "es",
      timezone: brand.timezone || "UTC",
      isSlugLocked: brand.isSlugLocked,
      plans: brand.brandPlans.map((p) => ({
        id: p.id,
        brandId: p.brandId,
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        currency: p.currency,
        isActive: p.isActive,
      })),
      activeGateways: brand.paymentConfigs.map((g) => ({
        gatewayType: g.gatewayType,
        publicKey: g.publicKey,
      })),
    };

    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al cargar portal de marca.";
    return { success: false, error: msg };
  }
}

export async function executeCustomerCheckoutAction(
  data: unknown
): Promise<ApiResponse<BrandCustomerPayment>> {
  try {
    const validation = customerCheckoutSchema.safeParse(data);
    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Datos no válidos.";
      return { success: false, error: issue };
    }

    const {
      brandId,
      brandPlanId,
      customerName,
      customerEmail,
      concept,
      amount,
      currency,
      gatewayProvider,
    } = validation.data;

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return { success: false, error: "Marca no encontrada." };
    }

    const transactionRef = `TRX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const createdPayment = await prisma.brandCustomerPayment.create({
      data: {
        brandId,
        brandPlanId: brandPlanId || null,
        customerName,
        customerEmail,
        concept,
        amount,
        currency,
        status: "SUCCESS",
        gatewayProvider: gatewayProvider.toUpperCase(),
        transactionRef,
        notes: `Pago exitoso procesado por pasarela ${gatewayProvider.toUpperCase()}`,
      },
    });

    // Trigger async outbound brand webhook to n8n / CRM / external brand endpoint
    triggerOutboundWebhook(brandId, "payment.customer_paid", {
      paymentId: createdPayment.id,
      customerName,
      customerEmail,
      concept,
      amount,
      currency,
      gatewayProvider,
      transactionRef,
      paidAt: createdPayment.createdAt.toISOString(),
    }).catch(() => {});

    return {
      success: true,
      data: {
        id: createdPayment.id,
        brandId: createdPayment.brandId,
        brandPlanId: createdPayment.brandPlanId,
        customerName: createdPayment.customerName,
        customerEmail: createdPayment.customerEmail,
        concept: createdPayment.concept,
        amount: createdPayment.amount,
        currency: createdPayment.currency,
        status: createdPayment.status,
        gatewayProvider: createdPayment.gatewayProvider,
        transactionRef: createdPayment.transactionRef,
        createdAt: createdPayment.createdAt.toISOString(),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al procesar el pago.";
    return { success: false, error: msg };
  }
}

export async function manageBrandPlanAction(
  data: unknown
): Promise<ApiResponse<BrandPlanConfig>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const validation = createBrandPlanSchema.safeParse(data);
    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Datos del plan no válidos.";
      return { success: false, error: issue };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { brandId: true },
    });

    if (!user?.brandId) {
      return { success: false, error: "No tienes una marca asociada." };
    }

    const { id, name, description, priceMonthly, priceYearly, currency, isActive } =
      validation.data;

    let savedPlan;

    if (id) {
      savedPlan = await prisma.brandPlanConfig.update({
        where: { id },
        data: {
          name,
          description: description || null,
          priceMonthly,
          priceYearly,
          currency,
          isActive,
        },
      });
    } else {
      const currentCount = await prisma.brandPlanConfig.count({
        where: { brandId: user.brandId },
      });

      if (currentCount >= 10) {
        return {
          success: false,
          error: "Has alcanzado el límite máximo de 10 membresías activas para tu marca.",
        };
      }

      savedPlan = await prisma.brandPlanConfig.create({
        data: {
          brandId: user.brandId,
          name,
          description: description || null,
          priceMonthly,
          priceYearly,
          currency,
          isActive,
        },
      });
    }

    return {
      success: true,
      data: {
        id: savedPlan.id,
        brandId: savedPlan.brandId,
        name: savedPlan.name,
        description: savedPlan.description,
        priceMonthly: savedPlan.priceMonthly,
        priceYearly: savedPlan.priceYearly,
        currency: savedPlan.currency,
        isActive: savedPlan.isActive,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al guardar plan de marca.";
    return { success: false, error: msg };
  }
}

export async function deleteBrandPlanAction(
  planId: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { brandId: true },
    });

    if (!user?.brandId) {
      return { success: false, error: "No cuentas con una marca asociada." };
    }

    const plan = await prisma.brandPlanConfig.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.brandId !== user.brandId) {
      return { success: false, error: "Membresía no encontrada." };
    }

    await prisma.brandPlanConfig.delete({
      where: { id: planId },
    });

    return { success: true, data: { id: planId } };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al eliminar membresía.";
    return { success: false, error: msg };
  }
}

export async function getBrandAdminPaymentsAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<
  ApiResponse<{
    payments: PaginatedResult<BrandCustomerPayment>;
    stats: BrandPaymentStats;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { brand: true },
    });

    if (!user?.brandId) {
      return { success: false, error: "No cuentas con una marca asignada." };
    }

    const brandId = user.brandId;
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const where: {
      brandId: string;
      status?: string;
      OR?: Array<{
        customerName?: { contains: string; mode: "insensitive" };
        customerEmail?: { contains: string; mode: "insensitive" };
        concept?: { contains: string; mode: "insensitive" };
      }>;
    } = { brandId };

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { concept: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, rawPayments, activeGatewaysCount, successAgg] = await Promise.all([
      prisma.brandCustomerPayment.count({ where }),
      prisma.brandCustomerPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.brandPaymentConfig.count({
        where: { brandId, isActive: true },
      }),
      prisma.brandCustomerPayment.aggregate({
        where: { brandId, status: "SUCCESS" },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const pendingCount = await prisma.brandCustomerPayment.count({
      where: { brandId, status: "PENDING" },
    });

    const totalPages = Math.ceil(total / limit) || 1;

    const payments: PaginatedResult<BrandCustomerPayment> = {
      items: rawPayments.map((p) => ({
        id: p.id,
        brandId: p.brandId,
        brandPlanId: p.brandPlanId,
        customerName: p.customerName,
        customerEmail: p.customerEmail,
        concept: p.concept,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        gatewayProvider: p.gatewayProvider,
        transactionRef: p.transactionRef,
        checkoutUrl: p.checkoutUrl,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    };

    const stats: BrandPaymentStats = {
      totalRevenue: successAgg._sum.amount || 0,
      successfulTransactions: successAgg._count.id || 0,
      pendingTransactions: pendingCount,
      activeGatewaysCount,
      currency: user.brand?.currency || "MXN",
    };

    return {
      success: true,
      data: { payments, stats },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener cobros.";
    return { success: false, error: msg };
  }
}

export async function getCustomerMemberDataAction(): Promise<
  ApiResponse<{
    plans: BrandPlanConfig[];
    gateways: { provider: string; isActive: boolean }[];
    history: BrandCustomerPayment[];
    currency: string;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { brand: true },
    });

    const brandId = user?.brandId || "brand-general";

    const [plans, rawGateways, rawHistory] = await Promise.all([
      prisma.brandPlanConfig.findMany({
        where: { brandId, isActive: true },
        orderBy: { priceMonthly: "asc" },
      }),
      prisma.brandPaymentConfig.findMany({
        where: { brandId, isActive: true },
        select: { gatewayType: true, isActive: true },
      }),
      prisma.brandCustomerPayment.findMany({
        where: {
          brandId,
          customerEmail: session.user.email,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      success: true,
      data: {
        plans: plans.map((p) => ({
          id: p.id,
          brandId: p.brandId,
          name: p.name,
          description: p.description,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          currency: p.currency,
          isActive: p.isActive,
        })),
        gateways: rawGateways.map((g) => ({
          provider: g.gatewayType,
          isActive: g.isActive,
        })),
        history: rawHistory.map((h) => ({
          id: h.id,
          brandId: h.brandId,
          brandPlanId: h.brandPlanId,
          customerName: h.customerName,
          customerEmail: h.customerEmail,
          concept: h.concept,
          amount: h.amount,
          currency: h.currency,
          status: h.status,
          gatewayProvider: h.gatewayProvider,
          transactionRef: h.transactionRef,
          checkoutUrl: h.checkoutUrl,
          notes: h.notes,
          createdAt: h.createdAt.toISOString(),
        })),
        currency: user?.brand?.currency || "MXN",
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener datos de membresía.";
    return { success: false, error: msg };
  }
}

"use server";

import { parseBrowser, parseDevice } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  createBrandSchema,
  updateBrandSchema,
} from "@/lib/validations/brand";
import type { ApiResponse, Brand } from "@/types";

export interface AdminMetrics {
  totalUsers: number;
  totalBrands: number;
  activeSubscriptions: number;
  brandSubscription?: {
    planName: string;
    status: string;
    endDate: Date | null;
  } | null;
  recentLogins: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    ip: string | null;
    browser: string | null;
    device: string | null;
    createdAt: Date;
  }[];
  loginsTotal: number;
  loginsTotalPages: number;
  brands: Brand[];
  brandsTotal: number;
  brandsTotalPages: number;
}

export async function getAdminMetrics(params?: {
  brandsPage?: number;
  loginsPage?: number;
  brandId?: string;
  userId?: string;
}): Promise<ApiResponse<AdminMetrics>> {
  try {
    const brandsPage = Math.max(1, params?.brandsPage ?? 1);
    const loginsPage = Math.max(1, params?.loginsPage ?? 1);
    const limit = 5;
    const brandId = params?.brandId;
    const userId = params?.userId;

    const userWhere = brandId ? { brandId } : {};
    const loginWhere: Record<string, unknown> = {};
    if (userId) {
      loginWhere.userId = userId;
    } else if (brandId) {
      loginWhere.user = { brandId };
    }

    const [
      totalUsers,
      totalBrands,
      activeSubscriptions,
      loginsTotal,
      recentLoginsRaw,
      brands,
      activeSub,
    ] = await Promise.all([
      prisma.user.count({ where: userWhere }),
      prisma.brand.count(),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          ...(brandId && { user: { brandId } }),
        },
      }),
      prisma.loginHistory.count({ where: loginWhere }),
      prisma.loginHistory.findMany({
        where: loginWhere,
        take: limit,
        skip: (loginsPage - 1) * limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.brand.findMany({
        take: limit,
        skip: (brandsPage - 1) * limit,
        orderBy: { createdAt: "desc" },
      }),
      brandId
        ? prisma.subscription.findFirst({
            where: {
              status: "ACTIVE",
              user: { brandId },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(null),
    ]);

    const brandSubscription = activeSub
      ? {
          planName: activeSub.planName,
          status: activeSub.status,
          endDate: activeSub.endDate,
        }
      : null;

    const recentLogins = recentLoginsRaw.map((log) => {
      const detectedBrowser =
        log.browser ??
        (log.userAgent ? parseBrowser(log.userAgent) : "Navegador Web");
      const detectedDevice =
        log.device ??
        (log.userAgent ? parseDevice(log.userAgent) : "Escritorio");

      let cleanIp = log.ip ?? "127.0.0.1";
      if (cleanIp.includes(",")) {
        cleanIp = cleanIp.split(",")[0].trim();
      }
      if (cleanIp.startsWith("::ffff:")) {
        cleanIp = cleanIp.substring(7);
      }
      if (cleanIp === "::1") {
        cleanIp = "127.0.0.1";
      }

      return {
        id: log.id,
        userId: log.userId,
        userName: log.user.name ?? "Sin Nombre",
        userEmail: log.user.email,
        ip: cleanIp,
        browser: detectedBrowser,
        device: detectedDevice,
        createdAt: log.createdAt,
      };
    });

    return {
      success: true,
      data: {
        totalUsers,
        totalBrands,
        activeSubscriptions,
        brandSubscription,
        recentLogins,
        loginsTotal,
        loginsTotalPages: Math.ceil(loginsTotal / limit),
        brands,
        brandsTotal: totalBrands,
        brandsTotalPages: Math.ceil(totalBrands / limit),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch admin metrics.";
    return { success: false, error: message };
  }
}

export async function getBrandById(
  brandId: string
): Promise<ApiResponse<Brand>> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return { success: false, error: "Brand not found." };
    }

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brand.";
    return { success: false, error: message };
  }
}

export async function createBrand(data: {
  name: string;
  description?: string;
  logoUrl?: string;
  defaultLocale?: string;
  timezone?: string;
}): Promise<ApiResponse<Brand>> {
  try {
    const parsed = createBrandSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const validData = parsed.data;
    const brand = await prisma.brand.create({
      data: {
        name: validData.name,
        description: validData.description,
        logoUrl: validData.logoUrl,
        defaultLocale: validData.defaultLocale,
        timezone: validData.timezone,
      },
    });

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create brand.";
    return { success: false, error: message };
  }
}

export async function updateBrandSettings(
  brandId: string,
  data: {
    name?: string;
    description?: string;
    logoUrl?: string;
    defaultLocale?: string;
    timezone?: string;
  }
): Promise<ApiResponse<Brand>> {
  try {
    const parsed = updateBrandSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const validData = parsed.data;
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(validData.name && { name: validData.name }),
        ...(validData.description !== undefined && {
          description: validData.description,
        }),
        ...(validData.logoUrl !== undefined && {
          logoUrl: validData.logoUrl,
        }),
        ...(validData.defaultLocale && {
          defaultLocale: validData.defaultLocale,
        }),
        ...(validData.timezone && { timezone: validData.timezone }),
      },
    });

    return { success: true, data: brand };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update brand settings.";
    return { success: false, error: message };
  }
}

export async function getBrandsList(): Promise<
  ApiResponse<{ id: string; name: string; currency?: string }[]>
> {
  try {
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: brands };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brands list.";
    return { success: false, error: message };
  }
}

export interface BrandWithUsersCount extends Brand {
  usersCount: number;
  subscription?: {
    id?: string;
    planName: string;
    status: string;
    billingCycle: string;
    price: number;
    discount: number;
    finalPrice: number;
    startDate: Date | string;
    endDate: Date | string;
  } | null;
}

export async function getBrandsCatalog(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<
  ApiResponse<{
    brands: BrandWithUsersCount[];
    total: number;
    totalPages: number;
  }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, rawBrands] = await Promise.all([
      prisma.brand.count({ where }),
      prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { users: true },
          },
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    const brands: BrandWithUsersCount[] = rawBrands.map((b) => {
      const activeSub = b.subscriptions[0] ?? null;

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        logoUrl: b.logoUrl,
        defaultLocale: b.defaultLocale,
        timezone: b.timezone,
        currency: b.currency,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        usersCount: b._count.users,
        subscription: activeSub
          ? {
              id: activeSub.id,
              planName: activeSub.planName,
              status: activeSub.status,
              billingCycle: activeSub.billingCycle,
              price: activeSub.price,
              discount: activeSub.discount,
              finalPrice: activeSub.finalPrice,
              startDate: activeSub.startDate.toISOString(),
              endDate: activeSub.endDate.toISOString(),
            }
          : null,
      };
    });

    return {
      success: true,
      data: {
        brands,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch brands catalog.";
    return { success: false, error: message };
  }
}

export async function createBrandWithSubscriptionAction(data: {
  name: string;
  description?: string;
  currency?: string;
  planName?: string;
  billingCycle?: string;
  price?: number;
  discount?: number;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<Brand>> {
  try {
    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        description: data.description,
        currency: data.currency || "USD",
      },
    });

    if (data.planName) {
      const price = data.price ?? 0;
      const discount = data.discount ?? 0;
      const finalPrice = Math.max(0, price * (1 - discount / 100));

      await prisma.subscription.create({
        data: {
          brandId: brand.id,
          planName: data.planName,
          status: "ACTIVE",
          billingCycle: data.billingCycle || "MONTHLY",
          price,
          discount,
          finalPrice,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate
            ? new Date(data.endDate)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { success: true, data: brand };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error creating brand.";
    return { success: false, error: msg };
  }
}

export async function updateBrandWithSubscriptionAction(
  brandId: string,
  data: {
    name?: string;
    description?: string;
    currency?: string;
    planName?: string;
    billingCycle?: string;
    price?: number;
    discount?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<Brand>> {
  try {
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.currency && { currency: data.currency }),
      },
    });

    if (data.planName) {
      const price = data.price ?? 0;
      const discount = data.discount ?? 0;
      const finalPrice = Math.max(0, price * (1 - discount / 100));

      // Deactivate all prior active subscriptions for this brand
      await prisma.subscription.updateMany({
        where: { brandId, status: "ACTIVE" },
        data: { status: "CANCELED" },
      });

      // Create new active subscription directly for the brand
      await prisma.subscription.create({
        data: {
          brandId,
          planName: data.planName,
          status: "ACTIVE",
          billingCycle: data.billingCycle || "MONTHLY",
          price,
          discount,
          finalPrice,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate
            ? new Date(data.endDate)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return { success: true, data: brand };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error updating brand.";
    return { success: false, error: msg };
  }
}

export async function getBrandPaymentsHistoryAction(brandId: string): Promise<
  ApiResponse<{
    subscription: {
      planName: string;
      status: string;
      billingCycle: string;
      price: number;
      discount: number;
      finalPrice: number;
      startDate: string;
      endDate: string;
    } | null;
    payments: Array<{
      id: string;
      amount: number;
      discountApplied: number;
      paymentDate: string;
      status: string;
      gatewayProvider: string | null;
      notes: string | null;
      billingPeriodStart: string;
      billingPeriodEnd: string;
    }>;
  }>
> {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 20,
        },
      },
    });

    if (!brand) {
      return {
        success: true,
        data: { subscription: null, payments: [] },
      };
    }

    const activeSub = brand.subscriptions[0] ?? null;

    return {
      success: true,
      data: {
        subscription: activeSub
          ? {
              planName: activeSub.planName,
              status: activeSub.status,
              billingCycle: activeSub.billingCycle,
              price: activeSub.price,
              discount: activeSub.discount,
              finalPrice: activeSub.finalPrice,
              startDate: activeSub.startDate.toISOString(),
              endDate: activeSub.endDate.toISOString(),
            }
          : null,
        payments: brand.payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          discountApplied: p.discountApplied,
          paymentDate: p.paymentDate.toISOString(),
          status: p.status,
          gatewayProvider: p.gatewayProvider || "EFECTIVO",
          notes: p.notes,
          billingPeriodStart: p.billingPeriodStart.toISOString(),
          billingPeriodEnd: p.billingPeriodEnd.toISOString(),
        })),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error fetching payments history.";
    return { success: false, error: msg };
  }
}

export async function addManualBrandPaymentAction(params: {
  brandId: string;
  amount: number;
  discountApplied?: number;
  status?: string;
  gatewayProvider?: string;
  paymentDate?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
}): Promise<ApiResponse<boolean>> {
  try {
    const paymentDate = params.paymentDate ? new Date(params.paymentDate) : new Date();
    const periodStart = params.billingPeriodStart
      ? new Date(params.billingPeriodStart)
      : new Date();
    const periodEnd = params.billingPeriodEnd
      ? new Date(params.billingPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.payment.create({
      data: {
        brandId: params.brandId,
        amount: params.amount,
        discountApplied: params.discountApplied ?? 0,
        paymentDate,
        status: params.status || "SUCCESS",
        gatewayProvider: params.gatewayProvider || "EFECTIVO",
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        notes: params.notes || null,
      },
    });

    // Update active subscription period end date
    const activeSub = await prisma.subscription.findFirst({
      where: { brandId: params.brandId, status: "ACTIVE" },
    });

    if (activeSub) {
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { endDate: periodEnd },
      });
    }

    return { success: true, data: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error adding manual payment.";
    return { success: false, error: msg };
  }
}

export async function getBrandPaginatedPaymentsAction(params: {
  brandId: string;
  page?: number;
  limit?: number;
}): Promise<
  ApiResponse<{
    payments: Array<{
      id: string;
      amount: number;
      discountApplied: number;
      paymentDate: string;
      status: string;
      gatewayProvider: string | null;
      trackingId: string | null;
      rawGatewayStatus: string | null;
      notes: string | null;
      billingPeriodStart: string;
      billingPeriodEnd: string;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  try {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, Math.min(50, params.limit ?? 10));
    const skip = (page - 1) * limit;

    const [total, rawPayments] = await Promise.all([
      prisma.payment.count({ where: { brandId: params.brandId } }),
      prisma.payment.findMany({
        where: { brandId: params.brandId },
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
      }),
    ]);

    const payments = rawPayments.map((p) => ({
      id: p.id,
      amount: p.amount,
      discountApplied: p.discountApplied,
      paymentDate: p.paymentDate.toISOString(),
      status: p.status,
      gatewayProvider: p.gatewayProvider ?? "MOCK",
      trackingId: p.trackingId ?? null,
      rawGatewayStatus: p.rawGatewayStatus ?? "APPROVED",
      notes: p.notes,
      billingPeriodStart: p.billingPeriodStart.toISOString(),
      billingPeriodEnd: p.billingPeriodEnd.toISOString(),
    }));

    return {
      success: true,
      data: {
        payments,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error fetching brand payments.";
    return { success: false, error: msg };
  }
}

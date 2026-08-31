"use server";

import type { PaymentGatewayType as PrismaPaymentGatewayType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PaymentGatewayFactory } from "@/lib/payment/factory";
import type {
  CheckoutSessionInput,
  CheckoutSessionOutput,
  PaymentGatewayType,
  ApiResponse,
} from "@/types";
import { encryptSecret } from "@/lib/crypto";

export interface PaymentTransactionItem {
  id: string;
  ownerType: string;
  ownerId: string;
  brandId: string | null;
  brandName?: string | null;
  gatewayType: PaymentGatewayType;
  externalId: string | null;
  checkoutUrl: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentEngineMetrics {
  totalVolume: number;
  totalTransactions: number;
  completedCount: number;
  pendingCount: number;
  activeGatewaysCount: number;
}

export interface BrandPaymentConfigItem {
  id: string;
  brandId: string;
  brandName: string;
  gatewayType: PaymentGatewayType;
  publicKey: string;
  publicKeyPreview: string;
  isActive: boolean;
  hasCredentials: boolean;
  updatedAt: Date | string;
}

export interface SaaSGatewayStatusItem {
  provider: PaymentGatewayType;
  name: string;
  isConfigured: boolean;
  publicKeyPreview?: string;
  secretKeySet: boolean;
  webhookSecretSet: boolean;
}

function maskPublicKey(key: string): string {
  if (!key || key === "ENABLED_BY_SUPERADMIN") return "Pendiente por Marca";
  if (key.length <= 10) return `${key.slice(0, 4)}••••`;
  return `${key.slice(0, 8)}••••${key.slice(-4)}`;
}

export async function getSaaSPlatformPaymentStatusAction(): Promise<
  ApiResponse<SaaSGatewayStatusItem[]>
> {
  try {

    const clipPub = process.env.CLIP_PUBLIC_KEY || "";
    const clipSec = process.env.CLIP_SECRET_KEY || "";
    const clipWh = process.env.CLIP_WEBHOOK_SECRET || "";

    const stripePub = process.env.STRIPE_PUBLIC_KEY || "";
    const stripeSec = process.env.STRIPE_SECRET_KEY || "";
    const stripeWh = process.env.STRIPE_WEBHOOK_SECRET || "";

    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    const mpWh = process.env.MERCADOPAGO_WEBHOOK_SECRET || "";

    const pseSec = process.env.PSE_SECRET_KEY || "";
    const pseWh = process.env.PSE_WEBHOOK_SECRET || "";

    const statusList: SaaSGatewayStatusItem[] = [
      {
        provider: "MOCK",
        name: "Proveedor Simulado (Pruebas Locales)",
        isConfigured: true,
        publicKeyPreview: "SANDBOX_ENV",
        secretKeySet: true,
        webhookSecretSet: true,
      },
      {
        provider: "CLIP",
        name: "Clip (Hosted Checkout)",
        isConfigured: Boolean(clipPub && clipSec),
        publicKeyPreview: clipPub ? maskPublicKey(clipPub) : "NOT_CONFIGURED",
        secretKeySet: Boolean(clipSec),
        webhookSecretSet: Boolean(clipWh),
      },
      {
        provider: "STRIPE",
        name: "Stripe (Global Checkout)",
        isConfigured: Boolean(stripePub && stripeSec),
        publicKeyPreview: stripePub ? maskPublicKey(stripePub) : "NOT_CONFIGURED",
        secretKeySet: Boolean(stripeSec),
        webhookSecretSet: Boolean(stripeWh),
      },
      {
        provider: "MERCADOPAGO",
        name: "MercadoPago (LATAM)",
        isConfigured: Boolean(mpToken),
        publicKeyPreview: mpToken ? maskPublicKey(mpToken) : "NOT_CONFIGURED",
        secretKeySet: Boolean(mpToken),
        webhookSecretSet: Boolean(mpWh),
      },
      {
        provider: "PSE",
        name: "PSE (Débito Bancario)",
        isConfigured: Boolean(pseSec),
        publicKeyPreview: pseSec ? maskPublicKey(pseSec) : "NOT_CONFIGURED",
        secretKeySet: Boolean(pseSec),
        webhookSecretSet: Boolean(pseWh),
      },
    ];

    return { success: true, data: statusList };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error reading SaaS status";
    return { success: false, error: msg };
  }
}

export async function getAvailableSaaSGatewaysAction(): Promise<
  ApiResponse<{ provider: PaymentGatewayType; name: string }[]>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const statusRes = await getSaaSPlatformPaymentStatusAction();
    if (!statusRes.success || !statusRes.data) {
      return { success: false, error: statusRes.error ?? "Failed to read gateway status" };
    }

    // Filter strictly to gateways that have API keys/credentials configured in process.env
    const configuredGateways = statusRes.data
      .filter((g) => g.isConfigured)
      .map((g) => ({
        provider: g.provider,
        name: g.name,
      }));

    return { success: true, data: configuredGateways };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching gateways";
    return { success: false, error: msg };
  }
}

export async function saveBrandPaymentConfigAction(params: {
  brandId: string;
  gatewayType: PaymentGatewayType;
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  isActive?: boolean;
}): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const { brandId, gatewayType, publicKey, secretKey, webhookSecret, isActive } =
      params;

    const encryptedSecretKey = encryptSecret(secretKey.trim());
    const encryptedWebhookSecret = webhookSecret?.trim()
      ? encryptSecret(webhookSecret.trim())
      : null;

    await prisma.brandPaymentConfig.upsert({
      where: {
        brandId_gatewayType: {
          brandId,
          gatewayType: gatewayType as PrismaPaymentGatewayType,
        },
      },
      update: {
        gatewayType: gatewayType as PrismaPaymentGatewayType,
        publicKey: publicKey.trim(),
        encryptedSecretKey,
        webhookSecret: encryptedWebhookSecret,
        isActive: isActive ?? true,
      },
      create: {
        brandId,
        gatewayType: gatewayType as PrismaPaymentGatewayType,
        publicKey: publicKey.trim(),
        encryptedSecretKey,
        webhookSecret: encryptedWebhookSecret,
        isActive: isActive ?? true,
      },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error saving payment config";
    return { success: false, error: msg };
  }
}

export async function toggleBrandPaymentConfigStatusAction(
  configId: string,
  isActive: boolean
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado." };
    }

    await prisma.brandPaymentConfig.update({
      where: { id: configId },
      data: { isActive },
    });

    return { success: true, data: isActive };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cambiar estado de pasarela.";
    return { success: false, error: msg };
  }
}

export async function getBrandPaymentConfigAction(
  brandId: string,
  gatewayType?: PaymentGatewayType
): Promise<
  ApiResponse<{
    gatewayType: PaymentGatewayType;
    publicKey: string;
    isActive: boolean;
  } | null>
> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const config = await prisma.brandPaymentConfig.findFirst({
      where: {
        brandId,
        ...(gatewayType ? { gatewayType: gatewayType as PrismaPaymentGatewayType } : {}),
      },
      select: { gatewayType: true, publicKey: true, isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return { success: true, data: config };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching config";
    return { success: false, error: msg };
  }
}

export async function getBrandPaymentConfigsListAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
}): Promise<
  ApiResponse<{
    configs: BrandPaymentConfigItem[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const searchUpper = search ? search.toUpperCase() : "";
    const isGatewayEnum = [
      "CLIP",
      "STRIPE",
      "MERCADOPAGO",
      "PSE",
      "MOCK",
    ].includes(searchUpper);

    const where = {
      ...(params?.brandId && { brandId: params.brandId }),
      ...(search
        ? {
            OR: [
              { brand: { name: { contains: search, mode: "insensitive" as const } } },
              ...(isGatewayEnum
                ? [
                    {
                      gatewayType: {
                        equals: searchUpper as PrismaPaymentGatewayType,
                      },
                    },
                  ]
                : []),
            ],
          }
        : {}),
    };

    const [total, rawConfigs] = await Promise.all([
      prisma.brandPaymentConfig.count({ where }),
      prisma.brandPaymentConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          brand: {
            select: { name: true },
          },
        },
      }),
    ]);

    const configs: BrandPaymentConfigItem[] = rawConfigs.map((c) => ({
      id: c.id,
      brandId: c.brandId,
      brandName: c.brand?.name ?? "Empresa",
      gatewayType: c.gatewayType,
      publicKey: c.publicKey,
      publicKeyPreview: maskPublicKey(c.publicKey),
      isActive: c.isActive,
      hasCredentials: Boolean(
        c.encryptedSecretKey &&
          c.encryptedSecretKey !== "ENABLED_BY_SUPERADMIN" &&
          c.publicKey !== "ENABLED_BY_SUPERADMIN"
      ),
      updatedAt: c.updatedAt.toISOString(),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      success: true,
      data: { configs, total, page, totalPages },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching configs";
    console.error("[getBrandPaymentConfigsListAction Error]:", msg, error);
    return { success: false, error: msg };
  }
}

export async function deleteBrandPaymentConfigAction(
  configId: string
): Promise<ApiResponse<null>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.brandPaymentConfig.delete({
      where: { id: configId },
    });

    return {
      success: true,
      data: null,
      message: "Configuración de pasarela eliminada correctamente.",
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Error deleting payment config";
    return { success: false, error: msg };
  }
}

export async function createBrandCheckoutSessionAction(
  input: Omit<CheckoutSessionInput, "ownerType"> & {
    gatewayType?: PaymentGatewayType;
  }
): Promise<ApiResponse<CheckoutSessionOutput>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const brandId = input.brandId || input.ownerId;
    const adapter = await PaymentGatewayFactory.getAdapterForBrand(
      brandId,
      input.gatewayType
    );

    const checkoutSession = await adapter.createCheckoutSession({
      ...input,
      ownerType: "BRAND",
      brandId,
    });

    await prisma.paymentTransaction.create({
      data: {
        ownerType: "BRAND",
        ownerId: brandId,
        brandId,
        gatewayType: checkoutSession.gatewayType as PrismaPaymentGatewayType,
        externalId: checkoutSession.sessionId,
        checkoutUrl: checkoutSession.checkoutUrl,
        amount: input.amount,
        currency: input.currency || "MXN",
        status: "PENDING",
        metadata: JSON.stringify(input.metadata || {}),
      },
    });

    return { success: true, data: checkoutSession };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Checkout error";
    return { success: false, error: msg };
  }
}

export async function getPaymentEngineMetricsAction(): Promise<
  ApiResponse<PaymentEngineMetrics>
> {
  try {
    const [
      totalTransactions,
      completedCount,
      pendingCount,
      activeGatewaysCount,
      completedAggregate,
    ] = await Promise.all([
      prisma.paymentTransaction.count(),
      prisma.paymentTransaction.count({ where: { status: "COMPLETED" } }),
      prisma.paymentTransaction.count({ where: { status: "PENDING" } }),
      prisma.brandPaymentConfig.count({ where: { isActive: true } }),
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
    ]);

    const totalVolume = completedAggregate._sum.amount ?? 0;

    return {
      success: true,
      data: {
        totalVolume,
        totalTransactions,
        completedCount,
        pendingCount,
        activeGatewaysCount,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Metrics error";
    return { success: false, error: msg };
  }
}

export async function getPaymentTransactionsAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  provider?: string;
  brandId?: string;
}): Promise<
  ApiResponse<{
    transactions: PaymentTransactionItem[];
    total: number;
    page: number;
    totalPages: number;
  }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.max(1, Math.min(50, params?.limit ?? 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params?.status && params.status !== "ALL") {
      where.status = params.status;
    }

    if (params?.provider && params.provider !== "ALL") {
      where.gatewayType = params.provider;
    }

    if (params?.brandId && params.brandId !== "ALL") {
      where.brandId = params.brandId;
    }

    if (params?.search) {
      const query = params.search.trim();
      where.OR = [
        { externalId: { contains: query, mode: "insensitive" } },
        { ownerId: { contains: query, mode: "insensitive" } },
        { brand: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [total, rawTransactions] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          brand: { select: { name: true } },
        },
      }),
    ]);

    const transactions: PaymentTransactionItem[] = rawTransactions.map((t) => ({
      id: t.id,
      ownerType: t.ownerType,
      ownerId: t.ownerId,
      brandId: t.brandId,
      brandName: t.brand?.name ?? "Global System",
      gatewayType: t.gatewayType,
      externalId: t.externalId,
      checkoutUrl: t.checkoutUrl,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: {
        transactions,
        total,
        page,
        totalPages,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching transactions";
    return { success: false, error: msg };
  }
}

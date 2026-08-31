"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  testWebhookSchema,
  updateBrandWebhooksSchema,
  type TestWebhookInput,
  type UpdateBrandWebhooksInput,
} from "@/lib/validations/webhook";
import { triggerOutboundWebhook } from "@/lib/webhook";
import type { ApiResponse, Brand, WebhookLog } from "@/types";

import { encryptSecret, decryptSecret } from "@/lib/crypto";

export async function getBrandWebhookConfig(
  brandId: string
): Promise<ApiResponse<Brand>> {
  try {
    let brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return { success: false, error: "Marca no encontrada." };
    }

    // Auto-generate API Key if not present
    if (!brand.apiKey) {
      const generatedKey = `mk_${randomBytes(16).toString("hex")}`;
      const encryptedKey = encryptSecret(generatedKey);
      brand = await prisma.brand.update({
        where: { id: brandId },
        data: { apiKey: encryptedKey },
      });
    }

    const decryptedKey = decryptSecret(brand.apiKey ?? "");

    return {
      success: true,
      data: {
        ...brand,
        apiKey: decryptedKey,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener datos de marca.";
    return { success: false, error: message };
  }
}

export async function updateBrandWebhookSettings(
  brandId: string,
  data: UpdateBrandWebhooksInput
): Promise<ApiResponse<Brand>> {
  try {
    const parsed = updateBrandWebhooksSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { billingWebhookUrl, generalWebhookUrl, isWebhookEnabled } = parsed.data;

    const updated = await prisma.brand.update({
      where: { id: brandId },
      data: {
        billingWebhookUrl: billingWebhookUrl || null,
        generalWebhookUrl: generalWebhookUrl || null,
        isWebhookEnabled,
      },
    });

    return {
      success: true,
      data: {
        ...updated,
        apiKey: decryptSecret(updated.apiKey ?? ""),
      },
      message: "Configuración de webhooks actualizada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar webhooks de marca.";
    return { success: false, error: message };
  }
}

export async function regenerateBrandApiKey(
  brandId: string
): Promise<ApiResponse<{ apiKey: string }>> {
  try {
    const newApiKey = `mk_${randomBytes(16).toString("hex")}`;
    const encryptedKey = encryptSecret(newApiKey);
    await prisma.brand.update({
      where: { id: brandId },
      data: { apiKey: encryptedKey },
    });

    return {
      success: true,
      data: { apiKey: newApiKey },
      message: "API Key regenerada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al regenerar API Key.";
    return { success: false, error: message };
  }
}

export async function sendTestWebhook(
  data: TestWebhookInput
): Promise<ApiResponse<{ success: boolean; status?: number | null; message: string }>> {
  try {
    const parsed = testWebhookSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const { brandId, event } = parsed.data;

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        generalWebhookUrl: true,
        billingWebhookUrl: true,
        isWebhookEnabled: true,
      },
    });

    if (!brand) {
      return { success: false, error: "Marca no encontrada." };
    }

    if (!brand.isWebhookEnabled) {
      return {
        success: false,
        error: "Los webhooks de la marca están desactivados. Activa la opción para enviar pruebas.",
      };
    }

    const configuredUrl =
      brand.generalWebhookUrl?.trim() || brand.billingWebhookUrl?.trim();

    if (!configuredUrl) {
      return {
        success: false,
        error: "No se ha configurado ninguna URL de webhook para esta marca. Ingresa una URL y guarda los cambios.",
      };
    }

    const testPayload = {
      testMessage: "Prueba de envío desde el módulo de Integraciones.",
      triggeredAt: new Date().toISOString(),
      sampleData: {
        status: "ACTIVE",
        source: "Dashboard Webhook Tester",
      },
    };

    const res = await triggerOutboundWebhook(
      brandId,
      event,
      testPayload,
      configuredUrl
    );

    if (!res.success) {
      return {
        success: false,
        error: res.errorMessage ?? "El webhook de prueba falló al responder.",
      };
    }

    return {
      success: true,
      data: {
        success: res.success,
        status: res.status,
        message: `Webhook de prueba enviado correctamente (Status HTTP ${res.status}).`,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error inesperado al probar webhook.";
    return { success: false, error: message };
  }
}

export async function getWebhookLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
}): Promise<
  ApiResponse<{
    logs: WebhookLog[];
    total: number;
    totalPages: number;
    successCount: number;
    failCount: number;
    avgDurationMs: number;
  }>
> {
  try {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where: Record<string, unknown> = {};
    if (params?.brandId) {
      where.brandId = params.brandId;
    }
    if (search) {
      where.OR = [
        { event: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, successCount, failCount, avgResult, rawLogs] =
      await Promise.all([
        prisma.webhookLog.count({ where }),
        prisma.webhookLog.count({ where: { ...where, success: true } }),
        prisma.webhookLog.count({ where: { ...where, success: false } }),
        prisma.webhookLog.aggregate({
          where,
          _avg: { durationMs: true },
        }),
        prisma.webhookLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

    const logs: WebhookLog[] = rawLogs.map((l) => ({
      id: l.id,
      brandId: l.brandId,
      event: l.event,
      url: l.url,
      status: l.status,
      success: l.success,
      payload: l.payload,
      response: l.response,
      errorMessage: l.errorMessage,
      durationMs: l.durationMs,
      attempts: l.attempts,
      nextAttemptAt: l.nextAttemptAt,
      createdAt: l.createdAt,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const avgDurationMs = Math.round(avgResult._avg.durationMs ?? 0);

    return {
      success: true,
      data: {
        logs,
        total,
        totalPages,
        successCount,
        failCount,
        avgDurationMs,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener logs de webhooks.";
    return { success: false, error: message };
  }
}

export async function retryWebhookLog(
  logId: string
): Promise<ApiResponse<WebhookLog>> {
  try {
    const existing = await prisma.webhookLog.findUnique({
      where: { id: logId },
    });

    if (!existing) {
      return { success: false, error: "Registro de webhook no encontrado." };
    }

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(existing.payload);
    } catch (_err: unknown) {
      parsedPayload = {};
    }

    const res = await triggerOutboundWebhook(
      existing.brandId,
      existing.event,
      parsedPayload,
      existing.url,
      existing.id
    );

    const updated = await prisma.webhookLog.findUnique({
      where: { id: logId },
    });

    if (!updated) {
      return { success: false, error: "Registro no encontrado tras reintento." };
    }

    return {
      success: res.success,
      data: updated,
      message: res.success
        ? "Reintento de webhook completado exitosamente."
        : `Reintento falló con respuesta HTTP ${res.status ?? "Error"}.`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error inesperado al reintentar webhook.";
    return { success: false, error: message };
  }
}

import { prisma } from "@/lib/prisma";

export interface OutboundWebhookResult {
  success: boolean;
  status: number | null;
  errorMessage: string | null;
  responseBody: string | null;
}

/**
 * Dispara un webhook saliente (outbound) y registra la transacción en WebhookLog.
 * Implementa respaldo exponencial para reintentos automáticos (máximo 5 intentos).
 */
export async function triggerOutboundWebhook(
  brandId: string | null,
  event: string,
  payload: Record<string, unknown>,
  targetUrl?: string,
  existingLogId?: string
): Promise<OutboundWebhookResult> {
  let url = targetUrl;
  let isWebhookEnabled = true;

  // 1. Resolver URL destino
  const isBillingEvent =
    event.startsWith("payment.") || event.startsWith("subscription.");

  if (
    process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS === "false" ||
    process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS === "0"
  ) {
    return {
      success: false,
      status: null,
      errorMessage:
        "Módulo de integraciones y webhooks desactivado en el sistema (.env).",
      responseBody: null,
    };
  }

  if (!url) {
    if (isBillingEvent) {
      // Eventos de pago y suscripción son PROPIOS DEL SAAS (Nivel Plataforma)
      url = process.env.N8N_BILLING_URL?.trim();
    } else if (brandId) {
      // Eventos de marca buscan la URL configurada por la marca
      const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          generalWebhookUrl: true,
          billingWebhookUrl: true,
          isWebhookEnabled: true,
        },
      });

      if (brand) {
        isWebhookEnabled = brand.isWebhookEnabled;
        const brandUrl =
          brand.generalWebhookUrl?.trim() || brand.billingWebhookUrl?.trim();
        if (brandUrl) {
          url = brandUrl;
        }
      }
    }
  }

  // Fallback global de sistema solo si no es evento de marca
  if (!url && !brandId && !isBillingEvent) {
    url = process.env.N8N_URL?.trim();
  }

  // Si los webhooks están deshabilitados o la URL está vacía/sin contenido, omitir
  // ejecución de inmediato
  if (!isWebhookEnabled || !url || url.trim().length === 0) {
    return {
      success: false,
      status: null,
      errorMessage: !isWebhookEnabled
        ? "Webhooks deshabilitados por la marca."
        : "Sin URL de webhook configurada. La ejecución fue omitida.",
      responseBody: null,
    };
  }

  // Validar formato y protocolo HTTP/HTTPS antes de intentar fetch
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false,
        status: null,
        errorMessage: `URL inválida (${url}). Debe incluir el protocolo http:// o https://.`,
        responseBody: null,
      };
    }
  } catch (_urlErr: unknown) {
    return {
      success: false,
      status: null,
      errorMessage: `URL de webhook malformada (${url}). Ingresa una URL completa válida (ej. https://n8n.example.com/webhook).`,
      responseBody: null,
    };
  }

  // 2. Determinar número de intento actual
  let currentAttempt = 1;
  if (existingLogId) {
    const existingLog = await prisma.webhookLog.findUnique({
      where: { id: existingLogId },
    });
    if (existingLog) {
      currentAttempt = existingLog.attempts + 1;
    }
  }

  const startTime = Date.now();
  let status: number | null = null;
  let success = false;
  let responseText: string | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        brandId,
        data: payload,
      }),
    });

    status = response.status;
    success = response.ok;
    responseText = await response.text();

    if (!success) {
      errorMessage = `HTTP ${status}: ${responseText.substring(0, 150)}`;
    }
  } catch (error: unknown) {
    success = false;
    errorMessage =
      error instanceof Error ? error.message : "Fallo de conexión de red";
  }

  const durationMs = Date.now() - startTime;

  // 3. Respaldo exponencial: 1->30s, 2->120s (2m), 3->600s (10m), 4->1800s (30m)
  let nextAttemptAt: Date | null = null;
  if (!success && currentAttempt < 5) {
    const delays = [30, 120, 600, 1800];
    const delaySec = delays[currentAttempt - 1] ?? 1800;
    nextAttemptAt = new Date(Date.now() + delaySec * 1000);
  }

  // 4. Guardar o actualizar registro en la base de datos
  try {
    if (existingLogId) {
      await prisma.webhookLog.update({
        where: { id: existingLogId },
        data: {
          status,
          success,
          response: responseText,
          errorMessage,
          durationMs,
          attempts: currentAttempt,
          nextAttemptAt,
        },
      });
    } else {
      await prisma.webhookLog.create({
        data: {
          brandId,
          event,
          url,
          status,
          success,
          payload: JSON.stringify(payload),
          response: responseText,
          errorMessage,
          durationMs,
          attempts: currentAttempt,
          nextAttemptAt,
        },
      });
    }
  } catch (dbError: unknown) {
    const msg = dbError instanceof Error ? dbError.message : "DB error";
    console.error("Failed to persist WebhookLog:", msg);
  }

  // 5. WP-Cron orgánico: disparar reintentos pendientes en segundo plano
  if (!existingLogId) {
    runOrganicWebhookRetries(brandId).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "Retry error";
      console.error("Organic webhook retry failed:", msg);
    });
  }

  return { success, status, errorMessage, responseBody: responseText };
}

/**
 * Despacha en segundo plano los reintentos que lleven pendientes.
 * Limita a máximo 3 reintentos para no sobrecargar el proceso.
 */
export async function runOrganicWebhookRetries(
  brandId?: string | null
): Promise<void> {
  try {
    const pendingLogs = await prisma.webhookLog.findMany({
      where: {
        ...(brandId ? { brandId } : {}),
        success: false,
        nextAttemptAt: {
          lte: new Date(),
        },
        attempts: {
          lt: 5,
        },
      },
      take: 3,
    });

    for (const log of pendingLogs) {
      let parsedPayload: Record<string, unknown> = {};
      try {
        parsedPayload = JSON.parse(log.payload);
      } catch (_err: unknown) {
        continue;
      }

      await triggerOutboundWebhook(
        log.brandId,
        log.event,
        parsedPayload,
        log.url,
        log.id
      );
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Retry error";
    console.error("Organic background webhook retries failed:", msg);
  }
}

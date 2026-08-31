import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerOutboundWebhook } from "@/lib/webhook";

export async function POST(req: Request) {
  return handleRetryCron(req);
}

export async function GET(req: Request) {
  return handleRetryCron(req);
}

async function handleRetryCron(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const cronSecret =
      process.env.CRON_SECRET ||
      process.env.AUTH_SECRET ||
      "dev_secret_key_change_in_production_123456789";

    if (authHeader && authHeader !== cronSecret) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const now = new Date();
    const pendingLogs = await prisma.webhookLog.findMany({
      where: {
        success: false,
        nextAttemptAt: {
          lte: now,
        },
        attempts: {
          lt: 5,
        },
      },
      take: 15,
    });

    let successCount = 0;
    let failCount = 0;

    for (const log of pendingLogs) {
      let parsedPayload: Record<string, unknown> = {};
      try {
        parsedPayload = JSON.parse(log.payload);
      } catch (_err: unknown) {
        continue;
      }

      const res = await triggerOutboundWebhook(
        log.brandId,
        log.event,
        parsedPayload,
        log.url,
        log.id
      );

      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: pendingLogs.length,
      successCount,
      failCount,
      executedAtUtc: now.toISOString(),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al ejecutar cron.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

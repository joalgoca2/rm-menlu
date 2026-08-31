"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAiMessageSchema } from "@/lib/validations/ai";
import { processAiMessage } from "@/lib/ai/engine";
import type { UserContextForAi } from "@/lib/ai/knowledge";
import type { ApiResponse, AiChatMessage } from "@/types";

export async function sendAiChatMessageAction(
  data: unknown
): Promise<ApiResponse<AiChatMessage>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión." };
    }

    const validation = sendAiMessageSchema.safeParse(data);
    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Datos no válidos.";
      return { success: false, error: issue };
    }

    const { message, history = [] } = validation.data;

    // 1. Hydrate real-time context from PostgreSQL via Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        brand: true,
        roles: { include: { role: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const userRole = user.roles.map((r) => r.role.name).join(", ") || "USER";
    const activeSub = user.subscriptions[0];
    const planName = activeSub?.planName || "Free";

    const planConfig = await prisma.planConfig.findUnique({
      where: { planName },
    });

    const hasAiAgentAccess =
      Boolean((planConfig as unknown as { hasAiAgent?: boolean })?.hasAiAgent) ||
      planName.toLowerCase().includes("pro") ||
      planName.toLowerCase().includes("enterprise");

    const userContext: UserContextForAi = {
      userName: user.name,
      userEmail: user.email,
      userRole,
      brandName: user.brand?.name || null,
      brandCurrency: user.brand?.currency || "USD",
      planName,
      subscriptionEndDate: activeSub?.endDate
        ? activeSub.endDate.toISOString().split("T")[0]
        : null,
      hasAiAgentAccess,
      locale: user.locale || "es",
    };

    // 2. Process message via AI Engine
    const formattedHistory: AiChatMessage[] = history.map((h, i) => ({
      id: `hist-${i}`,
      role: h.role,
      content: h.content,
      createdAt: new Date().toISOString(),
    }));

    const response = await processAiMessage(
      message,
      userContext,
      formattedHistory
    );

    const assistantMessage: AiChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: response.message,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: assistantMessage,
    };
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al procesar el mensaje.";
    return { success: false, error: errorMsg };
  }
}

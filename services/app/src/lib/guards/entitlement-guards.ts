import { prisma } from "@/lib/prisma";
import {
  SystemFeature,
  PlanLimitKey,
  isFeatureEnabled,
  getPlanCapabilities,
} from "@/lib/config/entitlements";
import type { ApiResponse } from "@/types";

/**
 * Server Action Guard: Verifies that a system feature flag is enabled
 */
export function assertFeatureEnabled(feature: SystemFeature): ApiResponse<null> | null {
  if (!isFeatureEnabled(feature)) {
    return {
      success: false,
      error: `La funcionalidad '${feature}' está desactivada en la configuración del sistema.`,
    };
  }
  return null;
}

/**
 * Server Action Guard: Verifies that a brand has not exceeded its plan resource limit
 */
export async function assertBrandPlanLimit(
  brandId: string,
  limitKey: PlanLimitKey,
  currentCount: number
): Promise<ApiResponse<null> | null> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { brandId },
      orderBy: { createdAt: "desc" },
      select: { planName: true },
    });

    const planName = subscription?.planName || "Free";
    const caps = getPlanCapabilities(planName);
    const maxAllowed = caps[limitKey];

    if (typeof maxAllowed === "number" && currentCount >= maxAllowed) {
      return {
        success: false,
        error: `Has alcanzado el límite máximo (${maxAllowed}) permitido para tu plan actual (${planName}). Actualiza tu suscripción para continuar.`,
      };
    }

    return null;
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al verificar límites del plan.";
    return { success: false, error: msg };
  }
}

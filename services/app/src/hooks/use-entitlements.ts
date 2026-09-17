"use client";

import { useMemo } from "react";
import { useBrand } from "@/context/brand-context";
import type {
  SystemFeature,
  PlanLimitKey,
  PlanCapabilities,
} from "@/lib/config/entitlements";
import {
  getEnvironmentFeatures,
  getPlanCapabilities,
} from "@/lib/config/entitlements";

export interface UseEntitlementsOptions {
  planName?: string | null;
}

export function useEntitlements(options: UseEntitlementsOptions = {}) {
  let contextPlanName: string | undefined = undefined;
  try {
    const brandCtx = useBrand();
    contextPlanName = brandCtx.activePlanName;
  } catch {
    // Fallback if rendered outside BrandProvider context
  }

  const effectivePlanName = options.planName ?? contextPlanName ?? "Pro";

  const features = useMemo(() => {
    return getEnvironmentFeatures();
  }, []);

  const planCapabilities: PlanCapabilities = useMemo(() => {
    return getPlanCapabilities(effectivePlanName);
  }, [effectivePlanName]);

  const isFeatureEnabled = (feature: SystemFeature): boolean => {
    return Boolean(features[feature]);
  };

  const isPlanFeatureUnlocked = (
    feature: "aiSensei" | "customDiplomas" | "customBranding" | "tournaments"
  ): boolean => {
    return Boolean(planCapabilities[feature]);
  };

  const isWithinLimit = (
    limitKey: PlanLimitKey,
    currentCount: number
  ): boolean => {
    const limit = planCapabilities[limitKey];
    if (typeof limit === "boolean") return limit;
    return currentCount < limit;
  };

  const canAccessTournaments =
    isFeatureEnabled("tournaments") && isPlanFeatureUnlocked("tournaments");

  const getUpgradeMessage = (featureName: string): string => {
    return `${featureName} es una función avanzada exclusiva para escuelas en el Plan Pro o Enterprise.`;
  };

  return {
    effectivePlanName,
    features,
    planCapabilities,
    isFeatureEnabled,
    isPlanFeatureUnlocked,
    isWithinLimit,
    canAccessTournaments,
    getUpgradeMessage,
  };
}

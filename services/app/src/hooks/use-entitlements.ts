"use client";

import { useMemo } from "react";
import {
  SystemFeature,
  PlanLimitKey,
  PlanCapabilities,
  getEnvironmentFeatures,
  getPlanCapabilities,
  isFeatureEnabled as checkFeatureEnabled,
} from "@/lib/config/entitlements";

export interface UseEntitlementsOptions {
  planName?: string | null;
}

export function useEntitlements(options: UseEntitlementsOptions = {}) {
  const { planName } = options;

  const features = useMemo(() => {
    return getEnvironmentFeatures();
  }, []);

  const planCapabilities: PlanCapabilities = useMemo(() => {
    return getPlanCapabilities(planName);
  }, [planName]);

  const isFeatureEnabled = (feature: SystemFeature): boolean => {
    return Boolean(features[feature]);
  };

  const isPlanFeatureUnlocked = (
    feature: "aiSensei" | "customDiplomas" | "customBranding"
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

  return {
    features,
    planCapabilities,
    isFeatureEnabled,
    isPlanFeatureUnlocked,
    isWithinLimit,
  };
}

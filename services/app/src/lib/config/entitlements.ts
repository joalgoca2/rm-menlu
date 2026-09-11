/**
 * Centralized Entitlements & Feature Flags Control Registry
 * Single Source of Truth for Environment Toggles, Plan Gating & RBAC Permissions
 */

export type SystemFeature =
  | "billing"
  | "pwa"
  | "walkthrough"
  | "screenLock"
  | "offlineMode"
  | "integrations"
  | "aiSensei"
  | "customDiplomas";

export type PlanLimitKey =
  | "maxStudents"
  | "maxDisciplines"
  | "maxGroups"
  | "customBranding";

export interface PlanCapabilities {
  maxStudents: number; // Infinity for unlimited
  maxDisciplines: number;
  maxGroups: number;
  customBranding: boolean;
  aiSensei: boolean;
  customDiplomas: boolean;
}

export interface EntitlementsConfig {
  features: Record<SystemFeature, boolean>;
  planCapabilities: PlanCapabilities;
}

// Default Plan Tier Capabilities
const PLAN_TIERS: Record<string, PlanCapabilities> = {
  Free: {
    maxStudents: 50,
    maxDisciplines: 2,
    maxGroups: 5,
    customBranding: false,
    aiSensei: false,
    customDiplomas: false,
  },
  Pro: {
    maxStudents: 500,
    maxDisciplines: 10,
    maxGroups: 30,
    customBranding: true,
    aiSensei: true,
    customDiplomas: true,
  },
  Enterprise: {
    maxStudents: Infinity,
    maxDisciplines: Infinity,
    maxGroups: Infinity,
    customBranding: true,
    aiSensei: true,
    customDiplomas: true,
  },
};

const parseFlag = (val?: string): boolean => {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return lower !== "false" && lower !== "0";
};

/**
 * Reads Environment Feature Flags
 */
export function getEnvironmentFeatures(): Record<SystemFeature, boolean> {
  return {
    billing: parseFlag(process.env.NEXT_PUBLIC_ENABLE_BILLING),
    pwa: parseFlag(process.env.NEXT_PUBLIC_ENABLE_PWA),
    walkthrough: parseFlag(process.env.NEXT_PUBLIC_ENABLE_WALKTHROUGH),
    screenLock: parseFlag(process.env.NEXT_PUBLIC_ENABLE_SCREEN_LOCK),
    offlineMode: parseFlag(process.env.NEXT_PUBLIC_ENABLE_OFFLINE),
    integrations: parseFlag(process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS),
    aiSensei: parseFlag(process.env.NEXT_PUBLIC_ENABLE_AI_SENSEI),
    customDiplomas: parseFlag(process.env.NEXT_PUBLIC_ENABLE_CUSTOM_DIPLOMAS),
  };
}

/**
 * Resolves Plan Capabilities for a given plan name
 */
export function getPlanCapabilities(planName?: string | null): PlanCapabilities {
  if (!planName) return PLAN_TIERS.Free;
  const normalized = planName.trim();
  if (normalized.toLowerCase().includes("enterprise")) return PLAN_TIERS.Enterprise;
  if (normalized.toLowerCase().includes("pro")) return PLAN_TIERS.Pro;
  return PLAN_TIERS.Free;
}

/**
 * Checks if a system feature flag is enabled in the current environment
 */
export function isFeatureEnabled(feature: SystemFeature): boolean {
  const envFeatures = getEnvironmentFeatures();
  return Boolean(envFeatures[feature]);
}

/**
 * Checks if a specific plan feature capability is unlocked for a brand's plan
 */
export function isPlanFeatureUnlocked(
  feature: "aiSensei" | "customDiplomas" | "customBranding",
  planName?: string | null
): boolean {
  const caps = getPlanCapabilities(planName);
  return Boolean(caps[feature]);
}

/**
 * Checks if a current resource count is within the plan tier limit
 */
export function isWithinPlanLimit(
  limitKey: PlanLimitKey,
  currentCount: number,
  planName?: string | null
): boolean {
  const caps = getPlanCapabilities(planName);
  const limit = caps[limitKey];
  if (typeof limit === "boolean") return limit;
  return currentCount < limit;
}

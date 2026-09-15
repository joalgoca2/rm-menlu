import type { SystemFeature } from "./entitlements";
import { getEnvironmentFeatures } from "./entitlements";

export type FeatureFlags = Record<SystemFeature, boolean>;

export const FEATURES: FeatureFlags = getEnvironmentFeatures();

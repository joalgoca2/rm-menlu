import { getEnvironmentFeatures, SystemFeature } from "./entitlements";

export type FeatureFlags = Record<SystemFeature, boolean>;

export const FEATURES: FeatureFlags = getEnvironmentFeatures();

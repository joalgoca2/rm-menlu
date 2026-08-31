export interface FeatureFlags {
  billing: boolean;
  pwa: boolean;
  walkthrough: boolean;
  screenLock: boolean;
  offlineMode: boolean;
  integrations: boolean;
}

const parseFlag = (val?: string): boolean => {
  if (!val) return true;
  const lower = val.trim().toLowerCase();
  return lower !== "false" && lower !== "0";
};

export const FEATURES: FeatureFlags = {
  billing: parseFlag(process.env.NEXT_PUBLIC_ENABLE_BILLING),
  pwa: parseFlag(process.env.NEXT_PUBLIC_ENABLE_PWA),
  walkthrough: parseFlag(process.env.NEXT_PUBLIC_ENABLE_WALKTHROUGH),
  screenLock: parseFlag(process.env.NEXT_PUBLIC_ENABLE_SCREEN_LOCK),
  offlineMode: parseFlag(process.env.NEXT_PUBLIC_ENABLE_OFFLINE),
  integrations: parseFlag(process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS),
};

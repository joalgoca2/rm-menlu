export interface Subscription {
  id: string;
  brandId: string;
  userId?: string | null;
  planName: string;
  status: "ACTIVE" | "PAST_DUE" | "CANCELED" | string;
  billingCycle: "MONTHLY" | "YEARLY" | string;
  startDate: string | Date;
  endDate: string | Date;
  price: number;
  discount: number;
  finalPrice: number;
  scheduledPlanName?: string | null;
  cancelAtPeriodEnd?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Payment {
  id: string;
  brandId: string;
  userId?: string | null;
  amount: number;
  discountApplied: number;
  paymentDate: string | Date;
  status: "SUCCESS" | "FAILED" | "PENDING" | string;
  gatewayProvider?: string | null;
  trackingId?: string | null;
  rawGatewayStatus?: string | null;
  billingPeriodStart: string | Date;
  billingPeriodEnd: string | Date;
  notes?: string | null;
}

export interface PlanConfig {
  id: string;
  planName: string;
  priceMonthly: number;
  priceYearly: number;
  currency?: string;
  maxProjects: number;
  allowCSVImportExport: boolean;
  hasLiveSupport: boolean;
  hasAiAgent?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ExchangeRate {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rateAgainstUsd: number;
  isDefault: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

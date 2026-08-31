export interface BrandPlanConfig {
  id: string;
  brandId: string;
  name: string;
  description?: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BrandCustomerPayment {
  id: string;
  brandId: string;
  brandPlanId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  concept: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  gatewayProvider: string;
  transactionRef?: string | null;
  checkoutUrl?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BrandPortalData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  currency: string;
  defaultLocale: string;
  timezone: string;
  isSlugLocked: boolean;
  plans: BrandPlanConfig[];
  activeGateways: {
    gatewayType: string;
    publicKey: string;
  }[];
}

export interface CheckoutCustomerInput {
  brandId: string;
  brandPlanId?: string;
  customerName: string;
  customerEmail: string;
  concept: string;
  amount: number;
  currency: string;
  gatewayProvider: string;
}

export interface BrandPaymentStats {
  totalRevenue: number;
  successfulTransactions: number;
  pendingTransactions: number;
  activeGatewaysCount: number;
  currency: string;
}

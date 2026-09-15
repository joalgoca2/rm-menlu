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
  studentId?: string | null;
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
  student?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

export interface BrandFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface BrandTestimonialItem {
  id: string;
  author: string;
  role?: string;
  quote: string;
  avatarUrl?: string;
}

export interface BrandLandingConfig {
  primaryColor?: string;
  heroBannerUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  ctaActionType?: "REGISTER" | "WHATSAPP" | "CUSTOM_URL";
  ctaCustomUrl?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  address?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  businessHours?: string;
  showPlans?: boolean;
  showFaq?: boolean;
  showTestimonials?: boolean;
  showWhatsappWidget?: boolean;
  showHeroPillars?: boolean;
  announcementBannerText?: string;
  announcementBannerUrl?: string;
  faqs?: BrandFaqItem[];
  testimonials?: BrandTestimonialItem[];
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
  landingConfig?: BrandLandingConfig | null;
  plans: BrandPlanConfig[];
  activeGateways: {
    gatewayType: string;
    publicKey: string;
  }[];
}

export interface CheckoutCustomerInput {
  brandId: string;
  brandPlanId?: string;
  studentId?: string;
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
  period?: "MONTH" | "QUARTER" | "YEAR" | "ALL";
}

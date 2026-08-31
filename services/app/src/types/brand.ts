export interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  defaultLocale: string;
  timezone: string;
  currency: string;
  apiKey?: string | null;
  billingWebhookUrl?: string | null;
  generalWebhookUrl?: string | null;
  isWebhookEnabled?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface DiplomaConfig {
  id: string;
  brandId: string;
  template: string;
  layout: string;
  isBlankMode: boolean;
  showDiscipline?: boolean;
  backgroundUrl?: string | null;
  institutionName?: string | null;
  reasonText?: string | null;
  dateText?: string | null;
  schoolLogoSubtext?: string | null;
  sig1Name?: string | null;
  sig1Role?: string | null;
  sig2Name?: string | null;
  sig2Role?: string | null;
  sig3Name?: string | null;
  sig3Role?: string | null;
  sig4Name?: string | null;
  sig4Role?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

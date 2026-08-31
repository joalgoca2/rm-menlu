import { z } from "zod";

export const planConfigSchema = z.object({
  planName: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(50, "El nombre no puede exceder 50 caracteres."),
  priceMonthly: z.number().min(0, "El precio no puede ser negativo."),
  priceYearly: z.number().min(0, "El precio no puede ser negativo."),
  currency: z.string().trim().default("USD"),
  maxProjects: z.number().int().min(1, "Debe incluir al menos 1 proyecto."),
  allowCSVImportExport: z.boolean(),
  hasLiveSupport: z.boolean(),
});

export type PlanConfigInput = z.infer<typeof planConfigSchema>;

export const subscriptionSchema = z.object({
  userId: z.string().trim().min(1, "El ID de usuario es obligatorio."),
  planName: z.string().trim().min(1, "El nombre del plan es obligatorio."),
  status: z.string().trim().default("ACTIVE"),
  billingCycle: z.string().trim().default("MONTHLY"),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  price: z.number().min(0, "El precio no puede ser negativo."),
  discount: z.number().min(0, "El descuento no puede ser negativo.").default(0),
  finalPrice: z.number().min(0, "El precio final no puede ser negativo."),
  timezone: z.string().optional().default("UTC"),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export const paymentSchema = z.object({
  userId: z.string().trim().min(1, "El ID de usuario es obligatorio."),
  amount: z.number().min(0, "El monto no puede ser negativo."),
  discountApplied: z.number().min(0).default(0),
  paymentDate: z.union([z.string(), z.date()]),
  status: z.string().trim().default("SUCCESS"),
  billingPeriodStart: z.union([z.string(), z.date()]),
  billingPeriodEnd: z.union([z.string(), z.date()]),
  notes: z.string().trim().optional().nullable(),
  timezone: z.string().optional().default("UTC"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const exchangeRateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "El código ISO debe tener al menos 3 caracteres.")
    .max(5, "El código ISO no puede exceder 5 caracteres.")
    .toUpperCase(),
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(50, "El nombre no puede exceder 50 caracteres."),
  symbol: z
    .string()
    .trim()
    .min(1, "El símbolo es obligatorio.")
    .max(5, "El símbolo no puede exceder 5 caracteres."),
  rateAgainstUsd: z
    .number()
    .positive("El tipo de cambio debe ser mayor a 0."),
  isDefault: z.boolean().default(false),
});

export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;


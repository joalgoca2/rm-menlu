import { z } from "zod";

export const validateSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .max(50, "El slug no puede exceder 50 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener letras minúsculas, números y guiones entre palabras."
    ),
});

export const customerCheckoutSchema = z.object({
  brandId: z.string().trim().min(1, "ID de marca requerido."),
  brandPlanId: z.string().trim().optional(),
  customerName: z.string().trim().min(2, "Ingresa un nombre válido.").max(100),
  customerEmail: z.string().trim().email("Ingresa un correo electrónico válido."),
  concept: z.string().trim().min(2, "Concepto requerido.").max(150),
  amount: z.number().positive("El monto debe ser mayor a 0."),
  currency: z.string().trim().min(3).max(5).default("MXN"),
  gatewayProvider: z.string().trim().min(1, "Selecciona una pasarela de pago."),
});

export const createBrandPlanSchema = z.object({
  id: z.string().trim().optional(),
  name: z.string().trim().min(2, "El nombre del plan debe tener al menos 2 caracteres.").max(100),
  description: z.string().trim().max(500).optional(),
  priceMonthly: z.number().min(0, "El precio no puede ser negativo."),
  priceYearly: z.number().min(0, "El precio anual no puede ser negativo."),
  currency: z.string().trim().min(3).max(5).default("MXN"),
  isActive: z.boolean().default(true),
});

export type ValidateSlugFormValues = z.infer<typeof validateSlugSchema>;
export type CustomerCheckoutFormValues = z.infer<typeof customerCheckoutSchema>;
export type CreateBrandPlanFormValues = z.infer<typeof createBrandPlanSchema>;

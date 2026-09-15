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

export const noScriptCheck = (val?: string | null): boolean => {
  if (!val) return true;
  const clean = val.toLowerCase();
  return (
    !clean.includes("<script") &&
    !clean.includes("</script") &&
    !clean.includes("javascript:") &&
    !clean.includes("onload=") &&
    !clean.includes("onerror=")
  );
};

export const brandFaqSchema = z.object({
  id: z.string().trim(),
  question: z
    .string()
    .trim()
    .min(2, "La pregunta debe tener al menos 2 caracteres.")
    .max(150, "La pregunta no puede exceder 150 caracteres.")
    .refine(noScriptCheck, { message: "No se permiten códigos incrustados ni scripts." }),
  answer: z
    .string()
    .trim()
    .min(2, "La respuesta debe tener al menos 2 caracteres.")
    .max(600, "La respuesta no puede exceder 600 caracteres.")
    .refine(noScriptCheck, { message: "No se permiten códigos incrustados ni scripts." }),
});

export const isValidImageUrl = (url?: string | null): boolean => {
  if (!url || !url.trim()) return true;
  const clean = url.trim().toLowerCase();

  if (
    clean.includes("<") ||
    clean.includes(">") ||
    clean.includes("script") ||
    clean.includes("iframe") ||
    clean.includes("javascript:")
  ) {
    return false;
  }

  if (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".avi") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".mkv") ||
    clean.includes("youtube.com") ||
    clean.includes("youtu.be") ||
    clean.includes("vimeo.com") ||
    clean.includes("tiktok.com")
  ) {
    return false;
  }

  return clean.startsWith("http://") || clean.startsWith("https://");
};

export const brandTestimonialSchema = z.object({
  id: z.string().trim(),
  author: z
    .string()
    .trim()
    .min(2, "El nombre del autor debe tener al menos 2 caracteres.")
    .max(80, "El nombre del autor no puede exceder 80 caracteres.")
    .refine(noScriptCheck, { message: "No se permiten códigos incrustados ni scripts." }),
  role: z
    .string()
    .trim()
    .max(80, "El rol/cargo no puede exceder 80 caracteres.")
    .refine(noScriptCheck, { message: "No se permiten códigos incrustados ni scripts." })
    .optional(),
  quote: z
    .string()
    .trim()
    .min(2, "El testimonio debe tener al menos 2 caracteres.")
    .max(300, "El testimonio no puede exceder 300 caracteres.")
    .refine(noScriptCheck, { message: "No se permiten códigos incrustados ni scripts." }),
  avatarUrl: z
    .string()
    .trim()
    .url("URL de avatar no válida.")
    .refine(isValidImageUrl, {
      message: "La URL debe ser una imagen directa (JPG, PNG, WebP, SVG). No se permiten videos ni scripts.",
    })
    .or(z.literal(""))
    .optional(),
});

export const updateBrandLandingSchema = z.object({
  primaryColor: z.string().trim().max(30).optional(),
  heroBannerUrl: z
    .string()
    .trim()
    .url("URL de imagen no válida.")
    .refine(isValidImageUrl, {
      message: "La URL debe ser una imagen directa (JPG, PNG, WebP, SVG). No se permiten videos ni scripts.",
    })
    .or(z.literal(""))
    .optional(),
  heroTitle: z.string().trim().max(120, "El título no puede exceder 120 caracteres.").optional(),
  heroSubtitle: z.string().trim().max(500, "El subtítulo no puede exceder 500 caracteres.").optional(),
  ctaText: z.string().trim().max(50, "El texto del botón no puede exceder 50 caracteres.").optional(),
  ctaActionType: z.enum(["REGISTER", "WHATSAPP", "CUSTOM_URL"]).optional(),
  ctaCustomUrl: z.string().trim().url("URL no válida.").or(z.literal("")).optional(),
  whatsappNumber: z.string().trim().max(30).optional(),
  whatsappMessage: z.string().trim().max(200).optional(),
  address: z.string().trim().max(200).optional(),
  googleMapsUrl: z.string().trim().url("URL de mapa no válida.").or(z.literal("")).optional(),
  websiteUrl: z.string().trim().url("URL de sitio web no válida.").or(z.literal("")).optional(),
  businessHours: z.string().trim().max(150).optional(),
  showPlans: z.boolean().optional(),
  showFaq: z.boolean().optional(),
  showTestimonials: z.boolean().optional(),
  showWhatsappWidget: z.boolean().optional(),
  showHeroPillars: z.boolean().optional(),
  announcementBannerText: z.string().trim().max(150).optional(),
  announcementBannerUrl: z.string().trim().url("URL no válida.").or(z.literal("")).optional(),
  faqs: z.array(brandFaqSchema).max(10).optional(),
  testimonials: z.array(brandTestimonialSchema).max(10).optional(),
});

export type ValidateSlugFormValues = z.infer<typeof validateSlugSchema>;
export type CustomerCheckoutFormValues = z.infer<typeof customerCheckoutSchema>;
export type CreateBrandPlanFormValues = z.infer<typeof createBrandPlanSchema>;
export type UpdateBrandLandingFormValues = z.infer<typeof updateBrandLandingSchema>;


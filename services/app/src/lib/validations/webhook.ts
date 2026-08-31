import { z } from "zod";

export const updateBrandWebhooksSchema = z.object({
  billingWebhookUrl: z
    .string()
    .trim()
    .url("Debe ser una URL válida (http/https).")
    .or(z.literal(""))
    .nullable()
    .optional(),
  generalWebhookUrl: z
    .string()
    .trim()
    .url("Debe ser una URL válida (http/https).")
    .or(z.literal(""))
    .nullable()
    .optional(),
  isWebhookEnabled: z.boolean().default(true),
});

export type UpdateBrandWebhooksInput = z.infer<
  typeof updateBrandWebhooksSchema
>;

export const testWebhookSchema = z.object({
  brandId: z.string().trim().min(1, "El ID de la marca es obligatorio."),
  event: z.string().trim().default("test.event"),
});

export type TestWebhookInput = z.infer<typeof testWebhookSchema>;

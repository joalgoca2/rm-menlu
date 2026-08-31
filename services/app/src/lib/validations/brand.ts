import { z } from "zod";
import { localeSchema, nameSchema, timezoneSchema } from "./common";

export const createBrandSchema = z.object({
  name: nameSchema,
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),
  logoUrl: z
    .string()
    .trim()
    .url("Invalid URL format.")
    .max(2048, "URL is too long.")
    .optional()
    .or(z.literal("")),
  defaultLocale: localeSchema,
  timezone: timezoneSchema,
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

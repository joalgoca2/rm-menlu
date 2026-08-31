import { z } from "zod";

export const sendAiMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío.")
    .max(2000, "El mensaje excede el límite de 2000 caracteres."),
  contextPath: z.string().trim().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .optional(),
});

export type SendAiMessageFormValues = z.infer<typeof sendAiMessageSchema>;

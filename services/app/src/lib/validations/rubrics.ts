import { z } from "zod";

export const evaluationCriterionInputSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Criterion name must be at least 2 characters")
    .max(100, "Criterion name cannot exceed 100 characters"),
  category: z
    .string()
    .trim()
    .max(50, "Category cannot exceed 50 characters")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(300, "Description cannot exceed 300 characters")
    .optional()
    .nullable(),
  orderIndex: z.number().int().min(1).default(1),
});

export const evaluationTemplateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Template title must be at least 2 characters")
    .max(100, "Template title cannot exceed 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  disciplineId: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  criteria: z.array(evaluationCriterionInputSchema).min(1, "At least one criterion is required"),
});

export const criterionScoreSubmissionSchema = z.object({
  examEvaluationId: z.string().min(1, "Exam Evaluation ID is required"),
  scores: z.array(
    z.object({
      criterionId: z.string().min(1, "Criterion ID is required"),
      rating: z.enum(["EXCELLENT", "GOOD", "NEEDS_WORK"]),
      comments: z
        .string()
        .trim()
        .max(300, "Comment cannot exceed 300 characters")
        .optional()
        .nullable(),
    })
  ),
});

export type EvaluationTemplateInput = z.infer<typeof evaluationTemplateSchema>;
export type CriterionScoreSubmissionInput = z.infer<typeof criterionScoreSubmissionSchema>;

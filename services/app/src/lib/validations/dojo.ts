import { z } from "zod";

export const disciplineSchema = z.object({
  brandId: z.string().min(1, "El ID de la academia es requerido."),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  code: z.string().trim().max(20).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

export const beltSchema = z.object({
  disciplineId: z.string().min(1, "La disciplina es requerida."),
  name: z.string().trim().min(2, "El nombre del cinturón es requerido.").max(50),
  colorHex: z.string().trim().min(4).max(7).default("#FFFFFF"),
  orderIndex: z.number().int().min(1).default(1),
  minClasses: z.number().int().min(0).default(24),
  minMonths: z.number().int().min(0).default(3),
});

export const physicalChallengeSchema = z.object({
  brandId: z.string().min(1, "El ID de la academia es requerido."),
  disciplineId: z.string().optional().nullable(),
  title: z.string().trim().min(3, "El título debe tener al menos 3 caracteres.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  minAge: z.number().int().min(1).max(99).optional().nullable(),
  maxAge: z.number().int().min(1).max(99).optional().nullable(),
  targetBeltId: z.string().optional().nullable(),
  targetReps: z.number().int().min(1).default(10),
  metricType: z.enum(["REPETITIONS", "SECONDS", "MINUTES"]).default("REPETITIONS"),
  xpReward: z.number().int().min(5).max(1000).default(40),
  requiresValidation: z.boolean().default(true),
});

export const gradeExamSchema = z.object({
  brandId: z.string().min(1, "El ID de la academia es requerido."),
  disciplineId: z.string().min(1, "La disciplina es requerida."),
  title: z.string().trim().min(3, "El título del examen es requerido.").max(120),
  examDate: z.string().min(1, "La fecha del examen es requerida."),
  location: z.string().trim().max(150).optional().nullable(),
  feeAmount: z.number().min(0).default(0),
  currency: z.string().trim().length(3).default("MXN"),
});

export const tournamentSchema = z.object({
  brandId: z.string().min(1, "El ID de la academia es requerido."),
  disciplineId: z.string().optional().nullable(),
  title: z.string().trim().min(3, "El nombre del torneo es requerido.").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  location: z.string().trim().max(150).optional().nullable(),
  tournamentDate: z.string().min(1, "La fecha del torneo es requerida."),
});

export type CreateDisciplineInput = z.infer<typeof disciplineSchema>;
export type CreateBeltInput = z.infer<typeof beltSchema>;
export type CreatePhysicalChallengeInput = z.infer<typeof physicalChallengeSchema>;
export type CreateGradeExamInput = z.infer<typeof gradeExamSchema>;
export type CreateTournamentInput = z.infer<typeof tournamentSchema>;

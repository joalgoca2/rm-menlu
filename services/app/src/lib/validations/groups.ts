import { z } from "zod";

export const groupDisciplineInputSchema = z.object({
  disciplineId: z.string().min(1, "Discipline ID is required"),
  scheduleText: z
    .string()
    .trim()
    .max(100, "Schedule text cannot exceed 100 characters")
    .optional()
    .nullable(),
});

export const studentGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(80, "Group name cannot exceed 80 characters"),
  code: z
    .string()
    .trim()
    .max(30, "Code cannot exceed 30 characters")
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  minAge: z
    .number()
    .int()
    .min(1, "Minimum age must be at least 1")
    .max(120, "Maximum age is 120")
    .optional()
    .nullable(),
  maxAge: z
    .number()
    .int()
    .min(1, "Maximum age must be at least 1")
    .max(120, "Maximum age is 120")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  disciplines: z.array(groupDisciplineInputSchema).optional(),
});

export const assignStudentsToGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  studentIds: z.array(z.string().min(1)),
});

export type StudentGroupInput = z.infer<typeof studentGroupSchema>;
export type AssignStudentsToGroupInput = z.infer<typeof assignStudentsToGroupSchema>;

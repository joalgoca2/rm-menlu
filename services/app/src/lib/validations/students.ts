import { z } from "zod";

export const createStudentSchema = z.object({
  brandId: z.string().min(1, "La marca/dojo es requerida."),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().trim().email("Formato de correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").optional(),
  birthDate: z.string().optional().nullable(),
  emergencyContact: z.string().trim().max(100).optional().nullable(),
  idNumber: z.string().trim().max(50).optional().nullable(),
  nationality: z.string().trim().max(50).optional().nullable(),
  healthInsuranceProvider: z.string().trim().max(100).optional().nullable(),
  healthInsurancePolicyNumber: z.string().trim().max(100).optional().nullable(),
  medicalConditions: z.string().trim().max(500).optional().nullable(),
  medications: z.string().trim().max(500).optional().nullable(),
  disciplineIds: z.array(z.string()).min(1, "Debes seleccionar al menos una disciplina."),
  beltId: z.string().optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentEmail: z.string().trim().email("Correo de tutor inválido.").optional().or(z.literal("")),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  image: z.string().optional().nullable(),
});

export const updateStudentSchema = z.object({
  studentId: z.string().min(1, "ID de alumno requerido."),
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  email: z.string().trim().email("Formato de correo electrónico inválido."),
  birthDate: z.string().optional().nullable(),
  emergencyContact: z.string().trim().max(100).optional().nullable(),
  idNumber: z.string().trim().max(50).optional().nullable(),
  nationality: z.string().trim().max(50).optional().nullable(),
  healthInsuranceProvider: z.string().trim().max(100).optional().nullable(),
  healthInsurancePolicyNumber: z.string().trim().max(100).optional().nullable(),
  medicalConditions: z.string().trim().max(500).optional().nullable(),
  medications: z.string().trim().max(500).optional().nullable(),
  disciplineIds: z.array(z.string()).optional(),
  beltId: z.string().optional().nullable(),
  effortPoints: z.coerce.number().min(0).optional(),
  currentStreak: z.coerce.number().min(0).optional(),
  shieldsAvailable: z.coerce.number().min(0).optional(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentEmail: z.string().trim().email("Correo de tutor inválido.").optional().or(z.literal("")),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  image: z.string().optional().nullable(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

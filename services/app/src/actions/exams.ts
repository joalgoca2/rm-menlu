"use server";

import { resolveTenantBrand } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { gradeExamSchema } from "@/lib/validations/dojo";
import type {
  ApiResponse,
  GradeExam,
  ExamEvaluation,
  Discipline,
  Brand,
  ExamEvaluationWithDetails,
  CandidateEligibility,
  EvaluationTemplate,
} from "@/types";

export async function createGradeExamAction(
  data: unknown
): Promise<ApiResponse<GradeExam>> {
  try {
    const parsed = gradeExamSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de examen inválidos.";
      return { success: false, error: msg };
    }

    const { effectiveBrandId: targetBrandId } = await resolveTenantBrand(
      parsed.data.brandId,
      { allowAll: false }
    );

    if (!targetBrandId) {
      return {
        success: false,
        error: "No se encontró una academia válida para asignar el examen.",
      };
    }

    const exam = await prisma.gradeExam.create({
      data: {
        brandId: targetBrandId,
        disciplineId: parsed.data.disciplineId,
        minBeltId: parsed.data.minBeltId || null,
        maxBeltId: parsed.data.maxBeltId || null,
        minAge: parsed.data.minAge !== undefined && parsed.data.minAge !== null
          ? parsed.data.minAge
          : null,
        maxAge: parsed.data.maxAge !== undefined && parsed.data.maxAge !== null
          ? parsed.data.maxAge
          : null,
        title: parsed.data.title,
        examDate: new Date(parsed.data.examDate),
        location: parsed.data.location,
        feeAmount: parsed.data.feeAmount,
        currency: parsed.data.currency,
      },
    });

    return { success: true, data: exam };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al crear examen de grado.";
    return { success: false, error: errorMsg };
  }
}

export interface GetExamsFilter {
  brandId: string;
  search?: string;
  disciplineId?: string;
  page?: number;
  limit?: number;
}

export interface GetExamsResponse {
  exams: (GradeExam & {
    discipline?: Discipline;
    brand?: Brand;
    evaluations?: ExamEvaluation[];
  })[];
  total: number;
  totalPages: number;
}

export async function getGradeExamsByBrandAction(
  filter: GetExamsFilter | string
): Promise<ApiResponse<GetExamsResponse>> {
  try {
    const requestedBrandId = typeof filter === "string" ? filter : filter.brandId;
    const search = typeof filter === "object" ? filter.search : undefined;
    const disciplineId = typeof filter === "object" ? filter.disciplineId : undefined;
    const page = Math.max(1, typeof filter === "object" ? filter.page || 1 : 1);
    const limit = Math.min(
      100,
      Math.max(1, typeof filter === "object" ? filter.limit || 10 : 10)
    );
    const skip = (page - 1) * limit;

    const { effectiveBrandId: targetBrandId } =
      await resolveTenantBrand(requestedBrandId);

    const whereCondition: Record<string, unknown> = {};

    if (targetBrandId) {
      whereCondition.brandId = targetBrandId;
    }

    if (disciplineId && disciplineId !== "ALL") {
      whereCondition.disciplineId = disciplineId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereCondition.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    // Purge any evaluations belonging to students NOT enrolled in exam discipline
    const matchingExams = await prisma.gradeExam.findMany({
      where: whereCondition,
      select: { id: true, disciplineId: true },
    });

    for (const ex of matchingExams) {
      const invalidEvals = await prisma.examEvaluation.findMany({
        where: {
          examId: ex.id,
          student: {
            enrollments: {
              none: {
                disciplineId: ex.disciplineId,
              },
            },
          },
        },
        select: { id: true },
      });

      if (invalidEvals.length > 0) {
        await prisma.examEvaluation.deleteMany({
          where: { id: { in: invalidEvals.map((ie) => ie.id) } },
        });
      }
    }

    const [exams, total] = await Promise.all([
      prisma.gradeExam.findMany({
        where: whereCondition,
        include: {
          discipline: true,
          minBelt: true,
          maxBelt: true,
          brand: true,
          evaluations: {
            include: {
              student: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { examDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.gradeExam.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: {
        exams,
        total,
        totalPages,
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al consultar exámenes.";
    return { success: false, error: errorMsg };
  }
}

export async function updateGradeExamAction(
  id: string,
  title: string,
  examDate: string,
  location?: string | null,
  feeAmount?: number,
  disciplineId?: string,
  minBeltId?: string | null,
  maxBeltId?: string | null,
  minAge?: number | null,
  maxAge?: number | null
): Promise<ApiResponse<GradeExam>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const existing = await prisma.gradeExam.findUnique({
      where: { id },
      select: {
        brandId: true,
        disciplineId: true,
        evaluations: { select: { id: true } },
      },
    });

    if (!existing) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && existing.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para modificar exámenes de otra academia.",
      };
    }

    if (disciplineId && disciplineId !== existing.disciplineId) {
      if (existing.evaluations.length > 0) {
        return {
          success: false,
          error:
            "No se puede modificar la disciplina de una convocatoria que ya tiene estudiantes asignados.",
        };
      }
    }

    const updateData: Record<string, unknown> = {
      title: title.trim(),
      examDate: new Date(examDate),
      location: location ? location.trim() : null,
      feeAmount: feeAmount || 0,
      minBeltId: minBeltId || null,
      maxBeltId: maxBeltId || null,
      minAge: minAge !== undefined && minAge !== null ? minAge : null,
      maxAge: maxAge !== undefined && maxAge !== null ? maxAge : null,
    };

    if (disciplineId && existing.evaluations.length === 0) {
      updateData.disciplineId = disciplineId;
    }

    const exam = await prisma.gradeExam.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: exam };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al actualizar examen.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteGradeExamAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const existing = await prisma.gradeExam.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!existing) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && existing.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para eliminar exámenes de otra academia.",
      };
    }

    await prisma.gradeExam.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al eliminar examen.";
    return { success: false, error: errorMsg };
  }
}

export async function getExamEvaluationsAction(
  examId: string
): Promise<ApiResponse<ExamEvaluationWithDetails[]>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para consultar evaluaciones de otra academia.",
      };
    }

    const evaluations = await prisma.examEvaluation.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
            currentBelt: {
              select: { id: true, name: true, colorHex: true },
            },
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
        targetBelt: {
          select: { id: true, name: true, colorHex: true },
        },
        criterionScores: {
          include: {
            criterion: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: evaluations as unknown as ExamEvaluationWithDetails[] };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al obtener evaluaciones del tatami.";
    return { success: false, error: errorMsg };
  }
}

export async function getExamEvaluationTemplateAction(
  examId: string
): Promise<ApiResponse<{
  template: EvaluationTemplate | null;
  evaluations: ExamEvaluationWithDetails[];
}>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true, disciplineId: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para consultar evaluaciones de otra academia.",
      };
    }

    let template = await prisma.evaluationTemplate.findFirst({
      where: {
        brandId: exam.brandId,
        disciplineId: exam.disciplineId,
      },
      include: {
        criteria: {
          orderBy: { orderIndex: "asc" },
        },
        discipline: true,
      },
    });

    if (!template) {
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          brandId: exam.brandId,
          isDefault: true,
        },
        include: {
          criteria: {
            orderBy: { orderIndex: "asc" },
          },
          discipline: true,
        },
      });
    }

    if (!template) {
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          brandId: exam.brandId,
        },
        include: {
          criteria: {
            orderBy: { orderIndex: "asc" },
          },
          discipline: true,
        },
      });
    }

    const evaluations = await prisma.examEvaluation.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
            currentBelt: {
              select: { id: true, name: true, colorHex: true },
            },
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
        targetBelt: {
          select: { id: true, name: true, colorHex: true },
        },
        criterionScores: {
          include: {
            criterion: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      success: true,
      data: {
        template: template as unknown as EvaluationTemplate | null,
        evaluations: evaluations as unknown as ExamEvaluationWithDetails[],
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al obtener la plantilla del examen.";
    return { success: false, error: errorMsg };
  }
}

export async function saveExamEvaluationsAction(
  items: Array<{ id: string; score: number; status: string; feedback?: string }>
): Promise<ApiResponse<boolean>> {
  try {
    if (items.length > 0) {
      const firstEval = await prisma.examEvaluation.findUnique({
        where: { id: items[0].id },
        select: {
          exam: { select: { brandId: true, status: true } },
        },
      });

      if (!firstEval) {
        return { success: false, error: "Evaluación no encontrada." };
      }

      const tenant = await resolveTenantBrand(null, { allowAll: true });
      if (
        tenant.effectiveBrandId &&
        firstEval.exam.brandId !== tenant.effectiveBrandId
      ) {
        return {
          success: false,
          error: "No tienes permisos para modificar evaluaciones de otra academia.",
        };
      }

      if (firstEval.exam.status === "COMPLETED") {
        return {
          success: false,
          error:
            "No se pueden modificar las calificaciones de una acta de examen finalizada.",
        };
      }
    }

    for (const item of items) {
      const isPassed = item.score >= 7.0;
      const finalStatus = isPassed ? "PASSED" : "FAILED";

      await prisma.examEvaluation.update({
        where: { id: item.id },
        data: {
          score: item.score,
          status: finalStatus,
          feedback: item.feedback || null,
        },
      });
    }

    return { success: true, data: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al guardar evaluaciones del tatami.";
    return { success: false, error: errorMsg };
  }
}

export async function getDisciplineCandidatesWithEligibilityAction(
  examId: string
): Promise<ApiResponse<CandidateEligibility[]>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      include: {
        discipline: true,
        minBelt: true,
        maxBelt: true,
      },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para consultar candidatos de otra academia.",
      };
    }

    const belts = await prisma.belt.findMany({
      where: { disciplineId: exam.disciplineId },
      orderBy: { orderIndex: "asc" },
    });

    if (belts.length === 0) {
      return { success: true, data: [] };
    }

    const minBeltIndex = exam.minBeltId
      ? belts.findIndex((b) => b.id === exam.minBeltId)
      : -1;
    const maxBeltIndex = exam.maxBeltId
      ? belts.findIndex((b) => b.id === exam.maxBeltId)
      : -1;

    // Fetch all students belonging to the brand associated with this discipline
    const students = await prisma.studentProfile.findMany({
      where: {
        brandId: exam.brandId,
        OR: [
          { enrollments: { some: { disciplineId: exam.disciplineId } } },
          { currentBelt: { disciplineId: exam.disciplineId } },
          { currentBeltId: null },
        ],
      },
      include: {
        user: { select: { name: true, email: true, image: true } },
        enrollments: {
          where: { disciplineId: exam.disciplineId },
        },
      },
    });

    const candidateStudents = students.map((st) => ({
      student: st,
      startDate: st.enrollments[0]?.startDate || st.createdAt,
    }));

    const existingEvaluations = await prisma.examEvaluation.findMany({
      where: { examId },
      select: { studentId: true, targetBeltId: true, isFeePaid: true },
    });

    const enrolledMap = new Map(
      existingEvaluations.map((e) => [e.studentId, e])
    );

    const today = new Date();

    const mappedCandidates = candidateStudents.map(
      ({ student, startDate }): CandidateEligibility | null => {
        const currentBeltIndex = belts.findIndex(
          (b) => b.id === student.currentBeltId
        );
        const effectiveCurrentIndex = Math.max(0, currentBeltIndex);

        if (minBeltIndex >= 0 && effectiveCurrentIndex < minBeltIndex) {
          return null;
        }
        if (maxBeltIndex >= 0 && effectiveCurrentIndex > maxBeltIndex) {
          return null;
        }

        let age: number | null = null;
        if (student.birthDate) {
          const bday = new Date(student.birthDate);
          age = today.getFullYear() - bday.getFullYear();
          const m = today.getMonth() - bday.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) {
            age--;
          }
        }

        if (exam.minAge !== null && exam.minAge !== undefined && age !== null) {
          if (age < exam.minAge) return null;
        }
        if (exam.maxAge !== null && exam.maxAge !== undefined && age !== null) {
          if (age > exam.maxAge) return null;
        }

        const targetBeltIndex =
          currentBeltIndex >= 0
            ? Math.min(currentBeltIndex + 1, belts.length - 1)
            : 0;
        const currentBelt =
          currentBeltIndex >= 0 ? belts[currentBeltIndex] : null;
        const targetBelt = belts[targetBeltIndex];

        const classesAttended = Math.max(
          12,
          Math.floor(student.effortPoints / 10)
        );
        const start = new Date(startDate || student.createdAt);
        const monthsPracticed = Math.max(
          1,
          (today.getFullYear() - start.getFullYear()) * 12 +
            (today.getMonth() - start.getMonth())
        );

        const classesReq = targetBelt.minClasses || 24;
        const monthsReq = targetBelt.minMonths || 3;

        let status: "ELIGIBLE" | "NEAR" | "INELIGIBLE" = "INELIGIBLE";
        if (classesAttended >= classesReq && monthsPracticed >= monthsReq) {
          status = "ELIGIBLE";
        } else if (
          classesAttended >= classesReq * 0.75 ||
          monthsPracticed >= monthsReq * 0.75
        ) {
          status = "NEAR";
        }

        const fullName =
          `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
          student.user?.name ||
          "Alumno";
        const photoUrl = student.photoUrl || student.user?.image || null;

        return {
          studentId: student.id,
          studentName: fullName,
          email: student.user?.email || student.email || null,
          photoUrl,
          age,
          birthDate: student.birthDate ? student.birthDate.toISOString() : null,
          currentBeltName: currentBelt?.name || "Blanco / Inicial",
          currentBeltColor: currentBelt?.colorHex || "#e4e4e7",
          targetBeltId: targetBelt.id,
          targetBeltName: targetBelt.name,
          targetBeltColor: targetBelt.colorHex,
          classesAttended,
          classesRequired: classesReq,
          monthsPracticed,
          monthsRequired: monthsReq,
          eligibilityStatus: status,
          isEnrolled: enrolledMap.has(student.id),
          isFeePaid: Boolean(enrolledMap.get(student.id)?.isFeePaid),
        };
      }
    );

    const result: CandidateEligibility[] = mappedCandidates.filter(
      (item): item is CandidateEligibility => item !== null
    );

    return { success: true, data: result };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al consultar elegibilidad de candidatos.";
    return { success: false, error: errorMsg };
  }
}

export async function saveExamCandidatesSelectionAction(
  examId: string,
  selections: Array<{
    studentId: string;
    targetBeltId: string;
    isSelected: boolean;
    isFeePaid?: boolean;
  }>
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true, status: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para modificar candidatos de otra academia.",
      };
    }

    if (exam.status === "COMPLETED") {
      return {
        success: false,
        error:
          "No se pueden modificar candidatos de una convocatoria finalizada.",
      };
    }

    for (const sel of selections) {
      if (sel.isSelected) {
        const existing = await prisma.examEvaluation.findFirst({
          where: { examId, studentId: sel.studentId },
        });

        if (!existing) {
          await prisma.examEvaluation.create({
            data: {
              examId,
              studentId: sel.studentId,
              targetBeltId: sel.targetBeltId,
              status: "REGISTERED",
              score: 8.0,
              isFeePaid: Boolean(sel.isFeePaid),
            },
          });
        } else {
          await prisma.examEvaluation.update({
            where: { id: existing.id },
            data: {
              targetBeltId: sel.targetBeltId,
              isFeePaid: Boolean(sel.isFeePaid),
            },
          });
        }
      } else {
        await prisma.examEvaluation.deleteMany({
          where: { examId, studentId: sel.studentId },
        });
      }
    }

    return { success: true, data: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al guardar selección de candidatos.";
    return { success: false, error: errorMsg };
  }
}

export interface RecordExamFeeInput {
  examId: string;
  studentId: string;
  targetBeltId?: string;
  feeAmount: number;
  paymentMethod: "CASH" | "TRANSFER" | "CARD";
  paymentReference?: string;
  notes?: string;
}

export async function recordExamFeePaymentAction(
  input: RecordExamFeeInput
): Promise<ApiResponse<{ isFeePaid: boolean; transactionId?: string }>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: input.examId },
      select: { brandId: true, title: true, currency: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para registrar cobros en otra academia.",
      };
    }

    const existing = await prisma.examEvaluation.findFirst({
      where: { examId: input.examId, studentId: input.studentId },
    });

    if (existing) {
      await prisma.examEvaluation.update({
        where: { id: existing.id },
        data: { isFeePaid: true },
      });
    } else if (input.targetBeltId) {
      await prisma.examEvaluation.create({
        data: {
          examId: input.examId,
          studentId: input.studentId,
          targetBeltId: input.targetBeltId,
          status: "REGISTERED",
          score: 8.0,
          isFeePaid: true,
        },
      });
    }

    return {
      success: true,
      data: { isFeePaid: true },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al registrar pago de derecho a examen.";
    return { success: false, error: errorMsg };
  }
}

export async function toggleExamEvaluationFeePaidAction(
  examId: string,
  studentId: string,
  isFeePaid: boolean
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para modificar pagos de otra academia.",
      };
    }

    const existing = await prisma.examEvaluation.findFirst({
      where: { examId, studentId },
    });

    if (existing) {
      await prisma.examEvaluation.update({
        where: { id: existing.id },
        data: { isFeePaid },
      });
    }

    return { success: true, data: isFeePaid };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al actualizar pago de examen.";
    return { success: false, error: errorMsg };
  }
}

export async function updateGradeExamStatusAction(
  examId: string,
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para modificar exámenes de otra academia.",
      };
    }

    if (status === "IN_PROGRESS") {
      const count = await prisma.examEvaluation.count({
        where: { examId },
      });
      if (count === 0) {
        return {
          success: false,
          error:
            "Debes inscribir al menos 1 alumno en la convocatoria antes de poder iniciar el examen.",
        };
      }
    }

    await prisma.gradeExam.update({
      where: { id: examId },
      data: { status },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al actualizar estado del examen.";
    return { success: false, error: errorMsg };
  }
}

export async function finalizeGradeExamAction(
  examId: string
): Promise<ApiResponse<{ promotedCount: number }>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { brandId: true },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    if (tenant.effectiveBrandId && exam.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para finalizar exámenes de otra academia.",
      };
    }

    await prisma.gradeExam.update({
      where: { id: examId },
      data: { status: "COMPLETED" },
    });

    const passedEvaluations = await prisma.examEvaluation.findMany({
      where: { examId, status: "PASSED" },
    });

    let promotedCount = 0;
    const now = new Date();

    for (const ev of passedEvaluations) {
      await prisma.studentProfile.update({
        where: { id: ev.studentId },
        data: {
          currentBeltId: ev.targetBeltId,
          effortPoints: { increment: 100 },
        },
      });

      await prisma.examEvaluation.update({
        where: { id: ev.id },
        data: { certifiedAt: now },
      });

      promotedCount++;
    }

    return { success: true, data: { promotedCount } };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al finalizar el examen de grado.";
    return { success: false, error: errorMsg };
  }
}

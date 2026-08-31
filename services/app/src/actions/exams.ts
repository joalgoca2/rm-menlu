"use server";

import { prisma } from "@/lib/prisma";
import { gradeExamSchema } from "@/lib/validations/dojo";
import type { ApiResponse, GradeExam, ExamEvaluation } from "@/types";

export async function createGradeExamAction(
  data: unknown
): Promise<ApiResponse<GradeExam>> {
  try {
    const parsed = gradeExamSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de examen inválidos.";
      return { success: false, error: msg };
    }

    const exam = await prisma.gradeExam.create({
      data: {
        brandId: parsed.data.brandId,
        disciplineId: parsed.data.disciplineId,
        title: parsed.data.title,
        examDate: new Date(parsed.data.examDate),
        location: parsed.data.location,
        feeAmount: parsed.data.feeAmount,
        currency: parsed.data.currency,
      },
    });

    return { success: true, data: exam };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear examen de grado.";
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
  exams: (GradeExam & { discipline?: Discipline; brand?: Brand; evaluations?: ExamEvaluation[] })[];
  total: number;
  totalPages: number;
}

export async function getGradeExamsByBrandAction(
  filter: GetExamsFilter | string
): Promise<ApiResponse<GetExamsResponse>> {
  try {
    const brandId = typeof filter === "string" ? filter : filter.brandId;
    const search = typeof filter === "object" ? filter.search : undefined;
    const disciplineId = typeof filter === "object" ? filter.disciplineId : undefined;
    const page = Math.max(1, typeof filter === "object" ? filter.page || 1 : 1);
    const limit = Math.min(100, Math.max(1, typeof filter === "object" ? filter.limit || 10 : 10));
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = {};

    if (brandId && brandId !== "ALL") {
      whereCondition.brandId = brandId;
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

    // Purge any evaluations that belong to students NOT enrolled in the exam's discipline
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
    const errorMsg = error instanceof Error ? error.message : "Error al consultar exámenes.";
    return { success: false, error: errorMsg };
  }
}

export async function updateGradeExamAction(
  id: string,
  title: string,
  examDate: string,
  location?: string | null,
  feeAmount?: number,
  disciplineId?: string
): Promise<ApiResponse<GradeExam>> {
  try {
    const existing = await prisma.gradeExam.findUnique({
      where: { id },
      select: { disciplineId: true, evaluations: { select: { id: true } } },
    });

    if (existing && disciplineId && disciplineId !== existing.disciplineId) {
      if (existing.evaluations.length > 0) {
        return {
          success: false,
          error: "No se puede modificar la disciplina de una convocatoria que ya tiene estudiantes asignados.",
        };
      }
    }

    const updateData: Record<string, unknown> = {
      title: title.trim(),
      examDate: new Date(examDate),
      location: location ? location.trim() : null,
      feeAmount: feeAmount || 0,
    };

    if (disciplineId && (!existing || existing.evaluations.length === 0)) {
      updateData.disciplineId = disciplineId;
    }

    const exam = await prisma.gradeExam.update({
      where: { id },
      data: updateData,
    });

    return { success: true, data: exam };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar examen.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteGradeExamAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.gradeExam.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar examen.";
    return { success: false, error: errorMsg };
  }
}

export async function getExamEvaluationsAction(
  examId: string
): Promise<ApiResponse<ExamEvaluationWithDetails[]>> {
  try {
    const evaluations = await prisma.examEvaluation.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        targetBelt: {
          select: { id: true, name: true, colorHex: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: evaluations };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener evaluaciones del tatami.";
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
        select: { exam: { select: { status: true } } },
      });

      if (firstEval?.exam?.status === "COMPLETED") {
        return {
          success: false,
          error: "No se pueden modificar las calificaciones de una acta de examen finalizada y certificada.",
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
    const errorMsg = error instanceof Error ? error.message : "Error al guardar evaluaciones del tatami.";
    return { success: false, error: errorMsg };
  }
}

export async function getDisciplineCandidatesWithEligibilityAction(
  examId: string
): Promise<ApiResponse<CandidateEligibility[]>> {
  try {
    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      include: {
        discipline: true,
      },
    });

    if (!exam) {
      return { success: false, error: "Examen no encontrado." };
    }

    const belts = await prisma.belt.findMany({
      where: { disciplineId: exam.disciplineId },
      orderBy: { orderIndex: "asc" },
    });

    if (belts.length === 0) {
      return { success: true, data: [] };
    }

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { disciplineId: exam.disciplineId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    const candidateStudents = enrollments.map((e) => ({
      student: e.student,
      startDate: e.startDate,
    }));

    const existingEvaluations = await prisma.examEvaluation.findMany({
      where: { examId },
      select: { studentId: true, targetBeltId: true, isFeePaid: true },
    });

    const enrolledMap = new Map(existingEvaluations.map((e) => [e.studentId, e]));

    const result: CandidateEligibility[] = candidateStudents.map(({ student, startDate }) => {
      const currentBeltIndex = belts.findIndex((b) => b.id === student.currentBeltId);
      const targetBeltIndex = currentBeltIndex >= 0 ? Math.min(currentBeltIndex + 1, belts.length - 1) : 0;
      const currentBelt = currentBeltIndex >= 0 ? belts[currentBeltIndex] : null;
      const targetBelt = belts[targetBeltIndex];

      const classesAttended = Math.max(12, Math.floor(student.effortPoints / 10));
      const now = new Date();
      const start = new Date(startDate || student.createdAt);
      const monthsPracticed = Math.max(
        1,
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      );

      const classesReq = targetBelt.minClasses || 24;
      const monthsReq = targetBelt.minMonths || 3;

      let status: "ELIGIBLE" | "NEAR" | "INELIGIBLE" = "INELIGIBLE";
      if (classesAttended >= classesReq && monthsPracticed >= monthsReq) {
        status = "ELIGIBLE";
      } else if (classesAttended >= classesReq * 0.75 || monthsPracticed >= monthsReq * 0.75) {
        status = "NEAR";
      }

      return {
        studentId: student.id,
        studentName: student.user?.name || "Alumno Registrado",
        email: student.user?.email,
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
    });

    return { success: true, data: result };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar elegibilidad de candidatos.";
    return { success: false, error: errorMsg };
  }
}

export async function saveExamCandidatesSelectionAction(
  examId: string,
  selections: Array<{ studentId: string; targetBeltId: string; isSelected: boolean; isFeePaid?: boolean }>
): Promise<ApiResponse<boolean>> {
  try {
    const exam = await prisma.gradeExam.findUnique({
      where: { id: examId },
      select: { status: true },
    });

    if (exam?.status === "COMPLETED") {
      return {
        success: false,
        error: "No se pueden modificar los candidatos de una convocatoria finalizada y certificada.",
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
    const errorMsg = error instanceof Error ? error.message : "Error al guardar selección de candidatos.";
    return { success: false, error: errorMsg };
  }
}

export async function toggleExamEvaluationFeePaidAction(
  examId: string,
  studentId: string,
  isFeePaid: boolean
): Promise<ApiResponse<boolean>> {
  try {
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
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar pago de examen.";
    return { success: false, error: errorMsg };
  }
}

export async function updateGradeExamStatusAction(
  examId: string,
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"
): Promise<ApiResponse<boolean>> {
  try {
    if (status === "IN_PROGRESS") {
      const count = await prisma.examEvaluation.count({
        where: { examId },
      });
      if (count === 0) {
        return {
          success: false,
          error: "Debes inscribir al menos 1 alumno en la convocatoria antes de poder iniciar el examen.",
        };
      }
    }

    await prisma.gradeExam.update({
      where: { id: examId },
      data: { status },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar estado del examen.";
    return { success: false, error: errorMsg };
  }
}

export async function finalizeGradeExamAction(
  examId: string
): Promise<ApiResponse<{ promotedCount: number }>> {
  try {
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
    const errorMsg = error instanceof Error ? error.message : "Error al finalizar el examen de grado.";
    return { success: false, error: errorMsg };
  }
}

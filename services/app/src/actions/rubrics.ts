"use server";

import { prisma } from "@/lib/prisma";
import {
  evaluationTemplateSchema,
  criterionScoreSubmissionSchema,
} from "@/lib/validations/rubrics";
import type {
  ApiResponse,
  EvaluationTemplate,
  ExamCriterionScore,
  CriterionRatingType,
} from "@/types";

export async function createEvaluationTemplateAction(
  brandId: string,
  data: unknown
): Promise<ApiResponse<EvaluationTemplate>> {
  try {
    const parsed = evaluationTemplateSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de plantilla inválidos.";
      return { success: false, error: msg };
    }

    if (parsed.data.isDefault) {
      await prisma.evaluationTemplate.updateMany({
        where: { brandId },
        data: { isDefault: false },
      });
    }

    const template = await prisma.evaluationTemplate.create({
      data: {
        brandId,
        disciplineId: parsed.data.disciplineId || null,
        title: parsed.data.title,
        description: parsed.data.description,
        isDefault: parsed.data.isDefault,
        criteria: {
          create: parsed.data.criteria.map((c, idx) => ({
            name: c.name,
            category: c.category || "GENERAL",
            description: c.description,
            orderIndex: c.orderIndex || idx + 1,
          })),
        },
      },
      include: {
        criteria: {
          orderBy: { orderIndex: "asc" },
        },
        discipline: true,
      },
    });

    return { success: true, data: template as unknown as EvaluationTemplate };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear plantilla.";
    return { success: false, error: errorMsg };
  }
}

export async function updateEvaluationTemplateAction(
  templateId: string,
  data: unknown
): Promise<ApiResponse<EvaluationTemplate>> {
  try {
    const parsed = evaluationTemplateSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de plantilla inválidos.";
      return { success: false, error: msg };
    }

    const currentTemplate = await prisma.evaluationTemplate.findUnique({
      where: { id: templateId },
      select: { brandId: true },
    });

    if (!currentTemplate) {
      return { success: false, error: "Plantilla no encontrada." };
    }

    if (parsed.data.isDefault) {
      await prisma.evaluationTemplate.updateMany({
        where: { brandId: currentTemplate.brandId },
        data: { isDefault: false },
      });
    }

    await prisma.evaluationCriterion.deleteMany({
      where: { templateId },
    });

    const updatedTemplate = await prisma.evaluationTemplate.update({
      where: { id: templateId },
      data: {
        disciplineId: parsed.data.disciplineId || null,
        title: parsed.data.title,
        description: parsed.data.description,
        isDefault: parsed.data.isDefault,
        criteria: {
          create: parsed.data.criteria.map((c, idx) => ({
            name: c.name,
            category: c.category || "GENERAL",
            description: c.description,
            orderIndex: c.orderIndex || idx + 1,
          })),
        },
      },
      include: {
        criteria: {
          orderBy: { orderIndex: "asc" },
        },
        discipline: true,
      },
    });

    return { success: true, data: updatedTemplate as unknown as EvaluationTemplate };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar plantilla.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteEvaluationTemplateAction(
  templateId: string
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.evaluationTemplate.delete({
      where: { id: templateId },
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar plantilla.";
    return { success: false, error: errorMsg };
  }
}

export async function getEvaluationTemplatesByBrandAction(
  brandId: string
): Promise<ApiResponse<EvaluationTemplate[]>> {
  try {
    const templates = await prisma.evaluationTemplate.findMany({
      where: { brandId },
      include: {
        criteria: {
          orderBy: { orderIndex: "asc" },
        },
        discipline: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, data: templates as unknown as EvaluationTemplate[] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener plantillas.";
    return { success: false, error: errorMsg };
  }
}

export async function submitCriterionScoresAction(
  data: unknown
): Promise<ApiResponse<boolean>> {
  try {
    const parsed = criterionScoreSubmissionSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Evaluación por criterio inválida.";
      return { success: false, error: msg };
    }

    const { examEvaluationId, scores } = parsed.data;

    await prisma.examCriterionScore.deleteMany({
      where: { examEvaluationId },
    });

    let totalScore = 0;

    for (const item of scores) {
      let numVal = 10;
      if (item.rating === "GOOD") {
        numVal = 7.5;
      } else if (item.rating === "NEEDS_WORK") {
        numVal = 5.0;
      }
      totalScore += numVal;

      await prisma.examCriterionScore.create({
        data: {
          examEvaluationId,
          criterionId: item.criterionId,
          rating: item.rating as CriterionRatingType,
          numericScore: numVal,
          comments: item.comments,
        },
      });
    }

    const averageScore = scores.length > 0 ? totalScore / scores.length : 10;
    const finalStatus = averageScore >= 7.0 ? "PASSED" : "FAILED";

    await prisma.examEvaluation.update({
      where: { id: examEvaluationId },
      data: {
        score: Math.round(averageScore * 10) / 10,
        status: finalStatus,
      },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al guardar criterios.";
    return { success: false, error: errorMsg };
  }
}

export async function getCriterionScoresForExamEvaluationAction(
  examEvaluationId: string
): Promise<ApiResponse<ExamCriterionScore[]>> {
  try {
    const scores = await prisma.examCriterionScore.findMany({
      where: { examEvaluationId },
      include: {
        criterion: true,
      },
    });

    return { success: true, data: scores as unknown as ExamCriterionScore[] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar criterios.";
    return { success: false, error: errorMsg };
  }
}

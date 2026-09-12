"use server";

import { prisma } from "@/lib/prisma";
import { disciplineSchema, beltSchema } from "@/lib/validations/dojo";
import type { ApiResponse, Discipline, Belt } from "@/types";

import { getDisciplineTemplateById } from "@/config/discipline-templates";

export interface CreateDisciplineWithTemplateInput {
  brandId: string;
  name: string;
  code?: string;
  description?: string;
  templateId?: string;
  includeBelts?: boolean;
  includeChallenges?: boolean;
  includeRubrics?: boolean;
}

export async function createDisciplineAction(
  data: unknown
): Promise<ApiResponse<Discipline>> {
  try {
    const parsed = disciplineSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de disciplina inválidos.";
      return { success: false, error: msg };
    }

    const discipline = await prisma.discipline.create({
      data: {
        brandId: parsed.data.brandId,
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description,
      },
    });

    return { success: true, data: discipline };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear disciplina.";
    return { success: false, error: errorMsg };
  }
}

export async function createDisciplineWithTemplateAction(
  input: CreateDisciplineWithTemplateInput
): Promise<ApiResponse<Discipline>> {
  try {
    if (!input.name || !input.name.trim()) {
      return { success: false, error: "El nombre de la disciplina es obligatorio." };
    }
    if (!input.brandId) {
      return { success: false, error: "El ID de la marca es obligatorio." };
    }

    const template = input.templateId ? getDisciplineTemplateById(input.templateId) : null;

    const disciplineName = input.name.trim();
    const disciplineCode = input.code?.trim() || template?.code || null;
    const disciplineDesc = input.description?.trim() || template?.description || null;

    const discipline = await prisma.discipline.create({
      data: {
        brandId: input.brandId,
        name: disciplineName,
        code: disciplineCode,
        description: disciplineDesc,
      },
    });

    if (template) {
      // 1. Auto-create Belts
      if (input.includeBelts !== false && template.belts && template.belts.length > 0) {
        for (const b of template.belts) {
          await prisma.belt.create({
            data: {
              disciplineId: discipline.id,
              name: b.name,
              colorHex: b.colorHex,
              orderIndex: b.orderIndex,
              minClasses: b.minClasses,
              minMonths: b.minMonths,
            },
          });
        }
      }

      // 2. Auto-create Physical Challenges
      if (
        input.includeChallenges !== false &&
        template.challenges &&
        template.challenges.length > 0
      ) {
        for (const c of template.challenges) {
          await prisma.physicalChallenge.create({
            data: {
              brandId: input.brandId,
              disciplineId: discipline.id,
              title: c.title,
              description: c.description || null,
              targetReps: c.targetReps,
              metricType: c.metricType || "REPETITIONS",
              xpReward: c.xpReward,
              minAge: c.minAge || 4,
              maxAge: c.maxAge || 99,
              requiresValidation: true,
            },
          });
        }
      }

      // 3. Auto-create Evaluation Templates & Criteria
      if (input.includeRubrics !== false && template.rubrics && template.rubrics.length > 0) {
        for (const r of template.rubrics) {
          const evalTemplate = await prisma.evaluationTemplate.create({
            data: {
              brandId: input.brandId,
              disciplineId: discipline.id,
              title: r.title,
              description: r.description || null,
              isDefault: true,
            },
          });

          if (r.criteria && r.criteria.length > 0) {
            for (const crit of r.criteria) {
              await prisma.evaluationCriterion.create({
                data: {
                  templateId: evalTemplate.id,
                  name: crit.name,
                  category: crit.category || "GENERAL",
                  description: crit.description || null,
                  orderIndex: crit.orderIndex,
                },
              });
            }
          }
        }
      }
    }

    return { success: true, data: discipline };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al crear disciplina con plantilla.";
    return { success: false, error: errorMsg };
  }
}

export async function applyDisciplineTemplateAction(
  disciplineId: string,
  brandId: string,
  templateId: string,
  options?: {
    includeBelts?: boolean;
    includeChallenges?: boolean;
    includeRubrics?: boolean;
    replaceExistingBelts?: boolean;
  }
): Promise<ApiResponse<boolean>> {
  try {
    const template = getDisciplineTemplateById(templateId);
    if (!template) {
      return { success: false, error: "Plantilla de disciplina no encontrada." };
    }

    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId },
    });
    if (!discipline) {
      return { success: false, error: "Disciplina no encontrada." };
    }

    // 0. Replace existing belts if requested
    if (options?.replaceExistingBelts) {
      const existingBeltIds = await prisma.belt.findMany({
        where: { disciplineId },
        select: { id: true },
      });
      const ids = existingBeltIds.map((b) => b.id);
      if (ids.length > 0) {
        const assignedStudents = await prisma.studentProfile.count({
          where: { currentBeltId: { in: ids } },
        });

        if (assignedStudents > 0) {
          return {
            success: false,
            error: `No se pueden reemplazar los cinturones existentes porque ${assignedStudents} alumno(s) tienen asignado un cinturón de esta disciplina. Reasigna sus cinturones primero.`,
            errorKey: "dojo.cannotReplaceBeltsWithStudents",
            errorParams: { count: assignedStudents },
          };
        }

        await prisma.belt.deleteMany({
          where: { id: { in: ids } },
        });
      }
    }

    // 1. Create Belts if requested
    if (options?.includeBelts !== false && template.belts && template.belts.length > 0) {
      const existingBeltsCount = options?.replaceExistingBelts
        ? 0
        : await prisma.belt.count({
            where: { disciplineId },
          });

      for (let i = 0; i < template.belts.length; i++) {
        const b = template.belts[i];
        await prisma.belt.create({
          data: {
            disciplineId,
            name: b.name,
            colorHex: b.colorHex,
            orderIndex: existingBeltsCount + i + 1,
            minClasses: b.minClasses,
            minMonths: b.minMonths,
          },
        });
      }
    }

    // 2. Create Challenges if requested
    if (
      options?.includeChallenges !== false &&
      template.challenges &&
      template.challenges.length > 0
    ) {
      for (const c of template.challenges) {
        await prisma.physicalChallenge.create({
          data: {
            brandId,
            disciplineId,
            title: c.title,
            description: c.description || null,
            targetReps: c.targetReps,
            metricType: c.metricType || "REPETITIONS",
            xpReward: c.xpReward,
            minAge: c.minAge || 4,
            maxAge: c.maxAge || 99,
            requiresValidation: true,
          },
        });
      }
    }

    // 3. Create Rubrics if requested
    if (
      options?.includeRubrics !== false &&
      template.rubrics &&
      template.rubrics.length > 0
    ) {
      for (const r of template.rubrics) {
        const evalTemplate = await prisma.evaluationTemplate.create({
          data: {
            brandId,
            disciplineId,
            title: r.title,
            description: r.description || null,
            isDefault: true,
          },
        });

        if (r.criteria && r.criteria.length > 0) {
          for (const crit of r.criteria) {
            await prisma.evaluationCriterion.create({
              data: {
                templateId: evalTemplate.id,
                name: crit.name,
                category: crit.category || "GENERAL",
                description: crit.description || null,
                orderIndex: crit.orderIndex,
              },
            });
          }
        }
      }
    }

    return { success: true, data: true };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al aplicar plantilla a la disciplina.";
    return { success: false, error: errorMsg };
  }
}


export async function getDisciplinesByBrandAction(
  brandId: string
): Promise<ApiResponse<Discipline[]>> {
  try {
    const disciplines = await prisma.discipline.findMany({
      where: { brandId },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: disciplines };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar disciplinas.";
    return { success: false, error: errorMsg };
  }
}

export async function createBeltAction(
  data: unknown
): Promise<ApiResponse<Belt>> {
  try {
    const parsed = beltSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de cinturón inválidos.";
      return { success: false, error: msg };
    }

    const belt = await prisma.belt.create({
      data: {
        disciplineId: parsed.data.disciplineId,
        name: parsed.data.name,
        colorHex: parsed.data.colorHex,
        orderIndex: parsed.data.orderIndex,
        minClasses: parsed.data.minClasses,
        minMonths: parsed.data.minMonths,
      },
    });

    return { success: true, data: belt };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear cinturón.";
    return { success: false, error: errorMsg };
  }
}

export async function getBeltsByDisciplineAction(
  disciplineId: string
): Promise<ApiResponse<Belt[]>> {
  try {
    const belts = await prisma.belt.findMany({
      where: { disciplineId },
      orderBy: { orderIndex: "asc" },
    });

    return { success: true, data: belts };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar cinturones.";
    return { success: false, error: errorMsg };
  }
}

export async function getBeltsByDisciplinesAction(
  disciplineIds: string[]
): Promise<ApiResponse<(Belt & { discipline?: Discipline })[]>> {
  try {
    const belts = await prisma.belt.findMany({
      where: {
        disciplineId: { in: disciplineIds },
      },
      include: {
        discipline: true,
      },
      orderBy: { orderIndex: "asc" },
    });

    return { success: true, data: belts };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar cinturones.";
    return { success: false, error: errorMsg };
  }
}

export async function updateDisciplineAction(
  id: string,
  name: string,
  code?: string | null
): Promise<ApiResponse<Discipline>> {
  try {
    const discipline = await prisma.discipline.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code ? code.trim() : null,
      },
    });

    return { success: true, data: discipline };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar disciplina.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteDisciplineAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const activeEnrollments = await prisma.studentEnrollment.count({
      where: { disciplineId: id, status: "ACTIVE" },
    });

    if (activeEnrollments > 0) {
      return {
        success: false,
        error: `No se puede eliminar la disciplina porque tiene ${activeEnrollments} alumno(s) activo(s) inscritos. Te recomendamos desactivarla (marcarla Inactiva) en su lugar.`,
        errorKey: "dojo.cannotDeleteDisciplineWithStudents",
        errorParams: { count: activeEnrollments },
      };
    }

    await prisma.discipline.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar disciplina.";
    return { success: false, error: errorMsg };
  }
}

export async function updateBeltAction(
  id: string,
  name: string,
  colorHex: string,
  minClasses: number,
  minMonths: number
): Promise<ApiResponse<Belt>> {
  try {
    const belt = await prisma.belt.update({
      where: { id },
      data: {
        name: name.trim(),
        colorHex,
        minClasses,
        minMonths,
      },
    });

    return { success: true, data: belt };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar cinturón.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteBeltAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const assignedStudents = await prisma.studentProfile.count({
      where: { currentBeltId: id },
    });

    if (assignedStudents > 0) {
      return {
        success: false,
        error: `No se puede eliminar el cinturón porque está asignado a ${assignedStudents} alumno(s) activo(s). Reasigna su cinturón antes de eliminar.`,
        errorKey: "dojo.cannotDeleteBeltWithStudents",
        errorParams: { count: assignedStudents },
      };
    }

    await prisma.belt.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar cinturón.";
    return { success: false, error: errorMsg };
  }
}

export async function toggleDisciplineActiveAction(
  id: string,
  isActive: boolean
): Promise<ApiResponse<boolean>> {
  try {
    try {
      await prisma.discipline.update({
        where: { id },
        data: { isActive },
      });
    } catch {
      await prisma.$executeRawUnsafe(
        "UPDATE disciplines SET is_active = $1, updated_at = NOW() WHERE id = $2",
        isActive,
        id
      );
    }

    return { success: true, data: isActive };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al cambiar estado de la disciplina.";
    return { success: false, error: errorMsg };
  }
}

export async function reorderBeltsAction(
  beltIdsInOrder: string[]
): Promise<ApiResponse<boolean>> {
  try {
    for (let index = 0; index < beltIdsInOrder.length; index++) {
      await prisma.belt.update({
        where: { id: beltIdsInOrder[index] },
        data: { orderIndex: index + 1 },
      });
    }

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al reordenar cinturones.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteBeltsBulkAction(
  ids: string[]
): Promise<ApiResponse<boolean>> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No se seleccionaron cinturones." };
    }

    const assignedStudents = await prisma.studentProfile.count({
      where: { currentBeltId: { in: ids } },
    });

    if (assignedStudents > 0) {
      return {
        success: false,
        error: `No se pueden eliminar los cinturones seleccionados porque ${assignedStudents} alumno(s) tienen asignado uno de estos grados. Reasigna sus cinturones antes de eliminar.`,
        errorKey: "dojo.cannotDeleteBeltsBulkWithStudents",
        errorParams: { count: assignedStudents },
      };
    }

    await prisma.belt.deleteMany({
      where: { id: { in: ids } },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar cinturones seleccionados.";
    return { success: false, error: errorMsg };
  }
}

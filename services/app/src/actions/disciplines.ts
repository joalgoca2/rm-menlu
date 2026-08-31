"use server";

import { prisma } from "@/lib/prisma";
import { disciplineSchema, beltSchema } from "@/lib/validations/dojo";
import type { ApiResponse, Discipline, Belt } from "@/types";

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

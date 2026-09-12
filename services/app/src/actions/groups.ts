"use server";

import { prisma } from "@/lib/prisma";
import { studentGroupSchema, assignStudentsToGroupSchema } from "@/lib/validations/groups";
import type { ApiResponse, StudentGroupWithDetails } from "@/types";

export async function createStudentGroupAction(
  brandId: string,
  data: unknown
): Promise<ApiResponse<StudentGroupWithDetails>> {
  try {
    const parsed = studentGroupSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos del grupo inválidos.";
      return { success: false, error: msg };
    }

    const group = await prisma.studentGroup.create({
      data: {
        brandId,
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description,
        minAge: parsed.data.minAge,
        maxAge: parsed.data.maxAge,
        isActive: parsed.data.isActive,
        disciplines: parsed.data.disciplines
          ? {
              create: parsed.data.disciplines.map((d) => ({
                disciplineId: d.disciplineId,
                scheduleText: d.scheduleText,
              })),
            }
          : undefined,
      },
      include: {
        disciplines: {
          include: {
            discipline: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
                currentBelt: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: group as unknown as StudentGroupWithDetails };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear grupo.";
    return { success: false, error: errorMsg };
  }
}

export async function updateStudentGroupAction(
  groupId: string,
  data: unknown
): Promise<ApiResponse<StudentGroupWithDetails>> {
  try {
    const parsed = studentGroupSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos del grupo inválidos.";
      return { success: false, error: msg };
    }

    await prisma.groupDiscipline.deleteMany({
      where: { groupId },
    });

    const updatedGroup = await prisma.studentGroup.update({
      where: { id: groupId },
      data: {
        name: parsed.data.name,
        code: parsed.data.code,
        description: parsed.data.description,
        minAge: parsed.data.minAge,
        maxAge: parsed.data.maxAge,
        isActive: parsed.data.isActive,
        disciplines: parsed.data.disciplines
          ? {
              create: parsed.data.disciplines.map((d) => ({
                disciplineId: d.disciplineId,
                scheduleText: d.scheduleText,
              })),
            }
          : undefined,
      },
      include: {
        disciplines: {
          include: {
            discipline: true,
          },
        },
        students: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
                currentBelt: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: updatedGroup as unknown as StudentGroupWithDetails };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar grupo.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteStudentGroupAction(
  groupId: string
): Promise<ApiResponse<boolean>> {
  try {
    const studentCount = await prisma.groupStudent.count({
      where: { groupId },
    });

    if (studentCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar el grupo porque tiene ${studentCount} alumno(s) inscrito(s). Reasigna o desinscribe a sus alumnos primero.`,
        errorKey: "groups.cannotDeleteHasStudents",
        errorParams: { count: studentCount },
      };
    }

    await prisma.studentGroup.delete({
      where: { id: groupId },
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar grupo.";
    return { success: false, error: errorMsg };
  }
}

export interface GetGroupsFilter {
  brandId: string;
  search?: string;
  disciplineId?: string;
  page?: number;
  limit?: number;
}

export interface GetGroupsResponse {
  groups: StudentGroupWithDetails[];
  total: number;
  totalPages: number;
  activeCount: number;
  totalStudentsAssigned: number;
}

export async function getStudentGroupsByBrandAction(
  filterOrBrandId: string | GetGroupsFilter
): Promise<ApiResponse<GetGroupsResponse>> {
  try {
    const filter: GetGroupsFilter =
      typeof filterOrBrandId === "string"
        ? { brandId: filterOrBrandId, page: 1, limit: 100 }
        : filterOrBrandId;

    const brandId = filter.brandId;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = { brandId };

    if (filter.search && filter.search.trim()) {
      const query = filter.search.trim();
      whereCondition.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (filter.disciplineId && filter.disciplineId !== "ALL") {
      whereCondition.disciplines = {
        some: {
          disciplineId: filter.disciplineId,
        },
      };
    }

    const [groups, total, activeCount, totalStudentsAssigned] = await Promise.all([
      prisma.studentGroup.findMany({
        where: whereCondition,
        include: {
          disciplines: {
            include: {
              discipline: true,
            },
          },
          students: {
            include: {
              student: {
                include: {
                  user: {
                    select: { name: true, email: true },
                  },
                  currentBelt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.studentGroup.count({ where: whereCondition }),
      prisma.studentGroup.count({ where: { ...whereCondition, isActive: true } }),
      prisma.groupStudent.count({
        where: {
          group: { brandId },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      success: true,
      data: {
        groups: groups as unknown as StudentGroupWithDetails[],
        total,
        totalPages,
        activeCount,
        totalStudentsAssigned,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener grupos.";
    return { success: false, error: errorMsg };
  }
}

export async function assignStudentsToGroupAction(
  data: unknown
): Promise<ApiResponse<boolean>> {
  try {
    const parsed = assignStudentsToGroupSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Asignación de alumnos inválida.";
      return { success: false, error: msg };
    }

    const { groupId, studentIds } = parsed.data;

    await prisma.groupStudent.deleteMany({
      where: { groupId },
    });

    if (studentIds.length > 0) {
      await prisma.groupStudent.createMany({
        data: studentIds.map((studentId) => ({
          groupId,
          studentId,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al asignar alumnos al grupo.";
    return { success: false, error: errorMsg };
  }
}

export async function enrollStudentToGroupAction(
  groupId: string,
  studentId: string
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.groupStudent.upsert({
      where: {
        groupId_studentId: { groupId, studentId },
      },
      create: { groupId, studentId },
      update: {},
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al inscribir alumno.";
    return { success: false, error: errorMsg };
  }
}

export async function removeStudentFromGroupAction(
  groupId: string,
  studentId: string
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.groupStudent.deleteMany({
      where: { groupId, studentId },
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al desvincular alumno.";
    return { success: false, error: errorMsg };
  }
}

export async function toggleStudentGroupActiveAction(
  groupId: string,
  isActive: boolean
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.studentGroup.update({
      where: { id: groupId },
      data: { isActive },
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al cambiar estado del grupo.";
    return { success: false, error: errorMsg };
  }
}

export async function bulkDeleteStudentGroupsAction(
  groupIds: string[]
): Promise<ApiResponse<number>> {
  try {
    if (!groupIds.length) return { success: true, data: 0 };

    const groupsWithStudents = await prisma.groupStudent.groupBy({
      by: ["groupId"],
      where: { groupId: { in: groupIds } },
      _count: { studentId: true },
    });

    if (groupsWithStudents.length > 0) {
      const totalStudentsCount = groupsWithStudents.reduce(
        (acc, curr) => acc + curr._count.studentId,
        0
      );
      return {
        success: false,
        error: `No se pueden eliminar los grupos seleccionados porque ${groupsWithStudents.length} grupo(s) tienen ${totalStudentsCount} alumno(s) inscrito(s). Reasigna o desinscribe a sus alumnos primero.`,
        errorKey: "groups.cannotBulkDeleteHasStudents",
        errorParams: {
          groupsCount: groupsWithStudents.length,
          studentsCount: totalStudentsCount,
        },
      };
    }

    const res = await prisma.studentGroup.deleteMany({
      where: { id: { in: groupIds } },
    });
    return { success: true, data: res.count };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar grupos en lote.";
    return { success: false, error: errorMsg };
  }
}

export async function bulkToggleStudentGroupsActiveAction(
  groupIds: string[],
  isActive: boolean
): Promise<ApiResponse<number>> {
  try {
    if (!groupIds.length) return { success: true, data: 0 };
    const res = await prisma.studentGroup.updateMany({
      where: { id: { in: groupIds } },
      data: { isActive },
    });
    return { success: true, data: res.count };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al cambiar estado en lote.";
    return { success: false, error: errorMsg };
  }
}

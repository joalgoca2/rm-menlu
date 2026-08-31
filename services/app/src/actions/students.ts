"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createStudentSchema, updateStudentSchema } from "@/lib/validations/students";
import type { ApiResponse, StudentWithDetails, StudentExpediente } from "@/types";

export interface GetStudentsFilter {
  brandId?: string;
  search?: string;
  disciplineId?: string;
  page?: number;
  limit?: number;
}

export interface GetStudentsResponse {
  students: StudentWithDetails[];
  total: number;
  totalPages: number;
  activeCount: number;
  totalXpPoints: number;
}

export async function getStudentsAction(
  filter: GetStudentsFilter
): Promise<ApiResponse<GetStudentsResponse>> {
  try {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 10));
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = {};

    if (filter.brandId && filter.brandId !== "ALL") {
      whereCondition.brandId = filter.brandId;
    }

    if (filter.search && filter.search.trim()) {
      const query = filter.search.trim();
      whereCondition.OR = [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
        { emergencyContact: { contains: query, mode: "insensitive" } },
      ];
    }

    if (filter.disciplineId && filter.disciplineId !== "ALL") {
      whereCondition.enrollments = {
        some: {
          disciplineId: filter.disciplineId,
          status: "ACTIVE",
        },
      };
    }

    const [students, total, activeCount, aggregateXp] = await Promise.all([
      prisma.studentProfile.findMany({
        where: whereCondition,
        include: {
          user: true,
          currentBelt: true,
          parent: {
            include: {
              user: true,
            },
          },
          enrollments: {
            include: {
              discipline: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.studentProfile.count({ where: whereCondition }),
      prisma.studentProfile.count({
        where: { ...whereCondition, user: { isActive: true } },
      }),
      prisma.studentProfile.aggregate({
        where: whereCondition,
        _sum: { effortPoints: true },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const totalXpPoints = aggregateXp._sum.effortPoints || 0;

    return {
      success: true,
      data: {
        students: students as StudentWithDetails[],
        total,
        totalPages,
        activeCount,
        totalXpPoints,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al consultar alumnos.";
    return { success: false, error: msg };
  }
}

export async function createStudentAction(
  data: unknown
): Promise<ApiResponse<StudentWithDetails>> {
  try {
    const parsed = createStudentSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de alumno inválidos.";
      return { success: false, error: msg };
    }

    const {
      brandId,
      name,
      email,
      password,
      birthDate,
      emergencyContact,
      idNumber,
      nationality,
      healthInsuranceProvider,
      healthInsurancePolicyNumber,
      medicalConditions,
      medications,
      disciplineIds,
      beltId,
      parentName,
      parentEmail,
      parentPhone,
      image,
    } = parsed.data;

    // Check duplicate email for user account
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "El correo electrónico ya está registrado en el sistema.",
      };
    }

    // Default password if not provided
    const plainPassword = password || "Menlu2026!";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Optional Parent Profile logic
    let parentProfileId: string | null = null;
    if (parentEmail && parentEmail.trim()) {
      const existingParentUser = await prisma.user.findUnique({
        where: { email: parentEmail.trim() },
        include: { parentProfile: true },
      });

      if (existingParentUser?.parentProfile) {
        parentProfileId = existingParentUser.parentProfile.id;
      } else {
        const newParentUser = await prisma.user.create({
          data: {
            name: parentName || "Tutor / Guardián",
            email: parentEmail.trim(),
            password: hashedPassword,
            brandId: brandId === "ALL" ? "seed-brand-general" : brandId,
            isActive: true,
            parentProfile: {
              create: {
                phoneNumber: parentPhone,
              },
            },
          },
          include: { parentProfile: true },
        });
        parentProfileId = newParentUser.parentProfile?.id || null;
      }
    }

    // Create User & Student Profile inside Transaction
    const brandToUse = brandId === "ALL" ? "seed-brand-general" : brandId;

    const studentUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        brandId: brandToUse,
        isActive: true,
        image: image || null,
        studentProfile: {
          create: {
            brandId: brandToUse,
            parentId: parentProfileId,
            birthDate: birthDate ? new Date(birthDate) : null,
            emergencyContact: emergencyContact || null,
            idNumber: idNumber || null,
            nationality: nationality || null,
            healthInsuranceProvider: healthInsuranceProvider || null,
            healthInsurancePolicyNumber: healthInsurancePolicyNumber || null,
            medicalConditions: medicalConditions || null,
            medications: medications || null,
            effortPoints: 0,
            currentStreak: 0,
            currentBeltId: beltId || null,
            enrollments: {
              create: disciplineIds.map((discId) => ({
                disciplineId: discId,
                status: "ACTIVE",
              })),
            },
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            user: true,
            currentBelt: true,
            parent: { include: { user: true } },
            enrollments: { include: { discipline: true } },
          },
        },
      },
    });

    if (!studentUser.studentProfile) {
      return { success: false, error: "Error al crear perfil de alumno." };
    }

    const createdProfile = studentUser.studentProfile;
    return {
      success: true,
      data: {
        ...createdProfile,
        user: studentUser,
        enrollments: createdProfile.enrollments,
      },
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar alumno.";
    return { success: false, error: errorMsg };
  }
}

export async function updateStudentAction(
  data: unknown
): Promise<ApiResponse<boolean>> {
  try {
    const parsed = updateStudentSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de edición inválidos.";
      return { success: false, error: msg };
    }

    const {
      studentId,
      name,
      email,
      birthDate,
      emergencyContact,
      idNumber,
      nationality,
      healthInsuranceProvider,
      healthInsurancePolicyNumber,
      medicalConditions,
      medications,
      beltId,
      disciplineIds,
      effortPoints,
      currentStreak,
      shieldsAvailable,
      parentName,
      parentEmail,
      parentPhone,
      image,
    } = parsed.data;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true, parent: { include: { user: true } } },
    });

    if (!student) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }

    // Update User Name/Email/Image
    const userDataToUpdate: { name: string; email: string; image?: string | null } = { name, email };
    if (image !== undefined) {
      userDataToUpdate.image = image || null;
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: userDataToUpdate,
    });

    // Parent Profile Update/Creation logic
    let parentIdToSet = student.parentId;
    if (parentEmail && parentEmail.trim()) {
      if (student.parent) {
        await prisma.user.update({
          where: { id: student.parent.userId },
          data: { name: parentName || "Tutor Responsable", email: parentEmail.trim() },
        });
        if (student.parent.id) {
          await prisma.parentProfile.update({
            where: { id: student.parent.id },
            data: { phoneNumber: parentPhone || null },
          });
        }
      } else {
        const hashedPassword = await bcrypt.hash("Menlu2026!", 10);
        const newParentUser = await prisma.user.create({
          data: {
            name: parentName || "Tutor Responsable",
            email: parentEmail.trim(),
            password: hashedPassword,
            brandId: student.brandId,
            parentProfile: {
              create: { phoneNumber: parentPhone || null },
            },
          },
          include: { parentProfile: true },
        });
        parentIdToSet = newParentUser.parentProfile?.id || null;
      }
    }

    // Update Student Profile
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        birthDate: birthDate ? new Date(birthDate) : null,
        emergencyContact: emergencyContact || null,
        idNumber: idNumber || null,
        nationality: nationality || null,
        healthInsuranceProvider: healthInsuranceProvider || null,
        healthInsurancePolicyNumber: healthInsurancePolicyNumber || null,
        medicalConditions: medicalConditions || null,
        medications: medications || null,
        currentBeltId: beltId || null,
        parentId: parentIdToSet,
        effortPoints: effortPoints !== undefined ? effortPoints : student.effortPoints,
        currentStreak: currentStreak !== undefined ? currentStreak : student.currentStreak,
        shieldsAvailable: shieldsAvailable !== undefined ? shieldsAvailable : student.shieldsAvailable,
      },
    });

    // Sync Multi-Discipline Enrollments
    if (disciplineIds) {
      await prisma.studentEnrollment.deleteMany({
        where: {
          studentId,
          disciplineId: { notIn: disciplineIds },
        },
      });

      for (const discId of disciplineIds) {
        await prisma.studentEnrollment.upsert({
          where: {
            studentId_disciplineId: {
              studentId,
              disciplineId: discId,
            },
          },
          create: {
            studentId,
            disciplineId: discId,
            status: "ACTIVE",
          },
          update: {
            status: "ACTIVE",
          },
        });
      }
    }

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al actualizar alumno.";
    return { success: false, error: msg };
  }
}

export async function deleteStudentAction(
  studentId: string
): Promise<ApiResponse<boolean>> {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Alumno no encontrado." };
    }

    await prisma.user.delete({
      where: { id: student.userId },
    });

    return { success: true, data: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al eliminar alumno.";
    return { success: false, error: msg };
  }
}

export async function bulkDeleteStudentsAction(
  studentIds: string[]
): Promise<ApiResponse<number>> {
  try {
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { userId: true },
    });

    const userIds = students.map((s) => s.userId);

    const deleted = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    return { success: true, data: deleted.count };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al eliminar alumnos masivamente.";
    return { success: false, error: msg };
  }
}

export async function toggleStudentActiveAction(
  studentId: string,
  isActive: boolean
): Promise<ApiResponse<boolean>> {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Alumno no encontrado." };
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive },
    });

    return { success: true, data: isActive };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cambiar estado del alumno.";
    return { success: false, error: msg };
  }
}

export async function bulkToggleStudentsActiveAction(
  studentIds: string[],
  isActive: boolean
): Promise<ApiResponse<number>> {
  try {
    const students = await prisma.studentProfile.findMany({
      where: { id: { in: studentIds } },
      select: { userId: true },
    });

    const userIds = students.map((s) => s.userId);

    const updated = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive },
    });

    return { success: true, data: updated.count };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cambiar estado masivo de alumnos.";
    return { success: false, error: msg };
  }
}

export async function getStudentExpedienteAction(
  studentId: string
): Promise<ApiResponse<StudentExpediente>> {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        currentBelt: true,
        parent: { include: { user: true } },
        enrollments: { include: { discipline: true } },
        challengeProgress: {
          include: { challenge: true },
          orderBy: { completedAt: "desc" },
        },
        examEvaluations: {
          include: { exam: true, targetBelt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Expediente de alumno no encontrado." };
    }

    const expediente: StudentExpediente = {
      ...(student as StudentWithDetails),
      challengeProgress: student.challengeProgress.map((cp) => ({
        id: cp.id,
        challengeTitle: cp.challenge.title,
        xpEarned: cp.xpEarned,
        completedAt: cp.completedAt,
        status: cp.status,
      })),
      examEvaluations: student.examEvaluations.map((ee) => ({
        id: ee.id,
        examTitle: ee.exam.title,
        beltTargetName: ee.targetBelt.name,
        score: ee.score,
        status: ee.status,
        certifiedAt: ee.certifiedAt,
      })),
    };

    return { success: true, data: expediente };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al consultar expediente.";
    return { success: false, error: msg };
  }
}

export async function uploadStudentPhotoAction(
  studentId: string,
  base64Data: string
): Promise<ApiResponse<{ imageUrl: string }>> {
  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Perfil de alumno no encontrado." };
    }

    // Dynamic import to prevent client bundle issues
    const { promises: fs } = await import("fs");
    const path = await import("path");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "students");
    await fs.mkdir(uploadsDir, { recursive: true });

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const buffer = matches && matches[2]
      ? Buffer.from(matches[2], "base64")
      : Buffer.from(base64Data, "base64");

    const filePath = path.join(uploadsDir, `${studentId}.jpg`);
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/students/${studentId}.jpg?v=${Date.now()}`;

    await prisma.user.update({
      where: { id: student.userId },
      data: { image: imageUrl },
    });

    return { success: true, data: { imageUrl } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al subir fotografía.";
    return { success: false, error: msg };
  }
}

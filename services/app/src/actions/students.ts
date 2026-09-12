"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  createStudentSchema,
  updateStudentSchema,
  createStudentUserAccountSchema,
} from "@/lib/validations/students";
import { parseCSV, generateCSV } from "@/lib/csv";
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
  minorsCount: number;
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
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { emergencyContact: { contains: query, mode: "insensitive" } },
        { idNumber: { contains: query, mode: "insensitive" } },
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

    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    const [students, total, activeCount, minorsCount, aggregateXp] = await Promise.all([
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
        where: {
          ...whereCondition,
          NOT: { user: { isActive: false } },
        },
      }),
      prisma.studentProfile.count({
        where: {
          ...whereCondition,
          birthDate: {
            gt: eighteenYearsAgo,
          },
        },
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
        minorsCount,
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
      firstName,
      lastName,
      email,
      password,
      createUserAccount,
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

    const brandToUse = brandId === "ALL" ? "seed-brand-general" : brandId;
    const targetBrand = await prisma.brand.findUnique({
      where: { id: brandToUse },
      select: { locale: true, timezone: true },
    });
    const brandLocale = targetBrand?.locale || "es";
    const brandTimezone = targetBrand?.timezone || "UTC";

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
        const parentHashedPassword = await bcrypt.hash("Menlu2026!", 10);
        const newParentUser = await prisma.user.create({
          data: {
            name: parentName || "Tutor / Guardián",
            email: parentEmail.trim(),
            password: parentHashedPassword,
            brandId: brandToUse,
            locale: brandLocale,
            timezone: brandTimezone,
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

    const shouldCreateUser = Boolean(createUserAccount && email && email.trim());

    if (shouldCreateUser && email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.trim() },
      });

      if (existingUser) {
        return {
          success: false,
          error: "El correo electrónico ya está registrado en el sistema.",
        };
      }

      const plainPassword = password || "Menlu2026!";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const studentUser = await prisma.user.create({
        data: {
          name,
          email: email.trim(),
          password: hashedPassword,
          brandId: brandToUse,
          locale: brandLocale,
          timezone: brandTimezone,
          isActive: true,
          image: image || null,
          studentProfile: {
            create: {
              brandId: brandToUse,
              parentId: parentProfileId,
              firstName: firstName || name.split(" ")[0] || name,
              lastName: lastName || name.split(" ").slice(1).join(" ") || "",
              email: email.trim(),
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

      return {
        success: true,
        data: {
          ...studentUser.studentProfile,
          user: studentUser,
          enrollments: studentUser.studentProfile.enrollments,
        } as StudentWithDetails,
      };
    }

    // Direct Student Profile creation without User account
    const createdProfile = await prisma.studentProfile.create({
      data: {
        brandId: brandToUse,
        parentId: parentProfileId,
        firstName: firstName || name.split(" ")[0] || name,
        lastName: lastName || name.split(" ").slice(1).join(" ") || "",
        email: email ? email.trim() : null,
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
      include: {
        user: true,
        currentBelt: true,
        parent: { include: { user: true } },
        enrollments: { include: { discipline: true } },
      },
    });

    if (image && image.trim()) {
      await uploadStudentPhotoAction(createdProfile.id, image);
    }

    return {
      success: true,
      data: createdProfile as StudentWithDetails,
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

    // Update User Name/Email/Image if user account exists
    const userDataToUpdate: {
      name: string;
      email: string;
      image?: string | null;
    } = {
      name,
      email: email ? email.trim() : "",
    };
    if (image !== undefined) {
      userDataToUpdate.image = image || null;
    }

    if (student.userId) {
      await prisma.user.update({
        where: { id: student.userId },
        data: userDataToUpdate,
      });
    }

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || "";

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
        firstName,
        lastName,
        email: email ? email.trim() : null,
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
        effortPoints:
          effortPoints !== undefined ? effortPoints : student.effortPoints,
        currentStreak:
          currentStreak !== undefined ? currentStreak : student.currentStreak,
        shieldsAvailable:
          shieldsAvailable !== undefined ? shieldsAvailable : student.shieldsAvailable,
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

    try {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: { photoUrl: imageUrl },
      });

      if (student.userId) {
        await prisma.user.update({
          where: { id: student.userId },
          data: { image: imageUrl },
        });
      }
    } catch (dbErr) {
      console.warn("Notice: DB update skipped or column photo_url pending in schema:", dbErr);
    }

    return { success: true, data: { imageUrl } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al subir fotografía.";
    return { success: false, error: msg };
  }
}

export async function createStudentUserAccountAction(
  data: unknown
): Promise<ApiResponse<StudentWithDetails>> {
  try {
    const parsed = createStudentUserAccountSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de usuario inválidos.";
      return { success: false, error: msg };
    }

    const { studentId, email, password } = parsed.data;

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return { success: false, error: "Alumno no encontrado." };
    }

    if (student.userId || student.user) {
      return {
        success: false,
        error: "El alumno ya cuenta con un usuario de acceso registrado.",
      };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      return {
        success: false,
        error: "El correo electrónico ya está en uso por otra cuenta.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName =
      `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Alumno";

    const brand = await prisma.brand.findUnique({
      where: { id: student.brandId },
      select: { locale: true, timezone: true },
    });

    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email: email.trim(),
        password: hashedPassword,
        brandId: student.brandId,
        locale: brand?.locale || "es",
        timezone: brand?.timezone || "UTC",
        isActive: true,
      },
    });

    const updatedStudent = await prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        userId: newUser.id,
        email: email.trim(),
      },
      include: {
        user: true,
        currentBelt: true,
        parent: { include: { user: true } },
        enrollments: { include: { discipline: true } },
      },
    });

    return {
      success: true,
      data: updatedStudent as StudentWithDetails,
    };
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : "Error al generar la cuenta de usuario.";
    return { success: false, error: msg };
  }
}

export async function importStudentsFromCSVAction(
  brandId: string,
  csvContent: string
): Promise<ApiResponse<string>> {
  try {
    if (!brandId) {
      return { success: false, error: "ID de marca/dojo no especificado." };
    }

    const brandToUse = brandId === "ALL" ? "seed-brand-general" : brandId;

    const { data: rawData, delimiter, warning } = parseCSV(csvContent);
    if (!delimiter || warning) {
      return {
        success: false,
        error:
          warning ||
          "No se detectó ningún carácter de separación válido (, ; |) en el archivo.",
      };
    }

    const results: Record<string, string>[] = [];

    for (const row of rawData) {
      const nameRaw = row.nombre || row.name || row.fullname || "";
      const firstName = row.primer_nombre || row.firstname || nameRaw.split(" ")[0] || "";
      const lastName =
        row.apellido ||
        row.lastname ||
        nameRaw.split(" ").slice(1).join(" ") ||
        "";
      const fullName = `${firstName} ${lastName}`.trim() || nameRaw.trim();

      if (!fullName) {
        results.push({
          ...row,
          estado: "ERROR",
          detalle: "Falta el nombre obligatorio del alumno",
        });
        continue;
      }

      let birthDate: Date | null = null;
      const fechaRaw = row.fecha_nacimiento || row.birthdate;
      if (fechaRaw && fechaRaw.trim()) {
        const parts = fechaRaw.trim().split("/");
        if (parts.length === 3) {
          const [dayStr, monthStr, yearStr] = parts;
          const parsedDay = parseInt(dayStr, 10);
          const parsedMonth = parseInt(monthStr, 10) - 1;
          const parsedYear = parseInt(yearStr, 10);
          if (!isNaN(parsedDay) && !isNaN(parsedMonth) && !isNaN(parsedYear)) {
            birthDate = new Date(Date.UTC(parsedYear, parsedMonth, parsedDay));
          }
        } else {
          const parsed = new Date(fechaRaw.trim());
          if (!isNaN(parsed.getTime())) {
            birthDate = parsed;
          }
        }
      }

      const nationality = row.nacionalidad || row.nationality || null;
      const idNumber = row.documento_identidad || row.idnumber || row.cedula || null;
      const emergencyContact = row.emergencia_telefono || row.telefono_emergencia || row.phone || null;
      const parentName = row.tutor_nombre || row.tutor || row.guardian || null;
      const parentEmail = row.tutor_email || row.correo_tutor || null;
      const parentPhone = row.tutor_telefono || row.telefono_tutor || null;

      try {
        let parentProfileId: string | null = null;
        if (parentEmail && parentEmail.trim()) {
          const existingParentUser = await prisma.user.findUnique({
            where: { email: parentEmail.trim() },
            include: { parentProfile: true },
          });

          if (existingParentUser?.parentProfile) {
            parentProfileId = existingParentUser.parentProfile.id;
          } else {
            const parentHashedPassword = await bcrypt.hash("Menlu2026!", 10);
            const newParentUser = await prisma.user.create({
              data: {
                name: parentName || "Tutor / Guardián",
                email: parentEmail.trim(),
                password: parentHashedPassword,
                brandId: brandToUse,
                locale: brandLocale,
                timezone: brandTimezone,
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

        let existingStudent = null;
        if (idNumber) {
          existingStudent = await prisma.studentProfile.findFirst({
            where: { idNumber, brandId: brandToUse },
          });
        }
        if (!existingStudent && firstName && lastName) {
          existingStudent = await prisma.studentProfile.findFirst({
            where: {
              brandId: brandToUse,
              firstName: { equals: firstName, mode: "insensitive" },
              lastName: { equals: lastName, mode: "insensitive" },
            },
          });
        }

        if (existingStudent) {
          await prisma.studentProfile.update({
            where: { id: existingStudent.id },
            data: {
              firstName: firstName || existingStudent.firstName,
              lastName: lastName || existingStudent.lastName,
              birthDate: birthDate || existingStudent.birthDate,
              nationality: nationality || existingStudent.nationality,
              emergencyContact: emergencyContact || existingStudent.emergencyContact,
              parentId: parentProfileId || existingStudent.parentId,
            },
          });

          results.push({
            ...row,
            estado: "ACTUALIZADO",
            detalle: "Expediente de alumno actualizado correctamente",
          });
        } else {
          await prisma.studentProfile.create({
            data: {
              brandId: brandToUse,
              firstName,
              lastName,
              birthDate,
              nationality,
              idNumber,
              emergencyContact,
              parentId: parentProfileId,
              effortPoints: 0,
              currentStreak: 0,
            },
          });

          results.push({
            ...row,
            estado: "CREADO",
            detalle: "Alumno registrado exitosamente sin cuenta de usuario obligatoria",
          });
        }
      } catch (rowError) {
        const errorMsg =
          rowError instanceof Error ? rowError.message : "Error procesando registro";
        results.push({
          ...row,
          estado: "ERROR",
          detalle: errorMsg,
        });
      }
    }

    const headers = [
      "nombre",
      "apellido",
      "fecha_nacimiento",
      "documento_identidad",
      "tutor_nombre",
      "tutor_email",
      "estado",
      "detalle",
    ];

    const reportCsv = generateCSV(headers, results);

    return {
      success: true,
      data: reportCsv,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Error al importar alumnos desde CSV.";
    return { success: false, error: msg };
  }
}

export async function searchStudentsAction(
  brandId: string,
  query: string
): Promise<ApiResponse<StudentProfileWithUser[]>> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const trimmed = query.trim();

    const students = await prisma.studentProfile.findMany({
      where: {
        brandId,
        OR: [
          { user: { name: { contains: trimmed, mode: "insensitive" } } },
          { user: { email: { contains: trimmed, mode: "insensitive" } } },
          { firstName: { contains: trimmed, mode: "insensitive" } },
          { lastName: { contains: trimmed, mode: "insensitive" } },
          { email: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      include: {
        user: true,
        currentBelt: true,
      },
      take: 20,
    });

    return {
      success: true,
      data: students as unknown as StudentProfileWithUser[],
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al buscar alumnos.";
    return { success: false, error: errorMsg };
  }
}


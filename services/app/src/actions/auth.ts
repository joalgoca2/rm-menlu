"use server";

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  createUserSchema,
  updateProfileSchema,
  updateUserSchema,
} from "@/lib/validations/auth";
import { emailSchema, passwordSchema } from "@/lib/validations/common";
import { auth, parseBrowser, parseDevice } from "@/auth";
import type { ApiResponse, User } from "@/types";
import { checkAndSyncBrandSubscriptionGracePeriod } from "@/actions/billing";
import { createLocalizedNotification } from "@/lib/notifications";

export interface UserWithRoles extends User {
  roles?: string[];
}

export async function getUserById(
  userId: string
): Promise<ApiResponse<User>> {
  try {
    const rawUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        brand: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!rawUser) {
      return { success: false, error: "User not found." };
    }

    if (rawUser.brandId) {
      await checkAndSyncBrandSubscriptionGracePeriod(rawUser.brandId, rawUser.id);
    }

    const isSuperAdmin = rawUser.roles.some((r) => r.role.name === "SUPER_ADMIN");

    const user: User = {
      id: rawUser.id,
      name: rawUser.name,
      email: rawUser.email,
      image: rawUser.image,
      isActive: rawUser.isActive,
      bio: rawUser.bio,
      locale: rawUser.locale,
      timezone: rawUser.timezone,
      brandId: isSuperAdmin ? null : rawUser.brandId,
      brand: isSuperAdmin ? null : rawUser.brand,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    };

    return { success: true, data: user };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user.";
    return { success: false, error: message };
  }
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  brandId?: string;
}): Promise<
  ApiResponse<{
    users: UserWithRoles[];
    total: number;
    totalPages: number;
    activeCount: number;
    adminsCount: number;
  }>
> {
  try {
    const session = await auth();
    const callerRoles = session?.user?.roles ?? [];
    const isCallerSuperAdmin = callerRoles.includes("SUPER_ADMIN");

    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(50, Math.max(1, params?.limit ?? 10));
    const skip = (page - 1) * limit;

    const andConditions: Record<string, unknown>[] = [];

    // If caller is NOT a SuperAdmin, exclude users with SUPER_ADMIN role
    if (!isCallerSuperAdmin) {
      andConditions.push({
        roles: {
          none: {
            role: {
              name: "SUPER_ADMIN",
            },
          },
        },
      });
    }

    if (params?.brandId && params.brandId !== "ALL") {
      if (isCallerSuperAdmin) {
        andConditions.push({
          OR: [
            { brandId: params.brandId },
            { roles: { some: { role: { name: "SUPER_ADMIN" } } } },
          ],
        });
      } else {
        andConditions.push({ brandId: params.brandId });
      }
    }

    if (params?.search) {
      andConditions.push({
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
        ],
      });
    }

    if (params?.role) {
      andConditions.push({
        roles: {
          some: {
            role: {
              name: params.role,
            },
          },
        },
      });
    }

    const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

    // Ensure DB records for SUPER_ADMIN have brandId set to null
    await prisma.user.updateMany({
      where: {
        roles: {
          some: {
            role: {
              name: "SUPER_ADMIN",
            },
          },
        },
        brandId: { not: null },
      },
      data: { brandId: null },
    });

    const [total, activeCount, adminsCount, rawUsers] = await Promise.all([
      prisma.user.count({ where: whereCondition }),
      prisma.user.count({
        where: {
          ...whereCondition,
          isActive: true,
        },
      }),
      prisma.user.count({
        where: {
          ...whereCondition,
          roles: {
            some: {
              role: {
                name: { in: ["SUPER_ADMIN", "ADMIN"] },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: whereCondition,
        include: {
          brand: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const users: UserWithRoles[] = rawUsers.map((u) => {
      const roles = u.roles.map((r) => r.role.name);
      const isSuperAdmin = roles.includes("SUPER_ADMIN");

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        isActive: u.isActive,
        bio: u.bio,
        locale: u.locale,
        timezone: u.timezone,
        brandId: isSuperAdmin ? null : u.brandId,
        brand: isSuperAdmin ? null : u.brand,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        roles,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      success: true,
      data: { users, total, totalPages, activeCount, adminsCount },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users.";
    return { success: false, error: message };
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  roleName: "SUPER_ADMIN" | "ADMIN" | "USER";
  brandId?: string | null;
}): Promise<ApiResponse<UserWithRoles>> {
  try {
    const session = await auth();
    const callerRoles = session?.user?.roles ?? [];
    const isCallerSuperAdmin = callerRoles.includes("SUPER_ADMIN");

    const parsed = createUserSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const { name, email, password } = parsed.data;
    let { roleName, brandId } = parsed.data;

    if (roleName === "SUPER_ADMIN") {
      return {
        success: false,
        error:
          "No se permite crear usuarios con el rol SuperAdmin. Únicamente existe un SuperAdmin en el sistema.",
      };
    }

    if (!isCallerSuperAdmin) {
      if (roleName !== "USER") {
        return {
          success: false,
          error: "No tienes permisos para crear o asignar el rol de Administrador.",
        };
      }
      roleName = "USER";
      brandId = session?.user?.brandId ?? brandId;
    }

    const finalBrandId = (roleName as string) === "SUPER_ADMIN" ? null : (brandId || null);

    if ((roleName as string) !== "SUPER_ADMIN" && !finalBrandId) {
      return {
        success: false,
        error: "Debes seleccionar una marca para los roles ADMIN y USER.",
      };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        success: false,
        error: "EMAIL_EXISTS",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = await prisma.role.findUnique({ where: { name: roleName } });

    if (!role) {
      return { success: false, error: `Role ${roleName} does not exist.` };
    }

    let brandLocale = "es";
    let brandTimezone = "UTC";
    if (finalBrandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: finalBrandId },
        select: { locale: true, timezone: true },
      });
      if (brand?.locale) brandLocale = brand.locale;
      if (brand?.timezone) brandTimezone = brand.timezone;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isActive: true,
        brandId: finalBrandId,
        locale: brandLocale,
        timezone: brandTimezone,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        brand: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const user: UserWithRoles = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      image: newUser.image,
      isActive: newUser.isActive,
      bio: newUser.bio,
      locale: newUser.locale,
      timezone: newUser.timezone,
      brandId: newUser.brandId,
      brand: newUser.brand,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      roles: newUser.roles.map((r) => r.role.name),
    };

    return { success: true, data: user, message: "User created successfully." };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create user.";
    return { success: false, error: message };
  }
}

export async function updateUser(
  userId: string,
  data: {
    name: string;
    email: string;
    password?: string;
    roleName: "SUPER_ADMIN" | "ADMIN" | "USER";
    isActive: boolean;
    brandId?: string | null;
  }
): Promise<ApiResponse<UserWithRoles>> {
  try {
    const session = await auth();
    const callerRoles = session?.user?.roles ?? [];
    const isCallerSuperAdmin = callerRoles.includes("SUPER_ADMIN");

    const parsed = updateUserSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const { name, email, password } = parsed.data;
    let { roleName, isActive, brandId } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    if (!existingUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const isTargetSuperAdmin =
      existingUser.roles.some((r) => r.role.name === "SUPER_ADMIN") ||
      existingUser.email === "admin@remotemonkeys.ai";

    if (isTargetSuperAdmin) {
      roleName = "SUPER_ADMIN";
      isActive = true;
      brandId = null;
    }

    if (!isCallerSuperAdmin) {
      if (roleName !== "USER") {
        return {
          success: false,
          error: "No tienes permisos para modificar el rol a Administrador.",
        };
      }
      roleName = "USER";
      brandId = session?.user?.brandId ?? brandId;
    }

    const finalBrandId = roleName === "SUPER_ADMIN" ? null : (brandId || null);

    if (roleName !== "SUPER_ADMIN" && !finalBrandId) {
      return {
        success: false,
        error: "Debes seleccionar una marca para los roles ADMIN y USER.",
      };
    }

    if (email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailOccupied = await prisma.user.findUnique({ where: { email } });
      if (emailOccupied) {
        return { success: false, error: "EMAIL_EXISTS" };
      }
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return { success: false, error: `Role ${roleName} does not exist.` };
    }

    const updateData: Record<string, unknown> = {
      name,
      email,
      isActive,
      brandId: finalBrandId,
    };

    if (password && password.trim().length >= 8) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Reset user roles and assign new role
    await prisma.userRole.deleteMany({ where: { userId } });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        roles: {
          create: {
            roleId: role.id,
          },
        },
      },
      include: {
        brand: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const user: UserWithRoles = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      isActive: updated.isActive,
      bio: updated.bio,
      locale: updated.locale,
      timezone: updated.timezone,
      brandId: updated.brandId,
      brand: updated.brand,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      roles: updated.roles.map((r) => r.role.name),
    };

    return { success: true, data: user, message: "User updated successfully." };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update user.";
    return { success: false, error: message };
  }
}

export async function toggleUserStatus(
  userId: string
): Promise<ApiResponse<{ id: string; isActive: boolean }>> {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!existing) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const isSuperAdmin =
      existing.roles.some((r) => r.role.name === "SUPER_ADMIN") ||
      existing.email === "admin@remotemonkeys.ai";

    if (isSuperAdmin) {
      return {
        success: false,
        error: "No se permite desactivar un usuario con rol SuperAdmin del sistema.",
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !existing.isActive },
    });

    return {
      success: true,
      data: { id: updated.id, isActive: updated.isActive },
      message: `User status changed to ${updated.isActive ? "active" : "inactive"}.`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to toggle status.";
    return { success: false, error: message };
  }
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const isSuperAdmin = targetUser.roles.some((r) => r.role.name === "SUPER_ADMIN");
    if (isSuperAdmin || targetUser.email === "admin@remotemonkeys.ai") {
      return {
        success: false,
        error: "No se permite eliminar un usuario con rol SuperAdmin del sistema.",
      };
    }

    await prisma.user.delete({ where: { id: userId } });
    return { success: true, data: null, message: "Usuario eliminado correctamente." };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar usuario.";
    return { success: false, error: message };
  }
}

export async function updateUserPreferences(
  userId: string,
  data: { locale?: string; timezone?: string; name?: string; bio?: string }
): Promise<ApiResponse<User>> {
  try {
    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { success: false, error: firstError };
    }

    const validData = parsed.data;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validData.locale && { locale: validData.locale }),
        ...(validData.timezone && { timezone: validData.timezone }),
        ...(validData.name && { name: validData.name }),
        ...(validData.bio !== undefined && { bio: validData.bio }),
      },
      include: { brand: true },
    });

    const user: User = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      isActive: updated.isActive,
      bio: updated.bio,
      locale: updated.locale,
      timezone: updated.timezone,
      brandId: updated.brandId,
      brand: updated.brand,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };

    return { success: true, data: user };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update user preferences.";
    return { success: false, error: message };
  }
}

export async function requestPasswordReset(
  email: string
): Promise<ApiResponse<null>> {
  try {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) {
      return {
        success: false,
        error: parsedEmail.error.issues[0]?.message ?? "Invalid email.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: parsedEmail.data },
    });

    if (!user) {
      return {
        success: true,
        data: null,
        message: "If the email exists, a reset link has been sent.",
      };
    }

    const token = randomUUID();
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.create({
      data: {
        identifier: parsedEmail.data,
        token,
        expires,
      },
    });

    await sendPasswordResetEmail(parsedEmail.data, token);

    return {
      success: true,
      data: null,
      message: "If the email exists, a reset link has been sent.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to process password reset.";
    return { success: false, error: message };
  }
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  try {
    const parsedPassword = passwordSchema.safeParse(newPassword);
    if (!parsedPassword.success) {
      return {
        success: false,
        error: parsedPassword.error.issues[0]?.message ?? "Invalid password.",
      };
    }

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: "Invalid or expired token." };
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return { success: false, error: "Token has expired." };
    }

    const hashedPassword = await bcrypt.hash(parsedPassword.data, 10);

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return {
      success: true,
      data: null,
      message: "Password reset successful.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to reset password.";
    return { success: false, error: message };
  }
}

export async function changePassword(
  userId: string,
  data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }
): Promise<ApiResponse<null>> {
  try {
    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Entrada inválida.";
      return { success: false, error: firstError };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const isMatch = await bcrypt.compare(
      parsed.data.currentPassword,
      user.password
    );
    if (!isMatch) {
      return { success: false, error: "La contraseña actual es incorrecta." };
    }

    const newHashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: newHashedPassword },
    });

    return {
      success: true,
      data: null,
      message: "Contraseña actualizada exitosamente.",
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al cambiar contraseña.";
    return { success: false, error: message };
  }
}

export async function recordLoginAuditAction(
  userIdInput?: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await auth();
    const userId = session?.user?.id || userIdInput;

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRecord = await prisma.loginHistory.findFirst({
      where: {
        userId,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (recentRecord) {
      return { success: true, data: true };
    }

    const userAgent = "Unknown Device";
    const ip = "127.0.0.1";

    const browser = parseBrowser(userAgent);
    const device = parseDevice(userAgent);

    await prisma.loginHistory.create({
      data: {
        userId,
        userAgent,
        ip,
        browser,
        device,
      },
    });

    await createLocalizedNotification({
      userId,
      type: "LOGIN_SUCCESS",
      data: { browser, device, ip },
    });

    return { success: true, data: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Audit error";
    return { success: false, error: msg };
  }
}

export async function bulkToggleUserStatusAction(
  userIds: string[],
  targetActiveStatus: boolean
): Promise<ApiResponse<{ updatedCount: number }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado." };
    }

    const callerRoles = session.user.roles ?? [];
    const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
    const isBrandAdmin = callerRoles.includes("ADMIN");

    if (!isSuperAdmin && !isBrandAdmin) {
      return { success: false, error: "Sin permisos suficientes." };
    }

    const eligibleUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds, not: session.user.id },
        email: { not: "admin@remotemonkeys.ai" },
        ...(isSuperAdmin ? {} : { brandId: session.user.brandId }),
        roles: {
          none: {
            role: { name: "SUPER_ADMIN" },
          },
        },
      },
      select: { id: true },
    });

    const eligibleIds = eligibleUsers.map((u) => u.id);

    if (eligibleIds.length === 0) {
      return {
        success: false,
        error: "No hay usuarios elegibles para actualizar el estado.",
      };
    }

    const res = await prisma.user.updateMany({
      where: { id: { in: eligibleIds } },
      data: { isActive: targetActiveStatus },
    });

    return {
      success: true,
      data: { updatedCount: res.count },
      message: `${res.count} usuario(s) actualizado(s) correctamente.`,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error al actualizar estado masivo.";
    return { success: false, error: msg };
  }
}

export async function bulkDeleteUsersAction(
  userIds: string[]
): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado." };
    }

    const callerRoles = session.user.roles ?? [];
    const isSuperAdmin = callerRoles.includes("SUPER_ADMIN");
    const isBrandAdmin = callerRoles.includes("ADMIN");

    if (!isSuperAdmin && !isBrandAdmin) {
      return { success: false, error: "Sin permisos suficientes." };
    }

    const eligibleUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds, not: session.user.id },
        email: { not: "admin@remotemonkeys.ai" },
        ...(isSuperAdmin ? {} : { brandId: session.user.brandId }),
        roles: {
          none: {
            role: { name: "SUPER_ADMIN" },
          },
        },
      },
      select: { id: true },
    });

    const eligibleIds = eligibleUsers.map((u) => u.id);

    if (eligibleIds.length === 0) {
      return {
        success: false,
        error: "No hay usuarios elegibles para eliminar.",
      };
    }

    const res = await prisma.user.deleteMany({
      where: { id: { in: eligibleIds } },
    });

    return {
      success: true,
      data: { deletedCount: res.count },
      message: `${res.count} usuario(s) eliminado(s) correctamente.`,
    };
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Error al eliminar usuarios masivamente.";
    return { success: false, error: msg };
  }
}

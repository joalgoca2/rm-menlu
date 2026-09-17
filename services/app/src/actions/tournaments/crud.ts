"use server";

import { prisma } from "@/lib/prisma";
import { resolveTenantBrand } from "@/lib/tenant";
import { tournamentSchema } from "@/lib/validations/dojo";
import type { ApiResponse, Tournament, TournamentCategory } from "@/types";

// --- TOURNAMENT CRUD ACTIONS ---

export async function createTournamentAction(
  data: unknown
): Promise<ApiResponse<Tournament>> {
  try {
    const parsed = tournamentSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de torneo inválidos.";
      return { success: false, error: msg };
    }

    const tenant = await resolveTenantBrand(parsed.data.brandId, { allowAll: false });
    const targetBrandId = tenant.effectiveBrandId || parsed.data.brandId;

    const tournament = await prisma.tournament.create({
      data: {
        brandId: targetBrandId,
        disciplineId: parsed.data.disciplineId,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        city: parsed.data.city,
        country: parsed.data.country,
        googleMapsUrl: parsed.data.googleMapsUrl,
        tournamentDate: new Date(parsed.data.tournamentDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        feeAmount: parsed.data.feeAmount || 0,
        currency: parsed.data.currency || "MXN",
        status: "DRAFT",
      },
    });

    return { success: true, data: tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear torneo.";
    return { success: false, error: errorMsg };
  }
}

export interface GetTournamentsFilter {
  brandId: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface GetTournamentsResponse {
  tournaments: (Tournament & {
    categories?: TournamentCategory[];
    participants?: { id: string }[];
  })[];
  total: number;
  totalPages: number;
}

export async function getTournamentsByBrandAction(
  filter: GetTournamentsFilter | string
): Promise<ApiResponse<GetTournamentsResponse>> {
  try {
    const requestedBrandId = typeof filter === "string" ? filter : filter.brandId;
    const search = typeof filter === "object" ? filter.search : undefined;
    const status = typeof filter === "object" ? filter.status : undefined;
    const page = Math.max(1, typeof filter === "object" ? filter.page || 1 : 1);
    const limit = Math.min(
      100,
      Math.max(1, typeof filter === "object" ? filter.limit || 10 : 10)
    );
    const skip = (page - 1) * limit;

    const tenant = await resolveTenantBrand(requestedBrandId, { allowAll: true });
    const whereCondition: Record<string, unknown> = {};

    if (tenant.effectiveBrandId) {
      whereCondition.brandId = tenant.effectiveBrandId;
    } else if (requestedBrandId && requestedBrandId !== "ALL") {
      whereCondition.brandId = requestedBrandId;
    }

    if (status && status !== "ALL") {
      whereCondition.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereCondition.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where: whereCondition,
        include: {
          categories: true,
          participants: {
            select: { id: true },
          },
        },
        orderBy: { tournamentDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      success: true,
      data: {
        tournaments: tournaments as unknown as GetTournamentsResponse["tournaments"],
        total,
        totalPages,
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al consultar torneos.";
    return { success: false, error: errorMsg };
  }
}

export async function getTournamentByIdAction(
  id: string
): Promise<ApiResponse<Tournament>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            currency: true,
          },
        },
        categories: {
          include: {
            matches: true,
          },
        },
      },
    });

    if (!tournament) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para acceder a este torneo." };
    }

    return { success: true, data: tournament as unknown as Tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener torneo.";
    return { success: false, error: errorMsg };
  }
}

export async function updateTournamentAction(
  id: string,
  title: string,
  tournamentDate: string,
  description?: string | null,
  location?: string | null,
  city?: string | null,
  country?: string | null,
  googleMapsUrl?: string | null,
  endDate?: string | null,
  feeAmount?: number,
  currency?: string
): Promise<ApiResponse<Tournament>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const existing = await prisma.tournament.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!existing) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && existing.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para modificar este torneo." };
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        title: title.trim(),
        tournamentDate: new Date(tournamentDate),
        endDate: endDate ? new Date(endDate) : null,
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
        city: city ? city.trim() : null,
        country: country ? country.trim() : null,
        googleMapsUrl: googleMapsUrl ? googleMapsUrl.trim() : null,
        feeAmount: feeAmount !== undefined ? feeAmount : undefined,
        currency: currency || undefined,
      },
    });

    return { success: true, data: tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar torneo.";
    return { success: false, error: errorMsg };
  }
}

export async function updateTournamentStatusAction(
  id: string,
  status: string
): Promise<ApiResponse<Tournament>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const existing = await prisma.tournament.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!existing) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && existing.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para modificar el estado de este torneo." };
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: { status },
    });

    return { success: true, data: tournament };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al actualizar estado del torneo.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteTournamentAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const existing = await prisma.tournament.findUnique({
      where: { id },
      select: { brandId: true },
    });

    if (!existing) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && existing.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para eliminar este torneo." };
    }

    await prisma.tournament.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar torneo.";
    return { success: false, error: errorMsg };
  }
}

// --- TOURNAMENT CATEGORY ACTIONS ---

export async function createTournamentCategoryAction(
  tournamentId: string,
  name: string,
  minAge?: number,
  maxAge?: number,
  gender?: string
): Promise<ApiResponse<TournamentCategory>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { brandId: true },
    });

    if (!tournament) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para agregar categorías a este torneo." };
    }

    const category = await prisma.tournamentCategory.create({
      data: {
        tournamentId,
        name: name.trim(),
        minAge: minAge || 4,
        maxAge: maxAge || 99,
        gender: gender || "MIXED",
      },
    });

    return { success: true, data: category };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear categoría.";
    return { success: false, error: errorMsg };
  }
}

export async function getCategoriesByTournamentAction(
  tournamentId: string
): Promise<ApiResponse<TournamentCategory[]>> {
  try {
    const categories = await prisma.tournamentCategory.findMany({
      where: { tournamentId },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: categories };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar categorías.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteTournamentCategoryAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const category = await prisma.tournamentCategory.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { brandId: true, status: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada." };
    }

    if (tenant.effectiveBrandId && category.tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para eliminar categorías de este torneo." };
    }

    if (
      category.tournament.status === "WEIGH_IN" ||
      category.tournament.status === "IN_PROGRESS" ||
      category.tournament.status === "COMPLETED"
    ) {
      return {
        success: false,
        error: "No se pueden eliminar categorías en la etapa de confirmación de asistencia o posterior.",
      };
    }

    await prisma.tournamentCategory.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar categoría.";
    return { success: false, error: errorMsg };
  }
}

export async function updateTournamentCategoryAction(
  id: string,
  name: string,
  minAge?: number,
  maxAge?: number,
  gender?: string
): Promise<ApiResponse<TournamentCategory>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const category = await prisma.tournamentCategory.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { brandId: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada." };
    }

    if (tenant.effectiveBrandId && category.tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para modificar categorías de este torneo." };
    }

    const updated = await prisma.tournamentCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        minAge: minAge || 4,
        maxAge: maxAge || 99,
        gender: gender || "MIXED",
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar categoría.";
    return { success: false, error: errorMsg };
  }
}

export async function cleanDesertCategoriesAction(
  tournamentId: string
): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { brandId: true, status: true },
    });

    if (!tournament) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && tournament.brandId !== tenant.effectiveBrandId) {
      return {
        success: false,
        error: "No tienes permisos para modificar categorías de este torneo.",
      };
    }

    if (
      tournament.status === "WEIGH_IN" ||
      tournament.status === "IN_PROGRESS" ||
      tournament.status === "COMPLETED"
    ) {
      return {
        success: false,
        error:
          "No se pueden eliminar categorías desiertas en la etapa de asistencia o posterior.",
      };
    }

    const categories = await prisma.tournamentCategory.findMany({
      where: { tournamentId },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    const emptyCategoryIds = categories
      .filter((cat) => cat._count.participants === 0)
      .map((cat) => cat.id);

    if (emptyCategoryIds.length === 0) {
      return { success: true, data: { deletedCount: 0 } };
    }

    await prisma.tournamentCategory.deleteMany({
      where: {
        id: { in: emptyCategoryIds },
      },
    });

    return { success: true, data: { deletedCount: emptyCategoryIds.length } };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : "Error al limpiar categorías desiertas.";
    return { success: false, error: errorMsg };
  }
}

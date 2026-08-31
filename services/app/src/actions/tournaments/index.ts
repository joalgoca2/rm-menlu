"use server";

import { prisma } from "@/lib/prisma";
import { tournamentSchema } from "@/lib/validations/dojo";
import type { ApiResponse, Tournament, TournamentCategory, TournamentMatch } from "@/types";

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

    const tournament = await prisma.tournament.create({
      data: {
        brandId: parsed.data.brandId,
        disciplineId: parsed.data.disciplineId,
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        tournamentDate: new Date(parsed.data.tournamentDate),
        status: "DRAFT",
      },
    });

    return { success: true, data: tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear torneo.";
    return { success: false, error: errorMsg };
  }
}

export async function getTournamentsByBrandAction(
  brandId: string
): Promise<ApiResponse<Tournament[]>> {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: { brandId },
      include: {
        categories: true,
      },
      orderBy: { tournamentDate: "desc" },
    });

    return { success: true, data: tournaments };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar torneos.";
    return { success: false, error: errorMsg };
  }
}

export async function getTournamentByIdAction(
  id: string
): Promise<ApiResponse<Tournament>> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
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

    return { success: true, data: tournament };
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
  location?: string | null
): Promise<ApiResponse<Tournament>> {
  try {
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        title: title.trim(),
        tournamentDate: new Date(tournamentDate),
        description: description ? description.trim() : null,
        location: location ? location.trim() : null,
      },
    });

    return { success: true, data: tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar torneo.";
    return { success: false, error: errorMsg };
  }
}

export async function deleteTournamentAction(
  id: string
): Promise<ApiResponse<boolean>> {
  try {
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
    await prisma.tournamentCategory.delete({
      where: { id },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al eliminar categoría.";
    return { success: false, error: errorMsg };
  }
}

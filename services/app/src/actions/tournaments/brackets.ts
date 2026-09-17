"use server";

import { prisma } from "@/lib/prisma";
import type { ApiResponse, Tournament } from "@/types";

/**
 * Duplicate / Copy an existing Tournament with all its categories
 */
export async function duplicateTournamentAction(
  tournamentId: string
): Promise<ApiResponse<Tournament>> {
  try {
    const original = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { categories: true },
    });

    if (!original) {
      return { success: false, error: "Torneo no encontrado." };
    }

    const nextMonth = new Date(original.tournamentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const duplicated = await prisma.tournament.create({
      data: {
        brandId: original.brandId,
        disciplineId: original.disciplineId,
        title: `Copia de ${original.title}`.slice(0, 120),
        description: original.description,
        location: original.location,
        tournamentDate: nextMonth,
        status: "DRAFT",
        categories: {
          create: original.categories.map((cat) => ({
            name: cat.name,
            minAge: cat.minAge,
            maxAge: cat.maxAge,
            gender: cat.gender,
            minWeight: cat.minWeight,
            maxWeight: cat.maxWeight,
          })),
        },
      },
      include: {
        categories: true,
      },
    });

    return { success: true, data: duplicated as unknown as Tournament };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al duplicar torneo.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Generate automatic elimination brackets for a tournament category
 */
export async function generateCategoryBracketsAction(
  categoryId: string
): Promise<ApiResponse<boolean>> {
  try {
    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: {
        participants: {
          include: { student: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Categoría no encontrada." };
    }

    // Delete existing matches for this category
    await prisma.tournamentMatch.deleteMany({
      where: { categoryId },
    });

    const participants = category.participants || [];
    if (participants.length < 2) {
      return {
        success: false,
        error: "Se requieren al menos 2 competidores para generar las llaves de combate.",
      };
    }

    // Shuffle participants for fair seeding
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Create Round 1 Matches (Pairing competitors by 2s)
    const matchesData = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      const red = shuffled[i];
      const blue = shuffled[i + 1] || null;

      matchesData.push({
        categoryId,
        roundIndex: 1,
        matchIndex: Math.floor(i / 2) + 1,
        redStudentId: red?.studentId || null,
        blueStudentId: blue?.studentId || null,
        winnerStudentId: blue ? null : red?.studentId || null, // Bye advancement if odd
        redScore: 0,
        blueScore: 0,
        status: blue ? "PENDING" : "COMPLETED",
      });
    }

    await prisma.tournamentMatch.createMany({
      data: matchesData,
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al generar llaves.";
    return { success: false, error: errorMsg };
  }
}

export const generateTournamentBracketsAction = generateCategoryBracketsAction;

/**
 * Update score and winner of a tournament match
 */
export async function updateMatchScoreAction(
  matchId: string,
  redScore: number,
  blueScore: number,
  winnerStudentId?: string | null,
  status: string = "COMPLETED"
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        redScore,
        blueScore,
        winnerStudentId: winnerStudentId || null,
        status,
      },
    });

    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar marcador.";
    return { success: false, error: errorMsg };
  }
}

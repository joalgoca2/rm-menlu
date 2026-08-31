"use server";

import { prisma } from "@/lib/prisma";
import { physicalChallengeSchema } from "@/lib/validations/dojo";
import type { ApiResponse, PhysicalChallenge, StudentChallengeProgress } from "@/types";

export async function createPhysicalChallengeAction(
  data: unknown
): Promise<ApiResponse<PhysicalChallenge>> {
  try {
    const parsed = physicalChallengeSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de reto físico inválidos.";
      return { success: false, error: msg };
    }

    const challenge = await prisma.physicalChallenge.create({
      data: {
        brandId: parsed.data.brandId,
        disciplineId: parsed.data.disciplineId,
        title: parsed.data.title,
        description: parsed.data.description,
        minAge: parsed.data.minAge,
        maxAge: parsed.data.maxAge,
        targetBeltId: parsed.data.targetBeltId,
        targetReps: parsed.data.targetReps,
        metricType: parsed.data.metricType,
        xpReward: parsed.data.xpReward,
        requiresValidation: parsed.data.requiresValidation,
      },
    });

    return { success: true, data: challenge };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al crear reto físico.";
    return { success: false, error: errorMsg };
  }
}

export async function getChallengesForStudentAction(
  brandId: string,
  studentAge?: number,
  beltId?: string
): Promise<ApiResponse<PhysicalChallenge[]>> {
  try {
    const challenges = await prisma.physicalChallenge.findMany({
      where: {
        brandId,
        AND: [
          studentAge ? { OR: [{ minAge: null }, { minAge: { lte: studentAge } }] } : {},
          studentAge ? { OR: [{ maxAge: null }, { maxAge: { gte: studentAge } }] } : {},
          beltId ? { OR: [{ targetBeltId: null }, { targetBeltId: beltId }] } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: challenges };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al obtener retos.";
    return { success: false, error: errorMsg };
  }
}

export async function submitChallengeProgressAction(
  studentId: string,
  challengeId: string,
  evidenceUrl?: string
): Promise<ApiResponse<StudentChallengeProgress>> {
  try {
    const challenge = await prisma.physicalChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return { success: false, error: "Reto físico no encontrado." };
    }

    const status = challenge.requiresValidation ? "PENDING" : "APPROVED";
    const xpEarned = challenge.requiresValidation ? 0 : challenge.xpReward;

    const progress = await prisma.studentChallengeProgress.create({
      data: {
        studentId,
        challengeId,
        status,
        xpEarned,
        evidenceUrl,
      },
    });

    if (status === "APPROVED") {
      await prisma.studentProfile.update({
        where: { id: studentId },
        data: { effortPoints: { increment: xpEarned } },
      });
    }

    return { success: true, data: progress };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar avance.";
    return { success: false, error: errorMsg };
  }
}

export async function verifyChallengeProgressAction(
  progressId: string,
  verifierUserId: string,
  approved: boolean
): Promise<ApiResponse<StudentChallengeProgress>> {
  try {
    const progress = await prisma.studentChallengeProgress.findUnique({
      where: { id: progressId },
      include: { challenge: true },
    });

    if (!progress) {
      return { success: false, error: "Registro de avance no encontrado." };
    }

    const status = approved ? "APPROVED" : "REJECTED";
    const xpEarned = approved ? progress.challenge.xpReward : 0;

    const updated = await prisma.studentChallengeProgress.update({
      where: { id: progressId },
      data: {
        status,
        xpEarned,
        verifiedAt: new Date(),
        verifiedByUserId: verifierUserId,
      },
    });

    if (approved) {
      await prisma.studentProfile.update({
        where: { id: progress.studentId },
        data: { effortPoints: { increment: xpEarned } },
      });
    }

    return { success: true, data: updated };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al verificar avance.";
    return { success: false, error: errorMsg };
  }
}

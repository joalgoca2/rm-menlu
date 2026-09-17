"use server";

import { prisma } from "@/lib/prisma";
import { resolveTenantBrand } from "@/lib/tenant";
import { externalCompetitorSchema } from "@/lib/validations/dojo";
import type { ApiResponse, TournamentParticipant } from "@/types";

/**
 * Enroll an internal Dojo student into a Tournament
 */
export async function enrollStudentParticipantAction(
  tournamentId: string,
  studentId: string,
  weightKg?: number,
  categoryId?: string,
  feeAmount: number = 0,
  paymentStatus: "PENDING" | "PAID" = "PENDING",
  paymentMethod: string = "CASH"
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        brand: true,
      },
    });

    if (!tournament) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para inscribir alumnos en este torneo." };
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        currentBelt: true,
      },
    });

    if (!student) {
      return { success: false, error: "Alumno no encontrado." };
    }

    // Check if student is already enrolled in this tournament
    const existing = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId, studentId },
    });

    if (existing) {
      return { success: false, error: "El alumno ya se encuentra inscrito en este torneo." };
    }

    // Calculate age from birthDate
    let age: number | undefined = undefined;
    if (student.birthDate) {
      const today = new Date();
      const birth = new Date(student.birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
    }

    let paymentId: string | undefined = undefined;

    const effectiveFee = feeAmount > 0 ? feeAmount : tournament.feeAmount || 0;

    // If paid upfront, record transaction in BrandCustomerPayment for financial balance
    if (paymentStatus === "PAID" && effectiveFee > 0) {
      const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
      const payment = await prisma.brandCustomerPayment.create({
        data: {
          brandId: tournament.brandId,
          studentId: student.id,
          tournamentId: tournament.id,
          customerName: studentName,
          customerEmail: student.email || null,
          concept: `Cuota Torneo: ${tournament.title} - ${studentName}`,
          amount: effectiveFee,
          currency: tournament.currency || tournament.brand?.currency || "MXN",
          status: "SUCCESS",
          gatewayProvider: paymentMethod === "CASH" ? "EFECTIVO" : (paymentMethod || "EFECTIVO"),
          notes: "Pago registrado en inscripción de torneo",
        },
      });
      paymentId = payment.id;
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        studentId,
        firstName: student.firstName || "Alumno",
        lastName: student.lastName || "",
        email: student.email,
        age,
        gender: "MIXED",
        weightKg: weightKg || null,
        dojoName: tournament.brand?.name || "Dojo Principal",
        beltName: student.currentBelt?.name || null,
        emergencyContact: student.emergencyContact,
        isExternal: false,
        isCheckedIn: false,
        paymentStatus,
        feeAmount: effectiveFee,
        paymentId,
        categoryId: categoryId || null,
      },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: participant as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al inscribir alumno.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Register an External Competitor into a Tournament
 */
export async function createExternalParticipantAction(
  tournamentId: string,
  data: unknown,
  paymentMethod: string = "CASH"
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const parsed = externalCompetitorSchema.safeParse(data);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Datos de competidor inválidos.";
      return { success: false, error: msg };
    }

    const tenant = await resolveTenantBrand(null, { allowAll: true });
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return { success: false, error: "Torneo no encontrado." };
    }

    if (tenant.effectiveBrandId && tournament.brandId !== tenant.effectiveBrandId) {
      return { success: false, error: "No tienes permisos para registrar competidores en este torneo." };
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      age,
      gender,
      weightKg,
      dojoName,
      beltName,
      emergencyContact,
      feeAmount,
      paymentStatus,
      categoryId,
    } = parsed.data;

    let paymentId: string | undefined = undefined;
    const fullName = `${firstName} ${lastName || ""}`.trim();

    // Record financial income for external competitor in BrandCustomerPayment
    if (paymentStatus === "PAID" && feeAmount > 0) {
      const externalPayer = `${fullName} (${dojoName || "Invitado Externo"})`;
      const payment = await prisma.brandCustomerPayment.create({
        data: {
          brandId: tournament.brandId,
          studentId: null,
          externalPayerName: externalPayer,
          tournamentId: tournament.id,
          customerName: fullName,
          customerEmail: email || null,
          concept: `Cuota Torneo Externo: ${tournament.title} - ${externalPayer}`,
          amount: feeAmount,
          currency: "MXN",
          status: "SUCCESS",
          gatewayProvider: paymentMethod === "CASH" ? "EFECTIVO" : (paymentMethod || "EFECTIVO"),
          notes: "Pago de competidor externo de torneo",
        },
      });
      paymentId = payment.id;
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId,
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        age: age || null,
        gender: gender || "MIXED",
        weightKg: weightKg || null,
        dojoName: dojoName || "Invitado Externo",
        beltName: beltName || null,
        emergencyContact: emergencyContact || null,
        isExternal: true,
        isCheckedIn: false,
        paymentStatus,
        feeAmount,
        paymentId,
        categoryId: categoryId || null,
      },
      include: {
        category: true,
      },
    });

    return { success: true, data: participant as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar competidor.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Get all participants of a tournament with full details
 */
export async function getTournamentParticipantsAction(
  tournamentId: string
): Promise<ApiResponse<TournamentParticipant[]>> {
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
      return { success: false, error: "No tienes permisos para acceder a los participantes de este torneo." };
    }

    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: participants as unknown as TournamentParticipant[] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al consultar participantes.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Quick Payment Action: Mark participant as PAID and create financial record
 */
export async function updateParticipantPaymentStatusAction(
  participantId: string,
  paymentStatus: "PENDING" | "PAID",
  paymentMethod: string = "CASH",
  notes?: string,
  feeAmount?: number
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const participant = await prisma.tournamentParticipant.findUnique({
      where: { id: participantId },
      include: { tournament: true, student: true },
    });

    if (!participant) {
      return { success: false, error: "Participante no encontrado." };
    }

    const finalFee = feeAmount !== undefined ? feeAmount : participant.feeAmount;
    let paymentId = participant.paymentId;

    if (paymentStatus === "PAID" && !paymentId && finalFee > 0) {
      const name = `${participant.firstName} ${participant.lastName || ""}`.trim();
      const payerName = participant.isExternal
        ? `${name} (${participant.dojoName || "Externo"})`
        : name;

      const payment = await prisma.brandCustomerPayment.create({
        data: {
          brandId: participant.tournament.brandId,
          studentId: participant.studentId || null,
          externalPayerName: participant.isExternal ? payerName : null,
          tournamentId: participant.tournamentId,
          customerName: name,
          customerEmail: participant.email || null,
          concept: `Cuota Torneo: ${participant.tournament.title} - ${payerName}`,
          amount: finalFee,
          currency: participant.tournament.currency || "MXN",
          status: "SUCCESS",
          gatewayProvider: paymentMethod === "CASH" ? "EFECTIVO" : (paymentMethod || "EFECTIVO"),
          notes: notes || "Pago registrado vía Quick Payment Modal de torneo",
        },
      });
      paymentId = payment.id;
    }

    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        paymentStatus,
        feeAmount: finalFee,
        paymentId,
      },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: updated as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al actualizar pago.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Check-in & Actual Weight Station Action
 */
export async function checkInParticipantAction(
  participantId: string,
  actualWeightKg?: number,
  isCheckedIn: boolean = true
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        isCheckedIn,
        actualWeightKg: actualWeightKg !== undefined ? actualWeightKg : undefined,
      },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: updated as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al registrar pesaje.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Award Rank Assignment Action (1st, 2nd, 3rd or Participant)
 */
export async function awardParticipantAction(
  participantId: string,
  awardRank: "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT" | null
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: { awardRank },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: updated as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al asignar premio.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete / Unenroll Participant Action
 */
export async function deleteParticipantAction(
  participantId: string
): Promise<ApiResponse<boolean>> {
  try {
    await prisma.tournamentParticipant.delete({
      where: { id: participantId },
    });
    return { success: true, data: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Error al desvincular participante.";
    return { success: false, error: errorMsg };
  }
}

/**
 * Update Category of a Participant
 */
export async function updateParticipantCategoryAction(
  participantId: string,
  categoryId: string | null
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: { categoryId },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: updated as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al actualizar categoría del participante.";
    return { success: false, error: errorMsg };
  }
}

export interface UpdateParticipantInput {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  weightKg?: number | null;
  dojoName?: string | null;
  beltName?: string | null;
  emergencyContact?: string | null;
  categoryId?: string | null;
  feeAmount?: number | null;
}

/**
 * Update full details of a Participant
 */
export async function updateParticipantDetailsAction(
  participantId: string,
  data: UpdateParticipantInput
): Promise<ApiResponse<TournamentParticipant>> {
  try {
    const updated = await prisma.tournamentParticipant.update({
      where: { id: participantId },
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName ? data.lastName.trim() : null,
        email: data.email ? data.email.trim() : null,
        phone: data.phone ? data.phone.trim() : null,
        age: data.age !== undefined && data.age !== null ? Number(data.age) : null,
        weightKg: data.weightKg !== undefined && data.weightKg !== null ? Number(data.weightKg) : null,
        dojoName: data.dojoName ? data.dojoName.trim() : null,
        beltName: data.beltName ? data.beltName.trim() : null,
        emergencyContact: data.emergencyContact ? data.emergencyContact.trim() : null,
        categoryId: data.categoryId || null,
        feeAmount: data.feeAmount !== undefined && data.feeAmount !== null ? Number(data.feeAmount) : undefined,
      },
      include: {
        student: {
          include: {
            currentBelt: true,
          },
        },
        category: true,
      },
    });

    return { success: true, data: updated as unknown as TournamentParticipant };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Error al actualizar datos del participante.";
    return { success: false, error: errorMsg };
  }
}

import type { User } from "./auth";
import type { StudentProfile, Belt, StudentEnrollment, Discipline, ParentProfile } from "./dojo";

export interface StudentProfileWithUser extends StudentProfile {
  user?: User | null;
  currentBelt?: Belt | null;
  enrollments?: (StudentEnrollment & { discipline: Discipline })[];
}

export interface StudentWithDetails extends StudentProfile {
  user?: User | null;
  currentBelt?: Belt | null;
  parent?: (ParentProfile & { user?: User | null }) | null;
  enrollments: (StudentEnrollment & { discipline: Discipline })[];
  paymentStatus?: "PAID" | "DUE_SOON" | "UNPAID";
  lastPaymentDate?: string | Date | null;
  lastPaymentAmount?: number | null;
}

export interface StudentExpedientePayment {
  id: string;
  concept: string;
  amount: number;
  currency: string;
  status: string;
  gatewayProvider?: string | null;
  description?: string | null;
  createdAt: Date | string;
}

export interface StudentExpediente extends StudentWithDetails {
  challengeProgress: {
    id: string;
    challengeTitle: string;
    xpEarned: number;
    completedAt: Date;
    status: string;
  }[];
  examEvaluations: {
    id: string;
    examTitle: string;
    beltTargetName: string;
    score?: number | null;
    status: string;
    certifiedAt?: Date | null;
  }[];
  payments?: StudentExpedientePayment[];
}

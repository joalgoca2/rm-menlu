import type { StudentProfile, User, Belt, StudentEnrollment, Discipline, ParentProfile } from "./dojo";

export interface StudentWithDetails extends StudentProfile {
  user: User;
  currentBelt?: Belt | null;
  parent?: (ParentProfile & { user?: User | null }) | null;
  enrollments: (StudentEnrollment & { discipline: Discipline })[];
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
}

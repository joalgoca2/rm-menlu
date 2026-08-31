export interface Discipline {
  id: string;
  brandId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Belt {
  id: string;
  disciplineId: string;
  name: string;
  colorHex: string;
  orderIndex: number;
  minClasses: number;
  minMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParentProfile {
  id: string;
  userId: string;
  phoneNumber?: string | null;
  emergencyContact?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile {
  id: string;
  userId: string;
  brandId: string;
  parentId?: string | null;
  birthDate?: Date | null;
  emergencyContact?: string | null;
  idNumber?: string | null;
  nationality?: string | null;
  healthInsuranceProvider?: string | null;
  healthInsurancePolicyNumber?: string | null;
  medicalConditions?: string | null;
  medications?: string | null;
  effortPoints: number;
  currentStreak: number;
  lastAttendance?: Date | null;
  shieldsAvailable: number;
  currentBeltId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  disciplineId: string;
  status: string;
  startDate: Date;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhysicalChallenge {
  id: string;
  brandId: string;
  disciplineId?: string | null;
  title: string;
  description?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  targetBeltId?: string | null;
  targetReps: number;
  metricType: string;
  xpReward: number;
  requiresValidation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentChallengeProgress {
  id: string;
  studentId: string;
  challengeId: string;
  status: string;
  xpEarned: number;
  evidenceUrl?: string | null;
  completedAt: Date;
  verifiedAt?: Date | null;
  verifiedByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeExam {
  id: string;
  brandId: string;
  disciplineId: string;
  title: string;
  examDate: Date;
  location?: string | null;
  feeAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamEvaluation {
  id: string;
  examId: string;
  studentId: string;
  targetBeltId: string;
  status: string;
  score?: number | null;
  feedback?: string | null;
  isFeePaid?: boolean;
  certifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamEvaluationWithDetails extends ExamEvaluation {
  student?: {
    id: string;
    user?: {
      name: string | null;
      email: string | null;
    } | null;
  } | null;
  targetBelt?: {
    id: string;
    name: string;
    colorHex: string;
  } | null;
}

export interface CandidateEligibility {
  studentId: string;
  studentName: string;
  email?: string | null;
  currentBeltName?: string | null;
  currentBeltColor?: string | null;
  targetBeltId: string;
  targetBeltName: string;
  targetBeltColor?: string | null;
  classesAttended: number;
  classesRequired: number;
  monthsPracticed: number;
  monthsRequired: number;
  eligibilityStatus: "ELIGIBLE" | "NEAR" | "INELIGIBLE";
  isEnrolled: boolean;
  isFeePaid: boolean;
}

export interface Tournament {
  id: string;
  brandId: string;
  disciplineId?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  tournamentDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentCategory {
  id: string;
  tournamentId: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
  gender?: string | null;
  minWeight?: number | null;
  maxWeight?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentMatch {
  id: string;
  categoryId: string;
  roundIndex: number;
  matchIndex: number;
  redStudentId?: string | null;
  blueStudentId?: string | null;
  winnerStudentId?: string | null;
  redScore: number;
  blueScore: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

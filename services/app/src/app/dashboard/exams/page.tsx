"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Award,
  Plus,
  Calendar,
  MapPin,
  CheckCircle,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  LayoutGrid,
  List,
  Users,
  DollarSign,
  Loader2,
  Sparkles,
  UserCheck,
  Printer,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { DiplomaBuilderModal } from "@/components/students/diploma-builder-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getGradeExamsByBrandAction,
  createGradeExamAction,
  updateGradeExamAction,
  deleteGradeExamAction,
  getExamEvaluationsAction,
  getExamEvaluationTemplateAction,
  saveExamEvaluationsAction,
  getDisciplineCandidatesWithEligibilityAction,
  saveExamCandidatesSelectionAction,
  updateGradeExamStatusAction,
  finalizeGradeExamAction,
  recordExamFeePaymentAction,
} from "@/actions/exams";
import { submitCriterionScoresAction } from "@/actions/rubrics";
import {
  getDisciplinesByBrandAction,
  getBeltsByDisciplineAction,
} from "@/actions/disciplines";
import { searchStudentsAction, createStudentAction } from "@/actions/students";
import type {
  GradeExam,
  Discipline,
  Belt,
  Brand,
  ExamEvaluationWithDetails,
  CandidateEligibility,
  StudentWithDetails,
  StudentProfileWithUser,
  EvaluationTemplate,
  CriterionRatingType,
} from "@/types";

interface ExtendedGradeExam extends GradeExam {
  discipline?: Discipline;
  brand?: Brand;
  minBelt?: Belt | null;
  maxBelt?: Belt | null;
  evaluations?: ExamEvaluationWithDetails[];
}

function getContrastTextColor(hexColor: string | null | undefined): string {
  if (!hexColor) return "text-zinc-950";
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165
    ? "text-zinc-950 font-extrabold"
    : "text-white font-extrabold";
}

function ExamsContent() {
  const { selectedBrandId, brands } = useBrand();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [_isPending, startTransition] = useTransition();

  const effectiveBrandId =
    selectedBrandId === "ALL"
      ? brands[0]?.id || "seed-brand-general"
      : selectedBrandId;
  const activeBrand =
    brands.find((b) => b.id === effectiveBrandId) || brands[0];
  const brandCurrency = activeBrand?.currency || "USD";

  const [exams, setExams] = useState<ExtendedGradeExam[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [disciplineBelts, setDisciplineBelts] = useState<Belt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalExamsCount, setTotalExamsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // View state: Grid Cards vs List Table
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Read server-side query params from URL
  const initialSearch = searchParams.get("search") || "";
  const initialDiscipline = searchParams.get("discipline") || "ALL";
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;

  // Local form input states
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [disciplineInput, setDisciplineInput] = useState(initialDiscipline);

  // Applied server filter states
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [appliedDiscipline, setAppliedDiscipline] = useState(initialDiscipline);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExtendedGradeExam | null>(null);
  const [deletingExam, setDeletingExam] = useState<ExtendedGradeExam | null>(null);
  const [evaluatingExam, setEvaluatingExam] = useState<ExtendedGradeExam | null>(null);

  // Candidates Manager Modal State
  const [managingCandidatesExam, setManagingCandidatesExam] =
    useState<ExtendedGradeExam | null>(null);
  const [candidatesList, setCandidatesList] = useState<CandidateEligibility[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSavingCandidates, setIsSavingCandidates] = useState(false);
  const [candidateModalTab, setCandidateModalTab] = useState<string>("enrolled");
  const [enrolledSearchFilter, setEnrolledSearchFilter] = useState<string>("");

  // Candidate Search & Quick Register State
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");
  const [candidateSearchResults, setCandidateSearchResults] = useState<
    StudentProfileWithUser[]
  >([]);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState("");
  const [quickLastName, setQuickLastName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [isQuickAddSubmitting, setIsQuickAddSubmitting] = useState(false);

  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);

  // Real Database Tatami Evaluations state
  const [evaluationsList, setEvaluationsList] = useState<ExamEvaluationWithDetails[]>([]);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isSavingEvaluations, setIsSavingEvaluations] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<EvaluationTemplate | null>(null);
  const [criterionRatingsMap, setCriterionRatingsMap] = useState<
    Record<string, Record<string, CriterionRatingType>>
  >({});
  const [rubricSearchQuery, setRubricSearchQuery] = useState("");
  const [selectedEvalStudentId, setSelectedEvalStudentId] = useState<string | null>(null);
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);
  const [isFinalizingExam, setIsFinalizingExam] = useState(false);

  // Form states for Create / Edit
  const [title, setTitle] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [minBeltId, setMinBeltId] = useState("");
  const [maxBeltId, setMaxBeltId] = useState("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [examDate, setExamDate] = useState("2026-10-15");
  const [location, setLocation] = useState("Dojo Central - Tatami Principal");
  const [feeAmount, setFeeAmount] = useState(350);

  // Quick Payment Modal state
  const [paymentModalCandidate, setPaymentModalCandidate] =
    useState<CandidateEligibility | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER" | "CARD">("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Diploma Builder Modal state
  const [isDiplomaModalOpen, setIsDiplomaModalOpen] = useState(false);
  const [diplomaStudentsList, setDiplomaStudentsList] = useState<StudentWithDetails[]>([]);
  const [diplomaDisciplineName, setDiplomaDisciplineName] = useState<string>("");

  const updateUrlParams = (newParams: Record<string, string | number | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === "" ||
        value === "ALL" ||
        (key === "page" && value === 1)
      ) {
        current.delete(key);
      } else {
        current.set(key, String(value));
      }
    });
    const search = current.toString();
    const query = search ? `?${search}` : "";
    startTransition(() => {
      router.push(`${pathname}${query}`);
    });
  };

  const fetchExams = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);

    try {
      const brandToUse =
        selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await getGradeExamsByBrandAction({
        brandId: brandToUse,
        search: appliedSearch,
        disciplineId: appliedDiscipline,
        page: currentPage,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setExams(res.data.exams as ExtendedGradeExam[]);
        setTotalExamsCount(res.data.total);
        setTotalPages(res.data.totalPages);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Error al consultar convocatorias de examen en el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBeltsForDiscipline = async (targetDisciplineId: string) => {
    if (!targetDisciplineId) {
      setDisciplineBelts([]);
      return;
    }
    try {
      const res = await getBeltsByDisciplineAction(targetDisciplineId);
      if (res.success && res.data) {
        setDisciplineBelts(res.data);
      } else {
        setDisciplineBelts([]);
      }
    } catch {
      setDisciplineBelts([]);
    }
  };

  const fetchDisciplines = async () => {
    if (!selectedBrandId) return;
    try {
      const brandToUse =
        selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const discRes = await getDisciplinesByBrandAction(brandToUse);
      if (discRes.success && discRes.data) {
        setDisciplines(discRes.data);
        if (discRes.data.length > 0 && !disciplineId) {
          const firstId = discRes.data[0].id;
          setDisciplineId(firstId);
          loadBeltsForDiscipline(firstId);
        }
      }
    } catch {
      // Silent error
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, [selectedBrandId]);

  useEffect(() => {
    fetchExams();
  }, [selectedBrandId, appliedSearch, appliedDiscipline, currentPage, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedDiscipline(disciplineInput);
    setCurrentPage(1);
    updateUrlParams({
      search: searchInput,
      discipline: disciplineInput,
      page: 1,
      limit: pageSize,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    updateUrlParams({ limit: newSize, page: 1 });
  };

  const handleOpenCandidatesManager = async (ex: ExtendedGradeExam) => {
    setManagingCandidatesExam(ex);
    setCandidateModalTab(ex.evaluations && ex.evaluations.length > 0 ? "enrolled" : "search");
    setEnrolledSearchFilter("");
    setCandidateSearchQuery("");
    setCandidateSearchResults([]);
    setIsLoadingCandidates(true);
    try {
      const res = await getDisciplineCandidatesWithEligibilityAction(ex.id);
      if (res.success && res.data) {
        setCandidatesList(res.data);
      } else {
        toast.error(res.error || "Error al cargar candidatos de la disciplina.");
        setCandidatesList([]);
      }
    } catch {
      toast.error("Error al obtener candidatos.");
      setCandidatesList([]);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleToggleCandidateFeePaid = (studentId: string) => {
    const cand = candidatesList.find((c) => c.studentId === studentId);
    if (cand && !cand.isFeePaid) {
      setPaymentModalCandidate(cand);
    } else {
      setCandidatesList((prev) =>
        prev.map((c) =>
          c.studentId === studentId ? { ...c, isFeePaid: !c.isFeePaid } : c
        )
      );
    }
  };

  const handleExecuteQuickPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalCandidate || !managingCandidatesExam) return;

    setIsProcessingPayment(true);
    try {
      const fee = managingCandidatesExam.feeAmount || 350;
      const res = await recordExamFeePaymentAction({
        examId: managingCandidatesExam.id,
        studentId: paymentModalCandidate.studentId,
        targetBeltId: paymentModalCandidate.targetBeltId,
        feeAmount: fee,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          `¡Pago Confirmado! Se registraron $${fee} ${brandCurrency} para ${paymentModalCandidate.studentName}.`
        );
        setCandidatesList((prev) =>
          prev.map((c) =>
            c.studentId === paymentModalCandidate.studentId
              ? { ...c, isFeePaid: true, isEnrolled: true }
              : c
          )
        );
        setPaymentModalCandidate(null);
        setPaymentReference("");
      } else {
        toast.error(res.error || "No se pudo registrar el pago.");
      }
    } catch {
      toast.error("Error al procesar el cobro de examen.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleToggleCandidate = (studentId: string) => {
    if (managingCandidatesExam?.status === "COMPLETED") {
      toast.warning("No se pueden modificar los candidatos de un examen finalizado.");
      return;
    }
    setCandidatesList((prev) =>
      prev.map((c) =>
        c.studentId === studentId ? { ...c, isEnrolled: !c.isEnrolled } : c
      )
    );
  };

  const handleExecuteCandidateSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!candidateSearchQuery.trim() || candidateSearchQuery.trim().length < 2) {
      toast.error("Ingresa al menos 2 caracteres para buscar.");
      return;
    }

    setIsSearchingCandidates(true);
    try {
      const res = await searchStudentsAction(
        selectedBrandId,
        candidateSearchQuery.trim()
      );
      if (res.success && res.data) {
        setCandidateSearchResults(res.data);
      } else {
        setCandidateSearchResults([]);
      }
    } catch {
      toast.error("Error al buscar alumnos en el servidor.");
    } finally {
      setIsSearchingCandidates(false);
    }
  };

  const handleConvokeStudent = (st: StudentProfileWithUser) => {
    if (!managingCandidatesExam) return;

    const currentBeltId = st.currentBeltId || "";
    const currentBeltName = st.currentBelt?.name || "Blanco / Inicial";
    const currentBeltColor = st.currentBelt?.colorHex || "#e4e4e7";

    const existingInList = candidatesList.find((c) => c.studentId === st.id);

    if (existingInList) {
      setCandidatesList((prev) =>
        prev.map((c) =>
          c.studentId === st.id ? { ...c, isEnrolled: true } : c
        )
      );
    } else {
      const targetBeltName = "Siguiente Cinturón";
      const targetBeltColor = "#f59e0b";

      const newCand: CandidateEligibility = {
        studentId: st.id,
        studentName:
          `${st.firstName || ""} ${st.lastName || ""}`.trim() ||
          st.user?.name ||
          "Alumno",
        email: st.user?.email || st.email || undefined,
        currentBeltName,
        currentBeltColor,
        targetBeltId: currentBeltId,
        targetBeltName,
        targetBeltColor,
        classesAttended: Math.max(12, Math.floor(st.effortPoints / 10)),
        classesRequired: 24,
        monthsPracticed: 3,
        monthsRequired: 3,
        eligibilityStatus: "ELIGIBLE",
        isEnrolled: true,
        isFeePaid: false,
      };

      setCandidatesList((prev) => [newCand, ...prev]);
    }

    toast.success(`Alumno "${st.firstName || st.user?.name}" convocado al examen.`);
    setCandidateModalTab("enrolled");
  };

  const handleQuickCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCandidatesExam) return;
    if (!quickFirstName.trim()) {
      toast.error("El nombre del alumno es obligatorio.");
      return;
    }

    setIsQuickAddSubmitting(true);
    try {
      const res = await createStudentAction({
        brandId: effectiveBrandId,
        firstName: quickFirstName.trim(),
        lastName: quickLastName.trim() || undefined,
        email: quickEmail.trim() || undefined,
        disciplineIds: [managingCandidatesExam.disciplineId],
      });

      if (res.success && res.data) {
        const newStudent = res.data as unknown as StudentProfileWithUser;
        handleConvokeStudent(newStudent);
        setQuickFirstName("");
        setQuickLastName("");
        setQuickEmail("");
      } else {
        toast.error(res.error || "Error al crear alumno.");
      }
    } catch {
      toast.error("Error al procesar alta rápida.");
    } finally {
      setIsQuickAddSubmitting(false);
    }
  };

  const handleSaveCandidatesSelection = async () => {
    if (!managingCandidatesExam) return;

    setIsSavingCandidates(true);
    try {
      const selections = candidatesList.map((c) => ({
        studentId: c.studentId,
        targetBeltId: c.targetBeltId,
        isSelected: c.isEnrolled,
        isFeePaid: c.isFeePaid,
      }));

      const res = await saveExamCandidatesSelectionAction(
        managingCandidatesExam.id,
        selections
      );
      if (res.success) {
        toast.success("Candidatos del examen actualizados correctamente.");
        setManagingCandidatesExam(null);
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo guardar la selección de candidatos.");
      }
    } catch {
      toast.error("Error al guardar selección de candidatos.");
    } finally {
      setIsSavingCandidates(false);
    }
  };

  const _handleStartExam = async (ex: ExtendedGradeExam) => {
    const candidateCount = ex.evaluations?.length || 0;
    if (candidateCount === 0) {
      toast.warning(
        "Debes inscribir al menos 1 alumno en la convocatoria antes de poder iniciar el examen en Tatami."
      );
      handleOpenCandidatesManager(ex);
      return;
    }

    try {
      const res = await updateGradeExamStatusAction(ex.id, "IN_PROGRESS");
      if (res.success) {
        toast.success(`Examen "${ex.title}" iniciado en Tatami.`);
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo iniciar el examen.");
      }
    } catch {
      toast.error("Error al iniciar examen.");
    }
  };

  const _handleFinalizeExam = async (ex: ExtendedGradeExam) => {
    try {
      const res = await finalizeGradeExamAction(ex.id);
      if (res.success && res.data) {
        toast.success(
          `¡Examen Concluido! ${res.data.promotedCount} alumnos fueron promovidos.`
        );
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo finalizar el examen.");
      }
    } catch {
      toast.error("Error al finalizar examen.");
    }
  };

  const handleOpenEvaluation = async (ex: ExtendedGradeExam) => {
    setEvaluatingExam(ex);
    setIsLoadingEvaluations(true);
    try {
      const res = await getExamEvaluationTemplateAction(ex.id);
      if (res.success && res.data) {
        const evalData = res.data;
        setEvaluationsList(evalData.evaluations);
        setActiveTemplate(evalData.template);
        if (evalData.evaluations.length > 0) {
          setSelectedEvalStudentId(evalData.evaluations[0].id);
        } else {
          setSelectedEvalStudentId(null);
        }

        const initialRatings: Record<string, Record<string, CriterionRatingType>> = {};
        evalData.evaluations.forEach((ev) => {
          initialRatings[ev.id] = {};
          if (ev.criterionScores && ev.criterionScores.length > 0) {
            ev.criterionScores.forEach((cs) => {
              initialRatings[ev.id][cs.criterionId] = cs.rating;
            });
          } else if (evalData.template?.criteria) {
            evalData.template.criteria.forEach((c) => {
              initialRatings[ev.id][c.id] = "EXCELLENT";
            });
          }
        });
        setCriterionRatingsMap(initialRatings);
      } else {
        toast.error(res.error || "No se pudieron obtener las evaluaciones reales.");
        setEvaluationsList([]);
        setActiveTemplate(null);
        setSelectedEvalStudentId(null);
      }
    } catch {
      toast.error("Error al consultar evaluaciones del tatami.");
      setEvaluationsList([]);
      setActiveTemplate(null);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  const handleScoreChange = (evalId: string, newScore: number) => {
    setEvaluationsList((prev) =>
      prev.map((e) =>
        e.id === evalId
          ? {
              ...e,
              score: newScore,
              status: newScore >= 7.0 ? "PASSED" : "FAILED",
            }
          : e
      )
    );
  };

  const handleCriterionRatingChange = (
    evalId: string,
    criterionId: string,
    rating: CriterionRatingType
  ) => {
    setCriterionRatingsMap((prev) => {
      const updatedEvalMap = { ...(prev[evalId] || {}), [criterionId]: rating };
      const criteriaList = activeTemplate?.criteria || [];
      if (criteriaList.length > 0) {
        let total = 0;
        criteriaList.forEach((c) => {
          const r = updatedEvalMap[c.id] || "EXCELLENT";
          if (r === "EXCELLENT") total += 10.0;
          else if (r === "GOOD") total += 7.5;
          else if (r === "NEEDS_WORK") total += 5.0;
        });
        const avg = Math.round((total / criteriaList.length) * 10) / 10;
        setEvaluationsList((prevEvals) =>
          prevEvals.map((e) =>
            e.id === evalId
              ? {
                  ...e,
                  score: avg,
                  status: avg >= 7.0 ? "PASSED" : "FAILED",
                }
              : e
          )
        );
      }
      return { ...prev, [evalId]: updatedEvalMap };
    });
  };

  const handleOpenDiplomasForExam = async (ex: ExtendedGradeExam) => {
    try {
      const res = await getExamEvaluationsAction(ex.id);
      if (res.success && res.data) {
        const dataList = res.data;
        const passedEvals = dataList.filter(
          (ev) =>
            ev.status === "PASSED" ||
            (ev.score && ev.score >= 7.0) ||
            dataList.length > 0
        );

        const mappedStudents: StudentWithDetails[] = passedEvals.map((ev) => ({
          id: ev.studentId,
          brandId: ex.brandId,
          userId: ev.studentId,
          currentBeltId: ev.targetBeltId,
          effortPoints: 100,
          currentStreak: 1,
          shieldsAvailable: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          enrollments: [],
          user: ev.student?.user
            ? {
                id: ev.studentId,
                name: ev.student.user.name || null,
                email: ev.student.user.email || null,
                image: ev.student.user.image || null,
                isActive: true,
                locale: "es",
                timezone: "UTC",
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : null,
          firstName: ev.student?.firstName || ev.student?.user?.name || "Alumno",
          lastName: ev.student?.lastName || "",
          email: ev.student?.email || ev.student?.user?.email || null,
          currentBelt: ev.targetBelt
            ? {
                ...ev.targetBelt,
                disciplineId: ex.disciplineId,
                orderIndex: 1,
                minClasses: 1,
                minMonths: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : null,
        })) as unknown as StudentWithDetails[];

        if (mappedStudents.length === 0) {
          toast.warning("No hay alumnos aprobados en esta convocatoria para generar diplomas.");
          return;
        }

        setDiplomaStudentsList(mappedStudents);
        setDiplomaDisciplineName(ex.discipline?.name || "Artes Marciales");
        setIsDiplomaModalOpen(true);
      } else {
        toast.error("No se pudieron cargar las evaluaciones para imprimir diplomas.");
      }
    } catch {
      toast.error("Error al preparar diplomas del examen.");
    }
  };

  const handleSaveEvaluations = async () => {
    if (evaluationsList.length === 0) {
      setEvaluatingExam(null);
      return;
    }

    setIsSavingEvaluations(true);
    try {
      if (evaluatingExam && evaluatingExam.status === "PLANNED") {
        await updateGradeExamStatusAction(evaluatingExam.id, "IN_PROGRESS");
      }

      if (activeTemplate?.criteria && activeTemplate.criteria.length > 0) {
        for (const ev of evaluationsList) {
          const studentRatings = criterionRatingsMap[ev.id] || {};
          const scoresPayload = activeTemplate.criteria.map((c) => ({
            criterionId: c.id,
            rating: studentRatings[c.id] || "EXCELLENT",
          }));
          await submitCriterionScoresAction({
            examEvaluationId: ev.id,
            scores: scoresPayload,
          });
        }
      }

      const payload = evaluationsList.map((e) => ({
        id: e.id,
        score: e.score ?? 8.0,
        status: e.status || (e.score && e.score >= 7.0 ? "PASSED" : "FAILED"),
        feedback: e.feedback || "",
      }));

      const res = await saveExamEvaluationsAction(payload);
      if (res.success) {
        toast.success("Evaluaciones del Tatami guardadas correctamente.");
        setEvaluatingExam(null);
        fetchExams();
      } else {
        toast.error(res.error || "No se pudieron guardar las evaluaciones.");
      }
    } catch {
      toast.error("Error al guardar las evaluaciones.");
    } finally {
      setIsSavingEvaluations(false);
    }
  };

  const handleFinalizeExamInModal = async () => {
    if (!evaluatingExam) return;
    setIsFinalizingExam(true);
    try {
      if (evaluatingExam.status !== "COMPLETED") {
        await handleSaveEvaluations();
      }
      const res = await finalizeGradeExamAction(evaluatingExam.id);
      if (res.success && res.data) {
        toast.success(
          `¡Examen Concluido! ${res.data.promotedCount} alumnos aprobados fueron promovidos de cinturón.`
        );
        setIsConfirmFinalizeOpen(false);
        setEvaluatingExam(null);
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo finalizar el examen.");
      }
    } catch {
      toast.error("Error al finalizar examen.");
    } finally {
      setIsFinalizingExam(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Ingresa el título de la convocatoria.");
      return;
    }
    if (!disciplineId) {
      toast.error("Selecciona una disciplina.");
      return;
    }

    setIsCreatingExam(true);
    try {
      const brandToUse =
        selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await createGradeExamAction({
        brandId: brandToUse,
        disciplineId,
        minBeltId: minBeltId || undefined,
        maxBeltId: maxBeltId || undefined,
        minAge: minAge !== "" ? Number(minAge) : undefined,
        maxAge: maxAge !== "" ? Number(maxAge) : undefined,
        title: title.trim(),
        examDate,
        location: location.trim(),
        feeAmount: Number(feeAmount),
        currency: brandCurrency,
      });

      if (res.success && res.data) {
        toast.success(`Convocatoria "${res.data.title}" creada exitosamente.`);
        setIsCreateModalOpen(false);
        setTitle("");
        setMinAge("");
        setMaxAge("");
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo crear la convocatoria.");
      }
    } catch {
      toast.error("Error al crear examen de grado.");
    } finally {
      setIsCreatingExam(false);
    }
  };

  const handleOpenEditModal = async (ex: ExtendedGradeExam) => {
    if (ex.status === "COMPLETED") {
      toast.error("Esta convocatoria ya fue concluida y no se puede editar.");
      return;
    }
    setEditingExam(ex);
    setMinBeltId(ex.minBeltId || "");
    setMaxBeltId(ex.maxBeltId || "");
    setMinAge(ex.minAge !== null && ex.minAge !== undefined ? ex.minAge : "");
    setMaxAge(ex.maxAge !== null && ex.maxAge !== undefined ? ex.maxAge : "");
    if (ex.disciplineId) {
      loadBeltsForDiscipline(ex.disciplineId);
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExam.title.trim()) return;

    setIsUpdatingExam(true);
    try {
      const formattedDate =
        typeof editingExam.examDate === "string"
          ? editingExam.examDate
          : new Date(editingExam.examDate).toISOString().split("T")[0];

      const res = await updateGradeExamAction(
        editingExam.id,
        editingExam.title.trim(),
        formattedDate,
        editingExam.location ? editingExam.location.trim() : "",
        editingExam.feeAmount,
        editingExam.disciplineId,
        editingExam.minBeltId || null,
        editingExam.maxBeltId || null,
        editingExam.minAge !== undefined && editingExam.minAge !== null
          ? Number(editingExam.minAge)
          : null,
        editingExam.maxAge !== undefined && editingExam.maxAge !== null
          ? Number(editingExam.maxAge)
          : null
      );

      if (res.success && res.data) {
        toast.success("Convocatoria de examen actualizada.");
        setEditingExam(null);
        fetchExams();
      } else {
        toast.error(res.error || "Error al actualizar la convocatoria.");
      }
    } catch {
      toast.error("Error al actualizar convocatoria de examen.");
    } finally {
      setIsUpdatingExam(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;

    try {
      const res = await deleteGradeExamAction(deletingExam.id);
      if (res.success) {
        toast.success(`Convocatoria "${deletingExam.title}" eliminada.`);
        setDeletingExam(null);
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo eliminar la convocatoria.");
      }
    } catch {
      toast.error("Error al eliminar la convocatoria.");
    }
  };

  const allEvaluations = exams.flatMap((ex) => ex.evaluations || []);
  const totalCandidatesCount = allEvaluations.length;
  const totalPassedCount = allEvaluations.filter(
    (e) => e.status === "PASSED" || (e.score && e.score >= 7.0)
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-amber-500" />
            {t("dojo.examsTitle", "Convocatorias y Exámenes de Grado")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t(
              "dojo.examsSub",
              "Administra promociones de cinta, requisitos de rango, rúbricas de evaluación en Tatami y diplomas."
            )}
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreateModalOpen(true);
            if (disciplines.length > 0 && !disciplineId) {
              setDisciplineId(disciplines[0].id);
              loadBeltsForDiscipline(disciplines[0].id);
            }
          }}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-xs text-xs cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1 text-zinc-950" />
          {t("dojo.createExam", "Nueva Convocatoria")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("dojo.kpiExams", "Convocatorias")}
              </p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-mono mt-0.5">
                {totalExamsCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("dojo.candidatesEnrolled", "Alumnos Convocados")}
              </p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {totalCandidatesCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("dojo.kpiPassed", "Aprobados / Promovidos")}
              </p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {totalPassedCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("dojo.kpiActiveDisciplines", "Disciplinas Activas")}
              </p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {disciplines.length}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar with Search, Discipline Select & View Switcher */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs rounded-2xl p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm h-10 flex items-center">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t(
                  "dojo.searchExamsPlaceholder",
                  "Buscar convocatoria por título o lugar..."
                )}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 box-border"
              />
            </div>

            <select
              value={disciplineInput}
              onChange={(e) => setDisciplineInput(e.target.value)}
              className="h-10 px-3 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer box-border flex items-center"
            >
              <option value="ALL">
                {t("dojo.allDisciplines", "Todas las Disciplinas")}
              </option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>

            <Button
              type="submit"
              className="h-10 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-4 cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
            >
              <Search className="h-3.5 w-3.5 mr-1" /> {t("dojo.searchBtn", "Buscar")}
            </Button>
          </div>

          {/* Grid vs List View Switcher */}
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title={t("dojo.viewCards", "Tarjetas")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{t("dojo.viewCards", "Tarjetas")}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title={t("dojo.viewList", "Tabla")}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">{t("dojo.viewList", "Tabla")}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-56 animate-pulse bg-zinc-100 dark:bg-zinc-800/40 rounded-2xl" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white/90 dark:bg-zinc-900/60 rounded-3xl">
          <Award className="h-12 w-12 mx-auto text-zinc-400 mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            {t("dojo.noExamsFoundTitle", "No se encontraron convocatorias de examen")}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {t(
              "dojo.noExamsFoundDesc",
              "Crea tu primera fecha de examen de grado para convocar alumnos y evaluar ascensos de cinta."
            )}
          </p>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((ex) => {
            const candidateCount = ex.evaluations?.length || 0;
            const passedCount =
              ex.evaluations?.filter(
                (ev) => ev.status === "PASSED" || (ev.score && ev.score >= 7.0)
              ).length || 0;

            const isCompleted = ex.status === "COMPLETED";
            const isExecuting = ex.status === "IN_PROGRESS";

            return (
              <Card
                key={ex.id}
                className="border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/70 backdrop-blur rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold"
                        >
                          {ex.discipline?.name || "Disciplina"}
                        </Badge>

                        {!isCompleted && (
                          isExecuting ? (
                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold uppercase">
                              ⚡ {t("dojo.statusTatami", "En Tatami • Evaluación")}
                            </Badge>
                          ) : (
                            <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[10px] font-extrabold uppercase">
                              📅 {t("dojo.statusOpen", "Abierta • Convocatoria")}
                            </Badge>
                          )
                        )}
                      </div>

                      <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                        {ex.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCompleted ? (
                        <div
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl"
                          title={t("dojo.statusCompletedShort", "Concluido")}
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>{t("dojo.statusCompletedShort", "Concluido")}</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-amber-500 cursor-pointer"
                            onClick={() => handleOpenEditModal(ex)}
                            title={t("dojo.editExam", "Editar Examen")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-rose-500 cursor-pointer"
                            onClick={() => setDeletingExam(ex)}
                            title={t("dojo.deleteExam", "Eliminar Examen")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Belt & Age Range Indicators */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(ex.minBelt || ex.maxBelt) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>{t("dojo.beltsLabel", "Cintas:")}</span>
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold">
                          De {ex.minBelt?.name || t("dojo.initialRank", "Inicial")} a{" "}
                          {ex.maxBelt?.name || t("dojo.maxRank", "Máximo")}
                        </Badge>
                      </div>
                    )}
                    {(ex.minAge !== null && ex.minAge !== undefined ||
                      ex.maxAge !== null && ex.maxAge !== undefined) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>{t("dojo.agesLabel", "Edades:")}</span>
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-[10px] font-extrabold">
                          {ex.minAge && ex.maxAge
                            ? `${ex.minAge} - ${ex.maxAge} ${t("dojo.yearsOld", "años")}`
                            : ex.minAge
                            ? `Desde ${ex.minAge} ${t("dojo.yearsOld", "años")}`
                            : `Hasta ${ex.maxAge} ${t("dojo.yearsOld", "años")}`}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>
                        {new Date(ex.examDate).toLocaleDateString("es-MX", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        {ex.location || t("dojo.defaultLocation", "Tatami Principal")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold text-zinc-900 dark:text-white">
                        ${ex.feeAmount} {ex.currency}{" "}
                        {t("dojo.examFeeSuffix", "derecho a examen")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-medium">
                      {t("dojo.candidatesEnrolled", "Alumnos Convocados")}:
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white font-mono">
                      {candidateCount} {t("dojo.candidatesSuffix", "candidatos")} ({passedCount}{" "}
                      {t("dojo.passedSuffix", "aprobados")})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {isCompleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="text-xs font-bold rounded-xl opacity-50 cursor-not-allowed border-zinc-300 dark:border-zinc-700 text-zinc-400"
                        title="Examen concluido. No se pueden convocar más alumnos."
                      >
                        <Lock className="h-3.5 w-3.5 mr-1" />
                        {t("dojo.convocatoria", "Convocatoria")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCandidatesManager(ex)}
                        className={
                          "text-xs font-bold rounded-xl border-amber-500/30 " +
                          "text-amber-600 dark:text-amber-400 " +
                          "hover:bg-amber-500/10 cursor-pointer"
                        }
                      >
                        <UserCheck className="h-3.5 w-3.5 mr-1" />{" "}
                        {t("dojo.convocatoria", "Convocatoria")}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleOpenEvaluation(ex)}
                      className={`text-xs font-bold rounded-xl cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-amber-500 hover:bg-amber-600 text-zinc-950"
                      }`}
                    >
                      <Award className="h-3.5 w-3.5 mr-1" />{" "}
                      {isCompleted ? t("dojo.verResultados", "Ver Resultados") : t("dojo.evaluarTatami", "Evaluar Tatami")}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">
                  {t("dojo.colTitleAndRange", "Convocatoria & Rango")}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {t("dojo.colDiscipline", "Disciplina")}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {t("dojo.colDateLocation", "Fecha & Lugar")}
                </TableHead>
                <TableHead className="text-xs font-bold">
                  {t("dojo.colEnrolled", "Convocados")}
                </TableHead>
                <TableHead className="text-xs font-bold text-right">
                  {t("dojo.colActions", "Acciones")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((ex) => {
                const isCompletedTable = ex.status === "COMPLETED";
                const isExecutingTable = ex.status === "IN_PROGRESS";

                return (
                  <TableRow key={ex.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                    <TableCell className="py-3 font-bold text-xs text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{ex.title}</span>
                        {isCompletedTable ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold uppercase">
                            ✓ Concluido
                          </Badge>
                        ) : isExecutingTable ? (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold uppercase">
                            ⚡ En Curso
                          </Badge>
                        ) : (
                          <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-[10px] font-extrabold uppercase">
                            Planificado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(ex.minBelt || ex.maxBelt) && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                            🎯 De {ex.minBelt?.name || t("dojo.initialRank", "Inicial")} a{" "}
                            {ex.maxBelt?.name || t("dojo.maxRank", "Máximo")}
                          </span>
                        )}
                        {(ex.minAge !== null && ex.minAge !== undefined ||
                          ex.maxAge !== null && ex.maxAge !== undefined) && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block">
                            🎂 {ex.minAge && ex.maxAge
                              ? `${ex.minAge}-${ex.maxAge} ${t("dojo.yearsOld", "años")}`
                              : ex.minAge
                              ? `≥ ${ex.minAge} ${t("dojo.yearsOld", "años")}`
                              : `≤ ${ex.maxAge} ${t("dojo.yearsOld", "años")}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {ex.discipline?.name || t("dojo.generalDiscipline", "General")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">
                      <div>{new Date(ex.examDate).toLocaleDateString()}</div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                        {ex.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {ex.evaluations?.length || 0} {t("dojo.studentsCount", "alumnos")}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCompletedTable ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="text-xs rounded-xl h-8 px-2.5 opacity-50 cursor-not-allowed"
                              title="Examen concluido. No se pueden convocar más alumnos."
                            >
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              {t("dojo.convocatoria", "Convocatoria")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenEvaluation(ex)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl h-8 px-2.5"
                            >
                              <Award className="h-3.5 w-3.5 mr-1" />
                              {t("dojo.verResultados", "Ver Resultados")}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCandidatesManager(ex)}
                              className="text-xs rounded-xl h-8 px-2.5"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1" />
                              {t("dojo.convocatoria", "Convocatoria")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenEvaluation(ex)}
                              className="bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl h-8 px-2.5"
                            >
                              <Award className="h-3.5 w-3.5 mr-1" />
                              {t("dojo.evaluarTatami", "Evaluar")}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </Card>
      )}

      {/* MODAL: CREAR CONVOCATORIA DE EXAMEN */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />{" "}
              {t("dojo.createExamTitle", "Nueva Convocatoria de Examen")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {t(
                "dojo.createExamSub",
                "Registra una fecha, disciplina y tatami para evaluación de cinta."
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("dojo.titleLabel", "Título de la Convocatoria")} *
              </Label>
              <Input
                placeholder={t(
                  "dojo.titlePlaceholder",
                  "ej. Examen de Grado Otoño 2026"
                )}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("dojo.disciplineLabel", "Disciplina Asociada")} *
              </Label>
              <select
                value={disciplineId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setDisciplineId(newId);
                  loadBeltsForDiscipline(newId);
                }}
                className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* RANGO DE CINTURONES / GRADOS (DE A) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.minBeltLabel", "De Cinta (Mínima)")}
                </Label>
                <select
                  value={minBeltId}
                  onChange={(e) => setMinBeltId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">
                    {t("dojo.anyMinBelt", "Cualquier Grado (Sin mínimo)")}
                  </option>
                  {disciplineBelts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.maxBeltLabel", "A Cinta (Máxima)")}
                </Label>
                <select
                  value={maxBeltId}
                  onChange={(e) => setMaxBeltId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="">
                    {t("dojo.anyMaxBelt", "Cualquier Grado (Sin máximo)")}
                  </option>
                  {disciplineBelts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* RANGO DE EDADES */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.minAgeLabel", "Edad Mínima (años)")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder={t("dojo.noMinAge", "Sin mínimo")}
                  value={minAge === "" ? "" : minAge}
                  onChange={(e) =>
                    setMinAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.maxAgeLabel", "Edad Máxima (años)")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  placeholder={t("dojo.noMaxAge", "Sin máximo")}
                  value={maxAge === "" ? "" : maxAge}
                  onChange={(e) =>
                    setMaxAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.examDateLabel", "Fecha del Examen")}
                </Label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.feeAmountLabel", "Costo Derecho ({currency})", {
                    currency: brandCurrency,
                  })}
                </Label>
                <Input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("dojo.locationLabel", "Lugar / Tatami Principal")}
              </Label>
              <Input
                placeholder={t(
                  "dojo.locationPlaceholder",
                  "ej. Dojo Central - Tatami Principal"
                )}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                {t("dojo.cancelBtn", "Cancelar")}
              </Button>
              <Button
                type="submit"
                disabled={isCreatingExam}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isCreatingExam ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("dojo.createExamActionBtn", "Crear Convocatoria")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CONVOCATORIA DE EXAMEN */}
      <Dialog
        open={Boolean(editingExam)}
        onOpenChange={(open) => !open && setEditingExam(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" />{" "}
              {t("dojo.editExamTitle", "Editar Convocatoria")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {t(
                "dojo.editExamSub",
                "Modifica los detalles generales de la convocatoria de examen."
              )}
            </DialogDescription>
          </DialogHeader>

          {editingExam && (
            <form onSubmit={handleUpdateExam} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.titleLabel", "Título de la Convocatoria")}
                </Label>
                <Input
                  value={editingExam.title}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, title: e.target.value })
                  }
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.disciplineLabel", "Disciplina Asociada")}
                </Label>
                <select
                  disabled={Boolean(
                    editingExam.evaluations && editingExam.evaluations.length > 0
                  )}
                  value={editingExam.disciplineId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setEditingExam({ ...editingExam, disciplineId: newId });
                    loadBeltsForDiscipline(newId);
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-xl font-medium ${
                    Boolean(
                      editingExam.evaluations &&
                        editingExam.evaluations.length > 0
                    )
                      ? "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 cursor-not-allowed"
                      : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  }`}
                >
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* RANGO DE CINTURONES EN EDICIÓN */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.minBeltLabel", "De Cinta (Mínima)")}
                  </Label>
                  <select
                    value={editingExam.minBeltId || ""}
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        minBeltId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">
                      {t("dojo.anyMinBelt", "Cualquier Grado (Sin mínimo)")}
                    </option>
                    {disciplineBelts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.maxBeltLabel", "A Cinta (Máxima)")}
                  </Label>
                  <select
                    value={editingExam.maxBeltId || ""}
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        maxBeltId: e.target.value || null,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="">
                      {t("dojo.anyMaxBelt", "Cualquier Grado (Sin máximo)")}
                    </option>
                    {disciplineBelts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RANGO DE EDADES EN EDICIÓN */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.minAgeLabel", "Edad Mínima (años)")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    placeholder={t("dojo.noMinAge", "Sin mínimo")}
                    value={
                      editingExam.minAge !== undefined && editingExam.minAge !== null
                        ? editingExam.minAge
                        : ""
                    }
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        minAge: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.maxAgeLabel", "Edad Máxima (años)")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    placeholder={t("dojo.noMaxAge", "Sin máximo")}
                    value={
                      editingExam.maxAge !== undefined && editingExam.maxAge !== null
                        ? editingExam.maxAge
                        : ""
                    }
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        maxAge: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.examDateLabel", "Fecha del Examen")}
                  </Label>
                  <Input
                    type="date"
                    value={
                      typeof (editingExam.examDate as unknown) === "string"
                        ? String(editingExam.examDate).split("T")[0]
                        : new Date(editingExam.examDate).toISOString().split("T")[0]
                    }
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        examDate: e.target.value as unknown as Date,
                      })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.feeAmountLabel", "Costo Derecho ({currency})", {
                      currency: brandCurrency,
                    })}
                  </Label>
                  <Input
                    type="number"
                    value={editingExam.feeAmount || 0}
                    onChange={(e) =>
                      setEditingExam({
                        ...editingExam,
                        feeAmount: Number(e.target.value),
                      })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.locationLabel", "Lugar / Tatami Principal")}
                </Label>
                <Input
                  placeholder={t(
                    "dojo.locationPlaceholder",
                    "ej. Dojo Central - Tatami Principal"
                  )}
                  value={editingExam.location || ""}
                  onChange={(e) =>
                    setEditingExam({ ...editingExam, location: e.target.value })
                  }
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingExam(null)}
                  className="rounded-xl text-xs"
                >
                  {t("dojo.cancelBtn", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingExam}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isUpdatingExam ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("dojo.saveChangesBtn", "Guardar Cambios")
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONVOCATORIA DE ALUMNOS (SEMAFORO) */}
      <Dialog
        open={Boolean(managingCandidatesExam)}
        onOpenChange={(open) => !open && setManagingCandidatesExam(null)}
      >
        <DialogContent className="max-w-2xl rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-4 space-y-2">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-500 shrink-0" />
              {t("dojo.convocatoriaModalTitle", "Convocatoria de Alumnos al Examen")}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {managingCandidatesExam?.title}
                  </span>
                  <span className="text-zinc-400">•</span>
                  <span className="font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                    {managingCandidatesExam?.discipline?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {(managingCandidatesExam?.minBelt ||
                    managingCandidatesExam?.maxBelt) && (
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-xl"
                    >
                      {t(
                        "dojo.beltsRangeBadge",
                        "🎯 Cintas: De {min} a {max}",
                        {
                          min:
                            managingCandidatesExam.minBelt?.name ||
                            t("dojo.initialRank", "Grado Inicial"),
                          max:
                            managingCandidatesExam.maxBelt?.name ||
                            t("dojo.maxRank", "Grado Máximo"),
                        }
                      )}
                    </Badge>
                  )}
                  {((managingCandidatesExam?.minAge !== null &&
                    managingCandidatesExam?.minAge !== undefined) ||
                    (managingCandidatesExam?.maxAge !== null &&
                      managingCandidatesExam?.maxAge !== undefined)) && (
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-xl"
                    >
                      {managingCandidatesExam?.minAge &&
                      managingCandidatesExam?.maxAge
                        ? t(
                            "dojo.ageRangeBoth",
                            "🎂 Edades: {min} - {max} años",
                            {
                              min: managingCandidatesExam.minAge,
                              max: managingCandidatesExam.maxAge,
                            }
                          )
                        : managingCandidatesExam?.minAge
                        ? t(
                            "dojo.ageRangeMin",
                            "🎂 Edades: Desde {min} años",
                            { min: managingCandidatesExam.minAge }
                          )
                        : t(
                            "dojo.ageRangeMax",
                            "🎂 Edades: Hasta {max} años",
                            { max: managingCandidatesExam?.maxAge ?? "" }
                          )}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={candidateModalTab}
            onValueChange={setCandidateModalTab}
            className="pt-2"
          >
            <TabsList className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <TabsTrigger
                value="enrolled"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t(
                  "dojo.tabEnrolledStudents",
                  "Alumnos Convocados ({count})",
                  {
                    count: candidatesList.filter((c) => c.isEnrolled).length,
                  }
                )}
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t("dojo.tabSearchExisting", "Buscar Existente")}
              </TabsTrigger>
              <TabsTrigger
                value="quickAdd"
                className="text-xs font-bold rounded-lg cursor-pointer"
              >
                {t("dojo.tabQuickAdd", "+ Nuevo Registro")}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ALUMNOS CONVOCADOS */}
            <TabsContent value="enrolled" className="space-y-3 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  value={enrolledSearchFilter}
                  onChange={(e) => setEnrolledSearchFilter(e.target.value)}
                  placeholder={t(
                    "dojo.filterEnrolledPlaceholder",
                    "Filtrar convocados por nombre o correo..."
                  )}
                  className="pl-9 text-xs rounded-xl h-9 border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {isLoadingCandidates ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-amber-500 mb-2" />
                    {t(
                      "dojo.loadingExamCandidates",
                      "Cargando candidatos del examen..."
                    )}
                  </div>
                ) : candidatesList.filter((c) => c.isEnrolled).length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    {t(
                      "dojo.noEnrolledStudentsYet",
                      'No hay alumnos convocados para este examen aún. Pasa a la pestaña "Buscar Existente" para convocar candidatos.'
                    )}
                  </div>
                ) : (
                  candidatesList
                    .filter((c) => {
                      if (!c.isEnrolled) return false;
                      const q = enrolledSearchFilter.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        c.studentName.toLowerCase().includes(q) ||
                        (c.email && c.email.toLowerCase().includes(q))
                      );
                    })
                    .map((cand) => (
                      <div
                        key={cand.studentId}
                        className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          {cand.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={cand.photoUrl}
                              alt={cand.studentName}
                              className={
                                "h-10 w-10 rounded-full object-cover border " +
                                "border-zinc-300 dark:border-zinc-700 shrink-0"
                              }
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                              {cand.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() || "AL"}
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{cand.studentName}</span>
                              {cand.age !== null && cand.age !== undefined && (
                                <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                                  ({cand.age} {t("dojo.yearsOld", "años")})
                                </span>
                              )}
                            </p>

                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-zinc-500 font-medium">
                                {t("dojo.currentRankLabelShort", "Actual:")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border border-zinc-400/40 ${getContrastTextColor(
                                  cand.currentBeltColor
                                )}`}
                                style={{
                                  backgroundColor:
                                    cand.currentBeltColor || "#e4e4e7",
                                }}
                              >
                                {cand.currentBeltName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                              <span className="text-zinc-500 font-medium">
                                {t("dojo.targetRankLabelShort", "🎯 Ascenso:")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border border-zinc-400/40 ${getContrastTextColor(
                                  cand.targetBeltColor
                                )}`}
                                style={{
                                  backgroundColor:
                                    cand.targetBeltColor || "#f59e0b",
                                }}
                              >
                                {cand.targetBeltName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCandidateFeePaid(cand.studentId)
                            }
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                              cand.isFeePaid
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {cand.isFeePaid
                              ? t("dojo.feeConfirmed", "💳 Pago Confirmado")
                              : t("dojo.feeRequired", "⏳ Pago Pendiente")}
                          </button>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleToggleCandidate(cand.studentId)
                            }
                            className="h-8 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl cursor-pointer"
                          >
                            {t("dojo.unlinkCandidateBtn", "Desvincular")}
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            {/* TAB 2: BUSCAR & CONVOCAR */}
            <TabsContent value="search" className="space-y-3 pt-3">
              <form onSubmit={handleExecuteCandidateSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    placeholder={t(
                      "dojo.searchStudentByQueryPlaceholder",
                      "Filtrar por nombre o correo de alumno..."
                    )}
                    className="pl-9 text-xs rounded-xl h-9 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                {candidateSearchQuery.trim() && (
                  <Button
                    type="submit"
                    disabled={isSearchingCandidates}
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-9 px-4 cursor-pointer shrink-0"
                  >
                    {isSearchingCandidates ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("dojo.searchOnServerBtn", "Buscar en Servidor")
                    )}
                  </Button>
                )}
              </form>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {isLoadingCandidates || isSearchingCandidates ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-amber-500 mb-2" />
                    {t(
                      "dojo.loadingDisciplineStudents",
                      "Cargando alumnos de la disciplina y verificando requisitos..."
                    )}
                  </div>
                ) : candidateSearchResults.length > 0 ? (
                  candidateSearchResults.map((st) => {
                    const isAlreadyEnrolled = candidatesList.some(
                      (c) => c.studentId === st.id && c.isEnrolled
                    );
                    const currentBeltName =
                      st.currentBelt?.name || t("dojo.initialRank", "Inicial");
                    const currentBeltColor =
                      st.currentBelt?.colorHex || "#e4e4e7";

                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-bold text-xs text-zinc-900 dark:text-white">
                            {st.firstName} {st.lastName}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px]">
                            <span className="text-zinc-500">
                              {t("dojo.currentRankLabelShort", "Actual:")}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border border-zinc-400/40 ${getContrastTextColor(
                                currentBeltColor
                              )}`}
                              style={{ backgroundColor: currentBeltColor }}
                            >
                              {currentBeltName}
                            </span>
                          </div>
                        </div>

                        {isAlreadyEnrolled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            {t("dojo.alreadyEnrolledBadge", "✓ Ya Convocado")}
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleConvokeStudent(st)}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-8 px-3 cursor-pointer"
                          >
                            {t("dojo.convokeToExamBtn", "+ Convocar al Examen")}
                          </Button>
                        )}
                      </div>
                    );
                  })
                ) : candidatesList.filter((c) => {
                    const q = candidateSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      c.studentName.toLowerCase().includes(q) ||
                      (c.email && c.email.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    {t(
                      "dojo.noMatchingAcademyStudents",
                      "No se encontraron alumnos en la academia que cumplan con los requisitos de cintas y edades del examen."
                    )}
                  </div>
                ) : (
                  candidatesList
                    .filter((c) => {
                      const q = candidateSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        c.studentName.toLowerCase().includes(q) ||
                        (c.email && c.email.toLowerCase().includes(q))
                      );
                    })
                    .map((cand) => (
                      <div
                        key={cand.studentId}
                        className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          {cand.photoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={cand.photoUrl}
                              alt={cand.studentName}
                              className={
                                "h-10 w-10 rounded-full object-cover border " +
                                "border-zinc-300 dark:border-zinc-700 shrink-0"
                              }
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shrink-0">
                              {cand.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() || "AL"}
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span>{cand.studentName}</span>
                              {cand.age !== null && cand.age !== undefined && (
                                <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                                  ({cand.age} {t("dojo.yearsOld", "años")})
                                </span>
                              )}
                            </p>

                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-zinc-500 font-medium">
                                {t("dojo.currentRankLabelShort", "Actual:")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border border-zinc-400/40 ${getContrastTextColor(
                                  cand.currentBeltColor
                                )}`}
                                style={{
                                  backgroundColor:
                                    cand.currentBeltColor || "#e4e4e7",
                                }}
                              >
                                {cand.currentBeltName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
                              <span className="text-zinc-500 font-medium">
                                {t("dojo.targetRankLabelShort", "🎯 Ascenso:")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border border-zinc-400/40 ${getContrastTextColor(
                                  cand.targetBeltColor
                                )}`}
                                style={{
                                  backgroundColor:
                                    cand.targetBeltColor || "#f59e0b",
                                }}
                              >
                                {cand.targetBeltName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {cand.isEnrolled ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                              {t("dojo.alreadyEnrolledBadge", "✓ Ya Convocado")}
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleToggleCandidate(cand.studentId)}
                              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-8 px-3 cursor-pointer"
                            >
                              {t("dojo.convokeToExamBtn", "+ Convocar al Examen")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>

            {/* TAB 3: REGISTRO RÁPIDO */}
            <TabsContent value="quickAdd" className="space-y-3 pt-3">
              <form
                onSubmit={handleQuickCreateStudent}
                className="space-y-3 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800"
              >
                <p className="text-xs text-zinc-500 font-medium">
                  {t(
                    "dojo.quickAddStudentDesc",
                    "Registra rápidamente un nuevo alumno en la academia y convócalo de inmediato a este examen."
                  )}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">
                      {t("dojo.firstNameLabel", "Nombre *")}
                    </Label>
                    <Input
                      value={quickFirstName}
                      onChange={(e) => setQuickFirstName(e.target.value)}
                      placeholder={t("dojo.firstNamePlaceholder", "Nombre del alumno")}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">
                      {t("dojo.lastNameLabel", "Apellido")}
                    </Label>
                    <Input
                      value={quickLastName}
                      onChange={(e) => setQuickLastName(e.target.value)}
                      placeholder={t("dojo.lastNamePlaceholder", "Apellido")}
                      className="text-xs rounded-xl h-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">
                    {t("dojo.emailLabel", "Correo Electrónico (Opcional)")}
                  </Label>
                  <Input
                    type="email"
                    value={quickEmail}
                    onChange={(e) => setQuickEmail(e.target.value)}
                    placeholder={t("dojo.emailPlaceholder", "alumno@ejemplo.com")}
                    className="text-xs rounded-xl h-9"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isQuickAddSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-9 w-full cursor-pointer"
                >
                  {isQuickAddSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("dojo.registerAndConvokeBtn", "+ Registrar y Convocar Alumno")
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagingCandidatesExam(null)}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              {t("dojo.closeBtn", "Cerrar")}
            </Button>
            <Button
              type="button"
              disabled={isSavingCandidates}
              onClick={() => handleSaveCandidatesSelection()}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
            >
              {isSavingCandidates ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("dojo.saveChangesBtn", "Guardar Cambios")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: COBRO RÁPIDO DE DERECHO A EXAMEN (1-CLIC) */}
      <Dialog
        open={Boolean(paymentModalCandidate)}
        onOpenChange={(open) => !open && setPaymentModalCandidate(null)}
      >
        <DialogContent className="max-w-md rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />
              {t("dojo.quickPaymentTitle", "Cobro Rápido de Examen")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 pt-1">
              {t(
                "dojo.quickPaymentSub",
                "Confirma el cobro de derecho a examen sin salir de la convocatoria."
              )}
            </DialogDescription>
          </DialogHeader>

          {paymentModalCandidate && managingCandidatesExam && (
            <form onSubmit={handleExecuteQuickPayment} className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {t("dojo.studentCol", "Alumno:")}
                  </span>
                  <span className="font-extrabold text-zinc-900 dark:text-white">
                    {paymentModalCandidate.studentName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {t("dojo.conceptLabel", "Concepto:")}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 truncate max-w-[200px]">
                    {managingCandidatesExam.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-1">
                  <span className="text-zinc-600 dark:text-zinc-400 font-bold">
                    {t("dojo.totalToChargeLabel", "Monto Total a Cobrar:")}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${managingCandidatesExam.feeAmount || 350} {brandCurrency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.paymentMethodLabel", "Método de Pago")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span>💵</span>
                    <span>{t("dojo.paymentMethodCash", "Efectivo")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "TRANSFER"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span>🏦</span>
                    <span>{t("dojo.paymentMethodTransfer", "Transferencia")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-2.5 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span>💳</span>
                    <span>{t("dojo.paymentMethodCard", "Tarjeta")}</span>
                  </button>
                </div>
              </div>

              {(paymentMethod === "TRANSFER" || paymentMethod === "CARD") && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>
                      {paymentMethod === "TRANSFER"
                        ? t("dojo.transferRefLabel", "Clave de Rastreo / Folio SPEI")
                        : t("dojo.cardRefLabel", "Número de Autorización / Voucher")}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      {t("dojo.optionalLabel", "(Opcional)")}
                    </span>
                  </Label>
                  <Input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={
                      paymentMethod === "TRANSFER"
                        ? t("dojo.transferRefPlaceholder", "ej. SPEI-984729104")
                        : t("dojo.cardRefPlaceholder", "ej. AUT-482019")
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              )}

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentModalCandidate(null)}
                  className="rounded-xl text-xs"
                >
                  {t("dojo.cancelBtn", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("dojo.confirmQuickPaymentBtn", "💳 Confirmar Cobro Rápido")
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR ELIMINAR EXAMEN */}
      <Dialog
        open={Boolean(deletingExam)}
        onOpenChange={(open) => !open && setDeletingExam(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />{" "}
              {t("dojo.deleteExamTitle", "¿Eliminar Convocatoria?")}
            </DialogTitle>
            <DialogDescription asChild className="text-xs text-zinc-600 dark:text-zinc-300 pt-1 space-y-2">
              <div>
                {t("dojo.deleteExamSub", "Estás a punto de eliminar la convocatoria")}{" "}
                <strong className="text-zinc-900 dark:text-white">
                  "{deletingExam?.title}"
                </strong>.
              </div>

              {deletingExam?.evaluations && deletingExam.evaluations.length > 0 && (
                <div
                  className={
                    "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 " +
                    "text-amber-700 dark:text-amber-400 font-semibold text-xs mt-2"
                  }
                >
                  ⚠️ No se puede eliminar esta convocatoria porque tiene{" "}
                  <strong>{deletingExam.evaluations.length} alumno(s)</strong>{" "}
                  convocado(s) o evaluado(s). Desconvoca sus evaluaciones primero.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExam(null)}
              className="rounded-xl text-xs"
            >
              {t("dojo.cancelBtn", "Cancelar")}
            </Button>
            <Button
              type="button"
              onClick={handleDeleteExam}
              disabled={Boolean(
                deletingExam?.evaluations && deletingExam.evaluations.length > 0
              )}
              className={
                "bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl " +
                "text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              }
            >
              {t("dojo.confirmDeleteBtn", "Sí, Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: RÚBRICA DE EVALUACIÓN TATAMI REAL */}
      <Dialog
        open={Boolean(evaluatingExam)}
        onOpenChange={(open) => !open && setEvaluatingExam(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              {evaluatingExam?.status === "COMPLETED"
                ? t("dojo.certifiedTitle", "Acta Oficial de Calificaciones (Certificada)")
                : t("dojo.tatamiRubricTitle", "Rúbrica de Evaluación Tatami")}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-amber-500 font-semibold flex items-center justify-between gap-2">
                <span className="truncate">{evaluatingExam?.title}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeTemplate && (
                    <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                      {t(
                        "dojo.templateBadge",
                        "📋 Plantilla: {title} ({count} Criterios)",
                        {
                          title: activeTemplate.title,
                          count: activeTemplate.criteria?.length || 0,
                        }
                      )}
                    </Badge>
                  )}
                  {evaluatingExam?.status === "COMPLETED" && (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      {t("dojo.certifiedBadgeShort", "🔒 Concluido & Certificado")}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {isLoadingEvaluations ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />{" "}
              {t("dojo.loadingEvaluations", "Cargando alumnos y evaluaciones reales...")}
            </div>
          ) : evaluationsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
              <Users className="h-8 w-8 mx-auto text-zinc-400" />
              <p>
                {t(
                  "dojo.noCandidatesEnrolledTatami",
                  "No hay alumnos convocados formalmente para este examen."
                )}
              </p>
              <p className="text-[11px] text-zinc-500">
                {t(
                  "dojo.openCallInstructions",
                  'Abre la opción "Convocatoria" para seleccionar e inscribir a los alumnos.'
                )}
              </p>
            </div>
          ) : (() => {
            const filteredEvals = evaluationsList.filter((ev) => {
              const fullName = ev.student?.firstName
                ? `${ev.student.firstName} ${ev.student.lastName || ""}`
                : ev.student?.user?.name || "";
              const email = ev.student?.email || ev.student?.user?.email || "";
              return (
                fullName.toLowerCase().includes(rubricSearchQuery.toLowerCase()) ||
                email.toLowerCase().includes(rubricSearchQuery.toLowerCase())
              );
            });

            const activeEvalIndex = filteredEvals.findIndex(
              (ev) => ev.id === (selectedEvalStudentId || filteredEvals[0]?.id)
            );
            const currentEvalIndex = activeEvalIndex >= 0 ? activeEvalIndex : 0;
            const activeEvalStudent = filteredEvals[currentEvalIndex] || filteredEvals[0];

            if (!activeEvalStudent) {
              return (
                <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl">
                  {t(
                    "dojo.noMatchingStudentsFound",
                    "No se encontraron alumnos que coincidan con la búsqueda."
                  )}
                </div>
              );
            }

            const isExamFinished = evaluatingExam?.status === "COMPLETED";

            const studentFullName = activeEvalStudent.student?.firstName
              ? `${activeEvalStudent.student.firstName} ${
                  activeEvalStudent.student.lastName || ""
                }`.trim()
              : activeEvalStudent.student?.user?.name ||
                t(
                  "dojo.studentFallback",
                  "Alumno {id}",
                  { id: activeEvalStudent.studentId.slice(-4) }
                );

            const photoUrl =
              activeEvalStudent.student?.photoUrl ||
              activeEvalStudent.student?.user?.image;
            const initials = studentFullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join("") || "AL";

            const currentBeltName =
              activeEvalStudent.student?.currentBelt?.name ||
              t("dojo.defaultCurrentBelt", "Cinta Actual");
            const currentBeltColor =
              activeEvalStudent.student?.currentBelt?.colorHex || "#71717a";
            const targetBeltName =
              activeEvalStudent.targetBelt?.name ||
              t("dojo.defaultTargetBelt", "Cinturón Objetivo");
            const targetBeltColor =
              activeEvalStudent.targetBelt?.colorHex || "#f59e0b";

            const currentScore = activeEvalStudent.score ?? 8.0;
            const criteria = activeTemplate?.criteria || [];
            const studentRatings = criterionRatingsMap[activeEvalStudent.id] || {};

            return (
              <div className="flex-1 overflow-y-auto min-h-0 py-2 pr-1 space-y-3">
                {/* CANDIDATE TABS SELECTOR */}
                {evaluationsList.length > 1 && (
                  <div className="space-y-2">
                    {evaluationsList.length > 4 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                        <Input
                          placeholder={t(
                            "dojo.searchStudentsPlaceholder",
                            "Buscar entre los {count} alumnos...",
                            { count: evaluationsList.length }
                          )}
                          value={rubricSearchQuery}
                          onChange={(e) => setRubricSearchQuery(e.target.value)}
                          className="pl-8 h-8 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 border-b border-zinc-200 dark:border-zinc-800 scrollbar-none">
                      {filteredEvals.map((ev) => {
                        const tabName = ev.student?.firstName
                          ? `${ev.student.firstName} ${ev.student.lastName || ""}`.trim()
                          : ev.student?.user?.name ||
                            t(
                              "dojo.studentFallback",
                              "Alumno {id}",
                              { id: ev.studentId.slice(-4) }
                            );
                        const tabPhoto = ev.student?.photoUrl || ev.student?.user?.image;
                        const tabInitials = tabName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0].toUpperCase())
                          .join("") || "AL";
                        const isSelected = ev.id === activeEvalStudent.id;
                        const scoreVal = ev.score ?? 8.0;

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEvalStudentId(ev.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                              isSelected
                                ? "bg-amber-500 text-zinc-950 border-amber-400 shadow-md ring-2 ring-amber-500/20"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                          >
                            {tabPhoto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={tabPhoto}
                                alt={tabName}
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`h-5 w-5 rounded-full text-[9px] font-extrabold flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-zinc-950 text-amber-400"
                                    : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {tabInitials}
                              </div>
                            )}
                            <span className="truncate max-w-[110px]">{tabName}</span>
                            <span
                              className={`px-1.5 py-0.2 text-[10px] font-black rounded-md ${
                                isSelected
                                  ? "bg-zinc-950/20 text-zinc-950"
                                  : scoreVal >= 7.0
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {scoreVal}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ACTIVE CANDIDATE CARD */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-3 transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={photoUrl}
                          alt={studentFullName}
                          className={
                            "h-11 w-11 rounded-full object-cover border " +
                            "border-zinc-300 dark:border-zinc-700 shrink-0 shadow-2xs"
                          }
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-zinc-950 font-black text-xs flex items-center justify-center border border-amber-400 shrink-0 shadow-2xs">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span className="truncate">{studentFullName}</span>
                          {activeEvalStudent.isFeePaid ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold gap-1 shrink-0">
                              {t("dojo.feeCovered", "💳 Pago Cubierto")}
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold gap-1 shrink-0">
                              {t("dojo.feeRequired", "⏳ Derecho Pendiente")}
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs font-semibold flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-zinc-400 text-[11px]">
                            {t("dojo.currentRankLabelShort", "Actual:")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-zinc-400/40 inline-flex items-center gap-1 ${getContrastTextColor(
                              currentBeltColor
                            )}`}
                            style={{ backgroundColor: currentBeltColor }}
                          >
                            {currentBeltName}
                          </span>
                          <span className="text-zinc-400 text-[11px]">➔</span>
                          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                            {t("dojo.targetRankLabelShort", "🎯 Ascenso:")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-zinc-400/40 inline-flex items-center gap-1 ${getContrastTextColor(
                              targetBeltColor
                            )}`}
                            style={{ backgroundColor: targetBeltColor }}
                          >
                            {targetBeltName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <label className="text-[10px] text-zinc-400 block font-medium">
                        {t("dojo.finalScoreLabel", "Calificación Final")}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="10"
                        disabled={isExamFinished || criteria.length > 0}
                        value={currentScore}
                        onChange={(e) =>
                          handleScoreChange(activeEvalStudent.id, Number(e.target.value))
                        }
                        className={`w-16 px-2 py-1 text-center font-extrabold text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white ${
                          isExamFinished
                            ? "opacity-75 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/80"
                            : "focus:ring-2 focus:ring-amber-500"
                        }`}
                      />
                    </div>
                  </div>

                  {criteria.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                        {t("dojo.tatamiCriteriaHeader", "Criterios de Evaluación Tatami")}
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {criteria.map((c) => {
                          const currentRating = studentRatings[c.id] || "EXCELLENT";
                          return (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {c.name}
                                </div>
                                {c.description && (
                                  <div className="text-[10px] text-zinc-400">
                                    {c.description}
                                  </div>
                                )}
                              </div>

                              {isExamFinished ? (
                                <div
                                  className={
                                    "flex items-center gap-1.5 px-2.5 py-1 " +
                                    "rounded-lg bg-zinc-100 dark:bg-zinc-800 " +
                                    "text-xs font-bold shrink-0"
                                  }
                                >
                                  {currentRating === "EXCELLENT" && (
                                    <span
                                      className={
                                        "inline-flex items-center gap-1 " +
                                        "text-emerald-600 dark:text-emerald-400 " +
                                        "font-extrabold text-[11px]"
                                      }
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />{" "}
                                      {t("dojo.ratingMastered", "Dominado (10)")}
                                    </span>
                                  )}
                                  {currentRating === "GOOD" && (
                                    <span
                                      className={
                                        "inline-flex items-center gap-1 " +
                                        "text-amber-600 dark:text-amber-400 " +
                                        "font-extrabold text-[11px]"
                                      }
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" />{" "}
                                      {t("dojo.ratingInProcess", "En Proceso (7.5)")}
                                    </span>
                                  )}
                                  {currentRating === "NEEDS_WORK" && (
                                    <span
                                      className={
                                        "inline-flex items-center gap-1 " +
                                        "text-rose-600 dark:text-rose-400 " +
                                        "font-extrabold text-[11px]"
                                      }
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" />{" "}
                                      {t("dojo.ratingPractice", "Práctica (5)")}
                                    </span>
                                  )}
                                  {!currentRating && (
                                    <span className="text-zinc-400 italic text-[11px]">
                                      {t("dojo.ratingUnevaluated", "Sin evaluar")}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCriterionRatingChange(
                                        activeEvalStudent.id,
                                        c.id,
                                        "EXCELLENT"
                                      )
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                                      currentRating === "EXCELLENT"
                                        ? "bg-emerald-500 text-slate-950 shadow-2xs"
                                        : "text-emerald-500 hover:bg-emerald-500/10"
                                    }`}
                                    title={t("dojo.titleMastered", "🟩 Dominado (10)")}
                                  >
                                    <CheckCircle className="w-3 h-3" /> 10
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCriterionRatingChange(
                                        activeEvalStudent.id,
                                        c.id,
                                        "GOOD"
                                      )
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                                      currentRating === "GOOD"
                                        ? "bg-amber-500 text-slate-950 shadow-2xs"
                                        : "text-amber-500 hover:bg-amber-500/10"
                                    }`}
                                    title={t("dojo.titleInProcess", "🟡 En Proceso (7.5)")}
                                  >
                                    <ThumbsUp className="w-3 h-3" /> 7.5
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCriterionRatingChange(
                                        activeEvalStudent.id,
                                        c.id,
                                        "NEEDS_WORK"
                                      )
                                    }
                                    className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                                      currentRating === "NEEDS_WORK"
                                        ? "bg-rose-500 text-white shadow-2xs"
                                        : "text-rose-500 hover:bg-rose-500/10"
                                    }`}
                                    title={t(
                                      "dojo.titlePractice",
                                      "🔴 Práctica Requerida (5.0)"
                                    )}
                                  >
                                    <ThumbsDown className="w-3 h-3" /> 5
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTTOM CANDIDATE NAVIGATION */}
                {filteredEvals.length > 1 && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={currentEvalIndex <= 0}
                      onClick={() =>
                        setSelectedEvalStudentId(
                          filteredEvals[currentEvalIndex - 1]?.id
                        )
                      }
                      className="text-xs font-bold gap-1 rounded-xl cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />{" "}
                      {t("dojo.prevStudentBtn", "Alumno Anterior")}
                    </Button>

                    <span className="font-semibold text-zinc-500 text-[11px]">
                      {t(
                        "dojo.studentProgress",
                        "Alumno {current} de {total}",
                        {
                          current: currentEvalIndex + 1,
                          total: filteredEvals.length,
                        }
                      )}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={currentEvalIndex >= filteredEvals.length - 1}
                      onClick={() =>
                        setSelectedEvalStudentId(
                          filteredEvals[currentEvalIndex + 1]?.id
                        )
                      }
                      className="text-xs font-bold gap-1 rounded-xl cursor-pointer"
                    >
                      {t("dojo.nextStudentBtn", "Alumno Siguiente")}{" "}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-wrap gap-2 shrink-0 mt-auto bg-white dark:bg-zinc-900 z-10">
            {evaluatingExam?.status !== "COMPLETED" ? (
              <Button
                type="button"
                onClick={() => setIsConfirmFinalizeOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs"
              >
                <Trophy className="h-4 w-4" />{" "}
                {t("dojo.concludeExamBtn", "Concluir Examen y Promover")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleOpenDiplomasForExam(evaluatingExam!)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl gap-1 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />{" "}
                {t("dojo.printOfficialDiplomasBtn", "Imprimir Diplomas Oficiales")}
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEvaluatingExam(null)}
                className="rounded-xl text-xs"
              >
                {t("dojo.closeBtn", "Cerrar")}
              </Button>
              {evaluatingExam?.status !== "COMPLETED" && (
                <Button
                  type="button"
                  disabled={isSavingEvaluations}
                  onClick={handleSaveEvaluations}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingEvaluations ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("dojo.saveRubricBtn", "Guardar Rúbrica")
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR CONCLUIR EXAMEN */}
      <Dialog
        open={isConfirmFinalizeOpen}
        onOpenChange={setIsConfirmFinalizeOpen}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Trophy className="h-5 w-5 shrink-0" />{" "}
              {t("dojo.confirmFinalizeTitle", "¿Concluir Examen y Promover?")}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 pt-2 space-y-2">
                <p>
                  {t("dojo.confirmFinalizeDesc1", "Estás a punto de finalizar el examen")}{" "}
                  <strong className="text-zinc-900 dark:text-white">
                    "{evaluatingExam?.title}"
                  </strong>.
                </p>
                <p className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {t(
                    "dojo.confirmFinalizeDesc2",
                    "✨ Todos los alumnos con calificación aprobatoria (≥ 7.0) serán promovidos automáticamente de cinturón y el examen quedará certificado en modo solo lectura."
                  )}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isFinalizingExam}
              onClick={() => setIsConfirmFinalizeOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("dojo.cancelBtn", "Cancelar")}
            </Button>
            <Button
              type="button"
              disabled={isFinalizingExam}
              onClick={handleFinalizeExamInModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs gap-1"
            >
              {isFinalizingExam ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("dojo.confirmFinalizeAction", "Sí, Concluir Examen")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIPLOMA BUILDER MODAL INTEGRATION */}
      <DiplomaBuilderModal
        open={isDiplomaModalOpen}
        onOpenChange={setIsDiplomaModalOpen}
        students={diplomaStudentsList}
        activeFilterDisciplineName={diplomaDisciplineName}
      />
    </div>
  );
}

export default function ExamsPage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <div className="p-6 text-zinc-500">
          {t("dojo.loadingExamsFallback", "Cargando exámenes...")}
        </div>
      }
    >
      <ExamsContent />
    </Suspense>
  );
}

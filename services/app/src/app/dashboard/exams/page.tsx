"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  CheckCircle2,
  Loader2,
  Sparkles,
  Play,
  Check,
  UserCheck,
  Printer,
  ThumbsUp,
  ThumbsDown,
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
import {
  getGradeExamsByBrandAction,
  createGradeExamAction,
  updateGradeExamAction,
  deleteGradeExamAction,
  getExamEvaluationsAction,
  saveExamEvaluationsAction,
  getDisciplineCandidatesWithEligibilityAction,
  saveExamCandidatesSelectionAction,
  updateGradeExamStatusAction,
  finalizeGradeExamAction,
} from "@/actions/exams";
import { getDisciplinesByBrandAction } from "@/actions/disciplines";
import type {
  GradeExam,
  Discipline,
  Brand,
  ExamEvaluationWithDetails,
  CandidateEligibility,
} from "@/types";

interface ExtendedGradeExam extends GradeExam {
  discipline?: Discipline;
  brand?: Brand;
  evaluations?: ExamEvaluationWithDetails[];
}

// Calculate high contrast text color for belt badges based on background hex luminance
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
  return brightness > 165 ? "text-zinc-950 font-extrabold" : "text-white font-extrabold";
}

export default function ExamsPage() {
  const { selectedBrandId, brands } = useBrand();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [_isPending, startTransition] = useTransition();

  const effectiveBrandId =
    selectedBrandId === "ALL" ? (brands[0]?.id || "seed-brand-general") : selectedBrandId;
  const activeBrand = brands.find((b) => b.id === effectiveBrandId) || brands[0];
  const brandCurrency = activeBrand?.currency || "USD";

  const [exams, setExams] = useState<ExtendedGradeExam[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
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

  const [managingCandidatesExam, setManagingCandidatesExam] =
    useState<ExtendedGradeExam | null>(null);
  const [candidatesList, setCandidatesList] = useState<CandidateEligibility[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSavingCandidates, setIsSavingCandidates] = useState(false);
  const [candidateFilterTab, setCandidateFilterTab] =
    useState<"ALL" | "ELIGIBLE" | "NEAR" | "INELIGIBLE">("ALL");
  const [confirmDeselectCandidatesModal, setConfirmDeselectCandidatesModal] = useState<
    CandidateEligibility[] | null
  >(null);

  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [isUpdatingExam, setIsUpdatingExam] = useState(false);

  // Real Database Tatami Evaluations state
  const [evaluationsList, setEvaluationsList] = useState<ExamEvaluationWithDetails[]>([]);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isSavingEvaluations, setIsSavingEvaluations] = useState(false);

  // Form states for Create
  const [title, setTitle] = useState("");
  const [disciplineId, setDisciplineId] = useState("");
  const [examDate, setExamDate] = useState("2026-10-15");
  const [location, setLocation] = useState("Dojo Central - Tatami Principal");
  const [feeAmount, setFeeAmount] = useState(350);

  // Diploma Builder Modal state
  const [isDiplomaModalOpen, setIsDiplomaModalOpen] = useState(false);
  const [diplomaStudentsList, setDiplomaStudentsList] = useState<unknown[]>([]);
  const [diplomaDisciplineName, setDiplomaDisciplineName] = useState<string>("");

  // Helper to sync URL searchParams
  const updateUrlParams = (newParams: Record<string, string | number | undefined>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "ALL" || (key === "page" && value === 1)) {
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

  // Fetch Exams with Server-Side Filtering & Pagination
  const fetchExams = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);

    try {
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await getGradeExamsByBrandAction({
        brandId: brandToUse,
        search: appliedSearch,
        disciplineId: appliedDiscipline,
        page: currentPage,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setExams(res.data.exams);
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

  // Fetch Disciplines dropdown options
  const fetchDisciplines = async () => {
    if (!selectedBrandId) return;
    try {
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const discRes = await getDisciplinesByBrandAction(brandToUse);
      if (discRes.success && discRes.data) {
        setDisciplines(discRes.data);
        if (discRes.data.length > 0 && !disciplineId) {
          setDisciplineId(discRes.data[0].id);
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

  // Server Search Submit Handler
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

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  // Handle Page Size Change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    updateUrlParams({ limit: newSize, page: 1 });
  };

  // Open Candidate Selection Modal & Fetch Eligibility Semaphore
  const handleOpenCandidatesManager = async (ex: ExtendedGradeExam) => {
    setManagingCandidatesExam(ex);
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

  // Toggle candidate fee payment status
  const handleToggleCandidateFeePaid = (studentId: string) => {
    setCandidatesList((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, isFeePaid: !c.isFeePaid } : c))
    );
  };

  // Toggle single candidate selection
  const handleToggleCandidate = (studentId: string) => {
    if (managingCandidatesExam?.status === "COMPLETED") {
      toast.warning("No se pueden modificar los candidatos de un examen finalizado y certificado.");
      return;
    }
    setCandidatesList((prev) =>
      prev.map((c) => (c.studentId === studentId ? { ...c, isEnrolled: !c.isEnrolled } : c))
    );
  };

  // Save Candidates Selection
  const handleSaveCandidatesSelection = async (force: boolean = false) => {
    if (!managingCandidatesExam) return;

    // Safety Check: Warn if any deselected student was previously enrolled/evaluted in DB
    if (!force) {
      setIsSavingCandidates(true);
      try {
        const evsRes = await getExamEvaluationsAction(managingCandidatesExam.id);
        if (evsRes.success && evsRes.data) {
          const dbEvaluations = evsRes.data;
          const deselectedEnrolled = candidatesList.filter((c) => {
            if (c.isEnrolled) return false;
            return dbEvaluations.some((e) => e.studentId === c.studentId);
          });

          if (deselectedEnrolled.length > 0) {
            setIsSavingCandidates(false);
            setConfirmDeselectCandidatesModal(deselectedEnrolled);
            return;
          }
        }
      } catch {
        // proceed
      }
    }

    setIsSavingCandidates(true);
    try {
      const selections = candidatesList.map((c) => ({
        studentId: c.studentId,
        targetBeltId: c.targetBeltId,
        isSelected: c.isEnrolled,
        isFeePaid: c.isFeePaid,
      }));

      const res = await saveExamCandidatesSelectionAction(managingCandidatesExam.id, selections);
      if (res.success) {
        toast.success("Candidatos del examen actualizados correctamente.");
        setManagingCandidatesExam(null);
        setConfirmDeselectCandidatesModal(null);
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

  // Start Exam Lifecycle (Move PLANNED -> IN_PROGRESS)
  const handleStartExam = async (ex: ExtendedGradeExam) => {
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

  // Finalize & Certify Exam (Move IN_PROGRESS -> COMPLETED & auto-promote passed students)
  const handleFinalizeExam = async (ex: ExtendedGradeExam) => {
    try {
      const res = await finalizeGradeExamAction(ex.id);
      if (res.success && res.data) {
        toast.success(
          `¡Examen Concluido! ${res.data.promotedCount} alumnos aprobados fueron promovidos de cinturón.`
        );
        fetchExams();
      } else {
        toast.error(res.error || "No se pudo finalizar el examen.");
      }
    } catch {
      toast.error("Error al finalizar examen.");
    }
  };

  // Open Tatami Evaluation Rubric and fetch REAL database evaluations
  const handleOpenEvaluation = async (ex: ExtendedGradeExam) => {
    setEvaluatingExam(ex);
    setIsLoadingEvaluations(true);
    try {
      const res = await getExamEvaluationsAction(ex.id);
      if (res.success && res.data) {
        setEvaluationsList(res.data);
      } else {
        toast.error(res.error || "No se pudieron obtener las evaluaciones reales.");
        setEvaluationsList([]);
      }
    } catch {
      toast.error("Error al consultar evaluaciones del tatami.");
      setEvaluationsList([]);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  // Handle score change in real evaluation
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

  // Handle Open Diplomas Builder for Exam
  const handleOpenDiplomasForExam = async (ex: ExtendedGradeExam) => {
    try {
      const res = await getExamEvaluationsAction(ex.id);
      if (res.success && res.data) {
        const dataList = res.data;
        const passedEvals = dataList.filter(
          (ev) => ev.status === "PASSED" || (ev.score && ev.score >= 7.0) || dataList.length > 0
        );

        const mappedStudents: unknown[] = passedEvals.map((ev) => ({
          id: ev.studentId,
          brandId: ex.brandId,
          userId: ev.studentId,
          currentBeltId: ev.targetBeltId,
          effortPoints: 100,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: ev.studentId,
            name: ev.student?.user?.name || "Alumno Participante",
            email: ev.student?.user?.email || null,
            role: "STUDENT",
            status: "ACTIVE",
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          currentBelt: ev.targetBelt
            ? {
                id: ev.targetBelt.id,
                disciplineId: ex.disciplineId,
                name: ev.targetBelt.name,
                colorHex: ev.targetBelt.colorHex,
                orderIndex: 1,
                minClasses: 24,
                minMonths: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
            : null,
          enrollments: [
            {
              id: "enr-1",
              studentId: ev.studentId,
              disciplineId: ex.disciplineId,
              startDate: new Date(),
              status: "ACTIVE",
              discipline: ex.discipline || null,
            },
          ],
        }));

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
      const payload = evaluationsList.map((e) => ({
        id: e.id,
        score: e.score ?? 8.0,
        status: e.status || (e.score && e.score >= 7.0 ? "PASSED" : "FAILED"),
        feedback: e.feedback || "",
      }));

      const res = await saveExamEvaluationsAction(payload);
      if (res.success) {
        toast.success("Evaluaciones reales del Tatami guardadas en la base de datos.");
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

  // Create Exam Handler
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
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await createGradeExamAction({
        brandId: brandToUse,
        disciplineId,
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

  // Update Exam Handler
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
        editingExam.disciplineId
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

  // Delete Exam Handler
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

  // Filter candidates list in manager modal by tab
  const filteredCandidatesList = candidatesList.filter((c) => {
    if (candidateFilterTab === "ALL") return true;
    return c.eligibilityStatus === candidateFilterTab;
  });

  // KPI Calculations (Real Database Totals)
  const allEvaluations = exams.flatMap((ex) => ex.evaluations || []);
  const totalCandidatesCount = allEvaluations.length;
  const passedCount = allEvaluations.filter(
    (ev) => ev.status === "PASSED" || (ev.score !== null && ev.score !== undefined && ev.score >= 7.0)
  ).length;
  const passRatePercentage =
    allEvaluations.length > 0
      ? Math.round((passedCount / allEvaluations.length) * 100)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Award className="h-7 w-7 text-amber-500" />
            {t("dojo.examsTitle", "Exámenes de Grado & Certificación")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("dojo.examsSub", "Convoca a los alumnos elegibles de la disciplina con semáforo de criterios, evalúa en tatami y promueve de cinturón automáticamente.")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-xs cursor-pointer text-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> {t("dojo.createExam", "Nueva Convocatoria")}
        </Button>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiAnnualExams", "Convocatorias Anuales")}
              </span>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-serif">
                {totalExamsCount}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> {t("dojo.kpiAnnualExamsSub", "Convocatorias registradas")}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiEvaluatedStudents", "Alumnos Evaluados")}
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-serif">
                {totalCandidatesCount}
              </div>
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-indigo-400" /> {t("dojo.kpiEvaluatedStudentsSub", "Candidatos inscritos")}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiPassRate", "Tasa de Aprobación")}
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-serif">
                {passRatePercentage}%
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {t("dojo.kpiPassRateSub", "Promoción de cinturón")}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SERVER-SIDE FILTER BAR WITH 'BUSCAR' BUTTON */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input, Discipline Select & Buscar Button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm h-10 flex items-center">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("dojo.searchExamPlaceholder", "Buscar convocatoria por nombre o lugar...")}
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
              <option value="ALL">{t("dojo.allDisciplines", "Todas las Disciplinas")}</option>
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

          {/* View Mode Toggle Switch */}
          <div className="h-10 flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 shrink-0 box-border">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`h-8 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-amber-500 text-zinc-950 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title={t("dojo.viewCards", "Tarjetas")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> {t("dojo.viewCards", "Tarjetas")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-8 flex items-center justify-center gap-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-amber-500 text-zinc-950 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title={t("dojo.viewList", "Lista")}
            >
              <List className="h-3.5 w-3.5" /> {t("dojo.viewList", "Lista")}
            </button>
          </div>
        </form>
      </Card>

      {/* EXAMS CONTENT (CARDS GRID OR TABLE LIST) */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> Cargando convocatorias desde el servidor...
        </div>
      ) : exams.length === 0 ? (
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl p-12 text-center space-y-3">
          <Award className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            No se encontraron convocatorias de examen en el servidor.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 mr-1" /> Programar Primera Convocatoria
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* VISTA DE TARJETAS (CARDS GRID VIEW) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((ex) => {
            const dateStr =
              typeof (ex.examDate as unknown) === "string"
                ? String(ex.examDate).split("T")[0]
                : new Date(ex.examDate).toISOString().split("T")[0];

            const candidatesCount = ex.evaluations?.length || 0;
            const status = ex.status || "PLANNED";

            return (
              <div
                key={ex.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-amber-500/40 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      {status === "PLANNED" && (
                        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-0.5">
                          Abierta • Convocatoria
                        </Badge>
                      )}
                      {status === "IN_PROGRESS" && (
                        <Badge className="bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 animate-pulse">
                          ▶ En Tatami • Evaluación
                        </Badge>
                      )}
                      {status === "COMPLETED" && (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-black uppercase px-2.5 py-0.5">
                          ✓ Concluida & Certificada
                        </Badge>
                      )}
                      {ex.discipline && (
                        <Badge variant="outline" className="text-[10px] font-mono font-bold border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                          {ex.discipline.name}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1.5 group-hover:text-amber-500 transition-colors">
                      {ex.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                      <button
                        type="button"
                        onClick={() => setEditingExam(ex)}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Editar examen"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingExam(ex)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar examen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-medium text-zinc-900 dark:text-white">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{ex.location || t("dojo.defaultLocation", "Dojo Principal")}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{t("dojo.examFeeLabel", "Derecho de Examen:")} <strong className="text-zinc-900 dark:text-white">${ex.feeAmount || 0} {ex.brand?.currency || brandCurrency}</strong></span>
                  </div>
                </div>

                {/* DYNAMIC LIFECYCLE ACTION BUTTONS */}
                <div className="pt-2 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-amber-500" /> {candidatesCount} {t("dojo.candidatesEnrolled", "Alumnos Convocados")}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenCandidatesManager(ex)}
                      className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer h-7"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-1" /> {t("dojo.candidatesBtn", "Candidatos (Semáforo 🚦)")}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {status === "PLANNED" && (
                      <Button
                        onClick={() => handleStartExam(ex)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs h-8"
                      >
                        <Play className="h-3.5 w-3.5 mr-1" /> {t("dojo.startExamBtn", "Iniciar Examen en Tatami")}
                      </Button>
                    )}

                    {status === "IN_PROGRESS" && (
                      <>
                        <Button
                          onClick={() => handleOpenEvaluation(ex)}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs h-8"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> {t("dojo.tatamiRubricBtn", "Rúbrica Tatami")}
                        </Button>
                        <Button
                          onClick={() => handleFinalizeExam(ex)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs h-8"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> {t("dojo.finalizeExamActionBtn", "Finalizar Examen")}
                        </Button>
                      </>
                    )}

                    {status === "COMPLETED" && (
                      <Button
                        onClick={() => handleOpenEvaluation(ex)}
                        className="w-full bg-zinc-900 dark:bg-zinc-800 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs h-8"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> {t("dojo.viewResultsBtn", "Ver Resultados & Certificados")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA DE TABLA / LISTA (TABLE LIST VIEW) */
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.examTitleCol", "Convocatoria")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.statusCol", "Estado")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.disciplineCol", "Disciplina")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.dateCol", "Fecha")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.feeCol", "Derecho Examen")}</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.enrolledCol", "Convocados")}</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase text-zinc-700 dark:text-zinc-300">{t("dojo.actionsCol", "Acciones")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((ex) => {
                  const dateStr =
                    typeof (ex.examDate as unknown) === "string"
                      ? String(ex.examDate).split("T")[0]
                      : new Date(ex.examDate).toISOString().split("T")[0];

                  const candidatesCount = ex.evaluations?.length || 0;
                  const status = ex.status || "PLANNED";

                  return (
                    <TableRow key={ex.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <TableCell className="font-bold text-zinc-900 dark:text-white text-xs">
                        {ex.title}
                      </TableCell>
                      <TableCell>
                        {status === "PLANNED" && (
                          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px]">Abierta</Badge>
                        )}
                        {status === "IN_PROGRESS" && (
                          <Badge className="bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 text-[10px] animate-pulse">En Tatami</Badge>
                        )}
                        {status === "COMPLETED" && (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px]">Concluida</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                        {ex.discipline ? (
                          <Badge variant="outline" className="text-[10px] font-mono border-zinc-300 dark:border-zinc-700">
                            {ex.discipline.name}
                          </Badge>
                        ) : (
                          "General"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                        {dateStr}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        ${ex.feeAmount || 0} {ex.brand?.currency || brandCurrency}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                        {candidatesCount} Alumnos
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenCandidatesManager(ex)}
                            className="h-8 px-2 text-amber-500 hover:bg-amber-500/10 rounded-lg text-xs font-bold"
                            title="Gestionar Candidatos (Semáforo)"
                          >
                            <UserCheck className="h-3.5 w-3.5 mr-1" /> Candidatos
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEvaluation(ex)}
                            className="h-8 px-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg text-xs font-bold"
                            title="Evaluar Tatami"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Tatami
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingExam(ex)}
                            className="w-8 h-8 p-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all"
                            title="Editar examen"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingExam(ex)}
                            className="w-8 h-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all"
                            title="Eliminar examen"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* MANDATORY SERVER-SIDE PAGINATION CONTROL */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center bg-white dark:bg-zinc-900/60 rounded-2xl border">
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>

      {/* MODAL: SELECCIÓN DE CANDIDATOS CON SEMÁFORO DE ELEGIBILIDAD */}
      <Dialog
        open={Boolean(managingCandidatesExam)}
        onOpenChange={(open) => !open && setManagingCandidatesExam(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl relative">
          {/* OVERLAY DE CONFIRMACION PARA DESCONVOCAR ALUMNOS */}
          {confirmDeselectCandidatesModal && (
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 p-6 flex items-center justify-center rounded-2xl">
              <div className="bg-white dark:bg-zinc-900 border border-amber-500/40 p-6 rounded-2xl max-w-md space-y-4 text-left shadow-2xl animate-in fade-in zoom-in duration-150">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-bold text-base">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
                  <span>¿Desconvocar Alumnos Evaluados?</span>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-300 space-y-2">
                  <p>
                    Has desmarcado a{" "}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {confirmDeselectCandidatesModal.length} alumno(s)
                    </strong>{" "}
                    previamente convocados en esta competencia/examen:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-amber-600 dark:text-amber-400 font-bold max-h-32 overflow-y-auto">
                    {confirmDeselectCandidatesModal.map((cand) => (
                      <li key={cand.studentId}>{cand.studentName}</li>
                    ))}
                  </ul>
                  <p className="text-rose-500 font-bold pt-1">
                    ⚠️ Si continúas, sus registros y calificaciones registradas se eliminarán
                    permanentemente de la convocatoria.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDeselectCandidatesModal(null)}
                    className="rounded-xl text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={isSavingCandidates}
                    onClick={() => handleSaveCandidatesSelection(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    {isSavingCandidates ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, Eliminar y Continuar"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-500" /> Semáforo de Elegibilidad & Selección de Candidatos
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {managingCandidatesExam?.title} • Alumnos inscritos en {managingCandidatesExam?.discipline?.name || "la disciplina"}
            </DialogDescription>
          </DialogHeader>

          {/* FILTER TABS FOR SEMAPHORE */}
          <div className="flex items-center gap-2 pt-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-500 mr-2">Filtrar por Requisito:</span>
            <button
              type="button"
              onClick={() => setCandidateFilterTab("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                candidateFilterTab === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Todos ({candidatesList.length})
            </button>
            <button
              type="button"
              onClick={() => setCandidateFilterTab("ELIGIBLE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                candidateFilterTab === "ELIGIBLE"
                  ? "bg-emerald-500 text-white"
                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              }`}
            >
              🟢 Cumple 100% ({candidatesList.filter((c) => c.eligibilityStatus === "ELIGIBLE").length})
            </button>
            <button
              type="button"
              onClick={() => setCandidateFilterTab("NEAR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                candidateFilterTab === "NEAR"
                  ? "bg-amber-500 text-zinc-950"
                  : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              }`}
            >
              🟡 Cerca de Cumplir ({candidatesList.filter((c) => c.eligibilityStatus === "NEAR").length})
            </button>
            <button
              type="button"
              onClick={() => setCandidateFilterTab("INELIGIBLE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                candidateFilterTab === "INELIGIBLE"
                  ? "bg-rose-600 text-white"
                  : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              🔴 No Cumple ({candidatesList.filter((c) => c.eligibilityStatus === "INELIGIBLE").length})
            </button>
          </div>

          {isLoadingCandidates ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> Calculando asistencia y antigüedad de alumnos...
            </div>
          ) : filteredCandidatesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              No se encontraron alumnos en esta categoría de filtro.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto py-2 pr-1">
              {filteredCandidatesList.map((cand) => {
                const isExamFinished = managingCandidatesExam?.status === "COMPLETED";

                return (
                  <div
                    key={cand.studentId}
                    onClick={(e) => {
                      if (isExamFinished) return;
                      if ((e.target as HTMLElement).tagName === "INPUT") return;
                      handleToggleCandidate(cand.studentId);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isExamFinished
                        ? "opacity-80 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                        : cand.isEnrolled
                        ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs cursor-pointer"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={isExamFinished}
                        checked={cand.isEnrolled}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleCandidate(cand.studentId);
                        }}
                        className="h-4 w-4 accent-amber-500 rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div>
                        <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                          {cand.studentName}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-medium">Actual:</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border border-zinc-400/40 inline-flex items-center gap-1.5 shadow-2xs ${getContrastTextColor(cand.currentBeltColor)}`}
                              style={{ backgroundColor: cand.currentBeltColor || "#e4e4e7" }}
                            >
                              {cand.currentBeltName}
                            </span>
                          </span>

                          <span className="text-zinc-400">→</span>

                          <span className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-medium">Objetivo:</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border border-zinc-400/40 inline-flex items-center gap-1.5 shadow-2xs ${getContrastTextColor(cand.targetBeltColor)}`}
                              style={{ backgroundColor: cand.targetBeltColor || "#f59e0b" }}
                            >
                              {cand.targetBeltName}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="text-[11px] text-zinc-500 space-y-0.5">
                        <div>{t("dojo.classesLabel", "Clases:")} <strong className="text-zinc-900 dark:text-white">{cand.classesAttended} / {cand.classesRequired}</strong></div>
                        <div>{t("dojo.monthsLabel", "Meses:")} <strong className="text-zinc-900 dark:text-white">{cand.monthsPracticed} / {cand.monthsRequired}</strong></div>
                      </div>

                      {cand.isEnrolled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCandidateFeePaid(cand.studentId);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                            cand.isFeePaid
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                          }`}
                          title={t("dojo.feePaidHint", "Haz clic para cambiar el estado de pago del derecho a examen")}
                        >
                          {cand.isFeePaid ? `💳 ${t("dojo.feePaid", "Examen Pagado")}` : `⏳ ${t("dojo.feePending", "Pago Pendiente")}`}
                        </button>
                      )}

                      {cand.eligibilityStatus === "ELIGIBLE" && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {t("dojo.eligibleBadge", "🟢 Cumple")}
                        </Badge>
                      )}
                      {cand.eligibilityStatus === "NEAR" && (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          {t("dojo.nearBadge", "🟡 Cerca de cumplir")}
                        </Badge>
                      )}
                      {cand.eligibilityStatus === "INELIGIBLE" && (
                        <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          {t("dojo.ineligibleBadge", "🔴 No cumple")}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">
                {candidatesList.filter((c) => c.isEnrolled).length} Alumnos Convocados
              </span>
              {managingCandidatesExam?.status === "COMPLETED" && (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  🔒 Convocatoria Concluida (Lista congelada)
                </Badge>
              )}
            </div>
            {managingCandidatesExam?.status !== "COMPLETED" && (
              <Button
                type="button"
                disabled={isSavingCandidates}
                onClick={() => handleSaveCandidatesSelection()}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {isSavingCandidates ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Candidatos Convocados"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CREAR CONVOCATORIA DE EXAMEN */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" /> Nueva Convocatoria de Examen
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Registra una fecha, disciplina y tatami para evaluación de cinta.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Título de la Convocatoria
              </Label>
              <Input
                placeholder="ej. Examen de Grado Otoño 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Disciplina Asociada
              </Label>
              <select
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Fecha del Examen
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
                  {t("dojo.feeAmountLabel", "Costo Derecho ({currency})", { currency: brandCurrency })}
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
                Lugar / Tatami Principal
              </Label>
              <Input
                placeholder="ej. Dojo Central - Tatami Principal"
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
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingExam}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isCreatingExam ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear Convocatoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CONVOCATORIA DE EXAMEN */}
      <Dialog open={Boolean(editingExam)} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Pencil className="h-5 w-5 text-amber-500" /> Editar Convocatoria
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Modifica los detalles generales de la convocatoria de examen.
            </DialogDescription>
          </DialogHeader>

          {editingExam && (
            <form onSubmit={handleUpdateExam} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Título de la Convocatoria
                </Label>
                <Input
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Disciplina Asociada
                  </Label>
                  {Boolean(editingExam.evaluations && editingExam.evaluations.length > 0) ? (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      🔒 No modificable ({editingExam.evaluations?.length} alumnos convocados)
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Modificable (Sin alumnos asignados)
                    </span>
                  )}
                </div>
                <select
                  disabled={Boolean(editingExam.evaluations && editingExam.evaluations.length > 0)}
                  value={editingExam.disciplineId}
                  onChange={(e) => setEditingExam({ ...editingExam, disciplineId: e.target.value })}
                  className={`w-full px-3 py-2 text-xs border rounded-xl font-medium ${
                    Boolean(editingExam.evaluations && editingExam.evaluations.length > 0)
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
                {Boolean(editingExam.evaluations && editingExam.evaluations.length > 0) ? (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    La disciplina no se puede modificar porque la convocatoria ya tiene
                    estudiantes convocados.
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Puedes modificar la disciplina libremente mientras la convocatoria no
                    tenga alumnos convocados.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Fecha del Examen
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
                    {t("dojo.feeAmountLabel", "Costo Derecho ({currency})", { currency: brandCurrency })}
                  </Label>
                  <Input
                    type="number"
                    value={editingExam.feeAmount || 0}
                    onChange={(e) =>
                      setEditingExam({ ...editingExam, feeAmount: Number(e.target.value) })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Lugar / Tatami Principal
                </Label>
                <Input
                  placeholder="ej. Dojo Central - Tatami Principal"
                  value={editingExam.location || ""}
                  onChange={(e) => setEditingExam({ ...editingExam, location: e.target.value })}
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
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingExam}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isUpdatingExam ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR ELIMINAR EXAMEN */}
      <Dialog open={Boolean(deletingExam)} onOpenChange={(open) => !open && setDeletingExam(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /> ¿Eliminar Convocatoria?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              Estás a punto de eliminar la convocatoria{" "}
              <strong className="text-zinc-900 dark:text-white">"{deletingExam?.title}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExam(null)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteExam}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* MODAL: RÚBRICA DE EVALUACIÓN TATAMI REAL (CONECTADA A BASE DE DATOS) */}
      <Dialog
        open={Boolean(evaluatingExam)}
        onOpenChange={(open) => !open && setEvaluatingExam(null)}
      >
        <DialogContent className="max-w-2xl rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              {evaluatingExam?.status === "COMPLETED"
                ? "Acta Oficial de Calificaciones (Certificada)"
                : "Rúbrica de Evaluación Tatami"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-amber-500 font-semibold flex items-center gap-2">
                <span>{evaluatingExam?.title}</span>
                {evaluatingExam?.status === "COMPLETED" && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    🔒 Concluido & Certificado (Modo Solo Lectura)
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {isLoadingEvaluations ? (
            <div className="p-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" /> Cargando alumnos y evaluaciones reales...
            </div>
          ) : evaluationsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
              <Users className="h-8 w-8 mx-auto text-zinc-400" />
              <p>No hay alumnos convocados formalmente para este examen.</p>
              <p className="text-[11px] text-zinc-500">Abre la opción "Candidatos (Semáforo 🚦)" para seleccionar e inscribir a los alumnos de la disciplina.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto py-2 pr-1">
              {evaluationsList.map((ev) => {
                const isExamFinished = evaluatingExam?.status === "COMPLETED";
                const studentName = ev.student?.user?.name || "Alumno Registrado";
                const beltName = ev.targetBelt?.name || "Cinturón Objetivo";
                const currentScore = ev.score ?? 8.0;
                const isPassed = ev.status === "PASSED" || currentScore >= 7.0;

                return (
                  <div
                    key={ev.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/40 transition-all"
                  >
                    <div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                        {studentName}
                      </div>
                      <div className="text-xs font-semibold flex items-center gap-2 mt-1">
                        <span className="text-zinc-500 font-medium">Objetivo:</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold border border-zinc-400/40 inline-flex items-center gap-1.5 shadow-2xs ${getContrastTextColor(ev.targetBelt?.colorHex)}`}
                          style={{ backgroundColor: ev.targetBelt?.colorHex || "#f59e0b" }}
                        >
                          {beltName}
                        </span>

                        {ev.isFeePaid ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold gap-1">
                            💳 Pago Cubierto
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-extrabold gap-1">
                            ⏳ Derecho Pendiente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Semáforo Rápido de 3 Niveles Visuales */}
                      {!isExamFinished && (
                        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => handleScoreChange(ev.id, 10.0)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              currentScore >= 9.0
                                ? "bg-emerald-500 text-slate-950 shadow-xs"
                                : "text-emerald-500 hover:bg-emerald-500/10"
                            }`}
                            title="🟩 100% - Dominado / Apto (✓)"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px]">10</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreChange(ev.id, 7.5)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              currentScore >= 7.0 && currentScore < 9.0
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "text-amber-500 hover:bg-amber-500/10"
                            }`}
                            title="🟡 75% - En Proceso / Aceptable (👍)"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span className="text-[10px]">7.5</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreChange(ev.id, 5.0)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              currentScore < 7.0
                                ? "bg-rose-500 text-white shadow-xs"
                                : "text-rose-500 hover:bg-rose-500/10"
                            }`}
                            title="🔴 0% - No Apto / Práctica (👎)"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span className="text-[10px]">5</span>
                          </button>
                        </div>
                      )}

                      <div className="text-right">
                        <label className="text-[10px] text-zinc-400 block font-medium">Calificación</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="10"
                          disabled={isExamFinished}
                          value={currentScore}
                          onChange={(e) => handleScoreChange(ev.id, Number(e.target.value))}
                          className={`w-16 px-2 py-1 text-center font-bold text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white ${
                            isExamFinished ? "opacity-75 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800/80" : "focus:ring-2 focus:ring-amber-500"
                          }`}
                        />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          isPassed
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                        }`}
                      >
                        {isPassed ? "Aprobado" : "Reprobado"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            {evaluatingExam?.status === "COMPLETED" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEvaluatingExam(null)}
                  className="rounded-xl text-xs"
                >
                  Cerrar Acta
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (evaluatingExam) {
                      handleOpenDiplomasForExam(evaluatingExam);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  <Printer className="h-4 w-4 mr-1.5" /> Imprimir Diplomas de la Convocatoria
                </Button>
              </>
            ) : (
              <Button
                type="button"
                disabled={isSavingEvaluations || evaluationsList.length === 0}
                onClick={handleSaveEvaluations}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs ml-auto"
              >
                {isSavingEvaluations ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Guardar Evaluación del Tatami"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DIPLOMA BUILDER MODAL REUSED FOR EXAMS */}
      <DiplomaBuilderModal
        open={isDiplomaModalOpen}
        onOpenChange={setIsDiplomaModalOpen}
        students={diplomaStudentsList}
        activeFilterDisciplineName={diplomaDisciplineName}
      />
    </div>
  );
}

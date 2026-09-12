"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  UsersRound,
  Users,
  Swords,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  LayoutGrid,
  List,
  AlertTriangle,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { PaginationControl } from "@/components/ui/pagination-control";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  getStudentGroupsByBrandAction,
  createStudentGroupAction,
  updateStudentGroupAction,
  deleteStudentGroupAction,
  assignStudentsToGroupAction,
  enrollStudentToGroupAction,
  removeStudentFromGroupAction,
  toggleStudentGroupActiveAction,
  bulkDeleteStudentGroupsAction,
  bulkToggleStudentGroupsActiveAction,
} from "@/actions/groups";
import { getDisciplinesByBrandAction } from "@/actions/disciplines";
import { getStudentsAction, createStudentAction, searchStudentsAction } from "@/actions/students";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { StudentGroupWithDetails, Discipline, StudentProfileWithUser } from "@/types";

function getStudentDisplayName(st: StudentProfileWithUser): string {
  const full = `${st.firstName || ""} ${st.lastName || ""}`.trim();
  if (full) return full;
  if (st.user?.name) return st.user.name;
  return "Alumno sin nombre";
}

function getStudentAge(birthDate?: Date | string | null): number | null {
  if (!birthDate) return null;
  const bdate = new Date(birthDate);
  if (isNaN(bdate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bdate.getFullYear();
  const m = today.getMonth() - bdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) {
    age--;
  }
  return age < 0 ? null : age;
}

function GroupsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedBrandId, brands } = useBrand();
  const { t } = useTranslation();

  const effectiveBrandId =
    selectedBrandId === "ALL" ? (brands[0]?.id || "seed-brand-general") : selectedBrandId;
  const activeBrand = brands.find((b) => b.id === effectiveBrandId) || brands[0];
  const _brandCurrency = activeBrand?.currency || "USD";

  // URL Params State
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const limitParam = parseInt(searchParams.get("limit") || "10", 10);
  const searchUrl = searchParams.get("search") || "";
  const disciplineUrl = searchParams.get("disciplineId") || "ALL";
  const viewUrl = searchParams.get("view") || "table";

  const [searchInput, setSearchInput] = useState<string>(searchUrl);
  const [disciplineInput, setDisciplineInput] = useState<string>(disciplineUrl);
  const [viewMode, setViewMode] = useState<"table" | "grid">(viewUrl as "table" | "grid");

  // Data & KPI State
  const [groups, setGroups] = useState<StudentGroupWithDetails[]>([]);
  const [totalGroups, setTotalGroups] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [totalStudentsAssigned, setTotalStudentsAssigned] = useState<number>(0);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [allStudents, setAllStudents] = useState<StudentProfileWithUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selection & Bulk Action State
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);

  // Group Create/Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroupWithDetails | null>(null);
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [minAge, setMinAge] = useState<number>(4);
  const [maxAge, setMaxAge] = useState<number>(99);
  const [enabledDisciplineIds, setEnabledDisciplineIds] = useState<string[]>([]);
  const [disciplineSchedules, setDisciplineSchedules] = useState<Record<string, string>>({});

  // Student Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [targetGroupForAssign, setTargetGroupForAssign] =
    useState<StudentGroupWithDetails | null>(null);
  const [assignModalTab, setAssignModalTab] = useState<string>("enrolled");
  const [enrolledSearchFilter, setEnrolledSearchFilter] = useState<string>("");
  const [studentSearchFilter, setStudentSearchFilter] = useState<string>("");
  const [searchResults, setSearchResults] = useState<StudentProfileWithUser[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState<boolean>(false);
  const [hasSearchedServer, setHasSearchedServer] = useState<boolean>(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState<boolean>(false);

  // Quick Student Registration State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickFirstName, setQuickFirstName] = useState<string>("");
  const [quickLastName, setQuickLastName] = useState<string>("");
  const [quickEmail, setQuickEmail] = useState<string>("");
  const [isQuickAddSubmitting, setIsQuickAddSubmitting] = useState<boolean>(false);

  // Delete Alert State
  const [deletingGroup, setDeletingGroup] = useState<StudentGroupWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // URL Helper to update params cleanly
  const updateUrlParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const fetchGroups = useCallback(async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    try {
      const [groupsRes, discRes, stRes] = await Promise.all([
        getStudentGroupsByBrandAction({
          brandId: selectedBrandId,
          search: searchUrl,
          disciplineId: disciplineUrl,
          page: pageParam,
          limit: limitParam,
        }),
        getDisciplinesByBrandAction(selectedBrandId),
        getStudentsAction({ brandId: selectedBrandId, limit: 100 }),
      ]);

      if (groupsRes.success && groupsRes.data) {
        const fetchedGroups = groupsRes.data.groups;
        setGroups(fetchedGroups);
        setTotalGroups(groupsRes.data.total);
        setTotalPages(groupsRes.data.totalPages);
        setActiveCount(groupsRes.data.activeCount);
        setTotalStudentsAssigned(groupsRes.data.totalStudentsAssigned);

        setTargetGroupForAssign((prev) => {
          if (!prev) return null;
          return fetchedGroups.find((g) => g.id === prev.id) || prev;
        });
      } else {
        setGroups([]);
      }

      if (discRes.success && discRes.data) {
        setDisciplines(discRes.data);
      }

      if (stRes.success && stRes.data) {
        setAllStudents(stRes.data.students as unknown as StudentProfileWithUser[]);
      }
    } catch {
      toast.error(t("groups.loadError", "Error al cargar información de grupos."));
    } finally {
      setIsLoading(false);
    }
  }, [selectedBrandId, searchUrl, disciplineUrl, pageParam, limitParam, t]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Bulk Selection Handlers
  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map((g) => g.id));
    }
  };

  // Bulk Action Handlers
  const handleBulkToggleActive = async (targetIsActive: boolean) => {
    if (selectedGroupIds.length === 0) return;
    try {
      const res = await bulkToggleStudentGroupsActiveAction(selectedGroupIds, targetIsActive);
      if (res.success && res.data) {
        toast.success(
          targetIsActive
            ? t("groups.bulkActivateSuccess", `Se activaron ${res.data} grupos.`, { count: res.data })
            : t("groups.bulkDeactivateSuccess", `Se desactivaron ${res.data} grupos.`, { count: res.data })
        );
        setSelectedGroupIds([]);
        fetchGroups();
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error(t("groups.saveError", "Error al procesar cambio de estado."));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGroupIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await bulkDeleteStudentGroupsAction(selectedGroupIds);
      if (res.success && res.data) {
        toast.success(
          t("groups.bulkDeleteSuccess", `Se eliminaron ${res.data} grupos seleccionados.`, {
            count: res.data,
          })
        );
        setSelectedGroupIds([]);
        setIsBulkDeleteModalOpen(false);
        fetchGroups();
      } else {
        const errorMsg = res.errorKey
          ? t(res.errorKey, res.error || "Error al eliminar grupos.", res.errorParams)
          : res.error || t("groups.deleteError", "Error al eliminar grupos.");
        toast.error(errorMsg);
      }
    } catch {
      toast.error(t("groups.deleteError", "Error al eliminar grupos."));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleToggleGroupActive = async (group: StudentGroupWithDetails) => {
    const nextState = !group.isActive;
    try {
      const res = await toggleStudentGroupActiveAction(group.id, nextState);
      if (res.success) {
        toast.success(
          nextState
            ? t("groups.groupActivated", `Grupo "${group.name}" activado.`)
            : t("groups.groupDeactivated", `Grupo "${group.name}" desactivado.`)
        );
        fetchGroups();
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error(t("groups.saveError", "Error al cambiar estado."));
    }
  };

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({
      search: searchInput.trim() || null,
      disciplineId: disciplineInput !== "ALL" ? disciplineInput : null,
      page: 1,
    });
  };

  // Pagination Handlers
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateUrlParams({ limit: newSize, page: 1 });
  };

  const handleToggleView = (mode: "table" | "grid") => {
    setViewMode(mode);
    updateUrlParams({ view: mode === "table" ? null : mode });
  };

  // Group Form Handlers
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setName("");
    setCode("");
    setDescription("");
    setMinAge(4);
    setMaxAge(99);
    setEnabledDisciplineIds(disciplines.map((d) => d.id));
    setDisciplineSchedules({});
    setIsGroupModalOpen(true);
  };

  const handleOpenEditModal = (group: StudentGroupWithDetails) => {
    setEditingGroup(group);
    setName(group.name);
    setCode(group.code || "");
    setDescription(group.description || "");
    setMinAge(group.minAge || 4);
    setMaxAge(group.maxAge || 99);

    const activeIds = group.disciplines.map((g) => g.disciplineId);
    const scheds: Record<string, string> = {};
    group.disciplines.forEach((g) => {
      scheds[g.disciplineId] = g.scheduleText || "";
    });

    setEnabledDisciplineIds(activeIds);
    setDisciplineSchedules(scheds);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!selectedBrandId) return;
    if (!name.trim()) {
      toast.error(t("groups.nameRequired", "El nombre del grupo es obligatorio."));
      return;
    }

    setIsSubmitting(true);
    try {
      const activeDiscInputs = enabledDisciplineIds.map((discId) => ({
        disciplineId: discId,
        scheduleText: (disciplineSchedules[discId] || "").trim(),
      }));

      const payload = {
        name,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        minAge,
        maxAge,
        isActive: editingGroup ? editingGroup.isActive : true,
        disciplines: activeDiscInputs,
      };

      let res;
      if (editingGroup) {
        res = await updateStudentGroupAction(editingGroup.id, payload);
      } else {
        res = await createStudentGroupAction(selectedBrandId, payload);
      }

      if (res.success) {
        toast.success(
          editingGroup
            ? t("groups.updatedSuccess", "Grupo actualizado exitosamente.")
            : t("groups.createdSuccess", "Grupo creado exitosamente.")
        );
        setIsGroupModalOpen(false);
        fetchGroups();
      } else {
        toast.error(res.error || t("groups.saveError", "Error al guardar el grupo."));
      }
    } catch {
      toast.error(t("groups.saveError", "Error al procesar la solicitud."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setIsSubmitting(true);
    try {
      const res = await deleteStudentGroupAction(deletingGroup.id);
      if (res.success) {
        toast.success(t("groups.deleteSuccess", "Grupo eliminado."));
        setDeletingGroup(null);
        fetchGroups();
      } else {
        const errorMsg = res.errorKey
          ? t(res.errorKey, res.error || "Error al eliminar el grupo.", res.errorParams)
          : res.error || t("groups.deleteError", "Error al eliminar el grupo.");
        toast.error(errorMsg);
      }
    } catch {
      toast.error(t("groups.deleteError", "Error al eliminar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Assignment Handlers (Tabbed ChessCoach Model)
  const handleOpenAssignModal = (group: StudentGroupWithDetails) => {
    setTargetGroupForAssign(group);
    setAssignModalTab(group.students && group.students.length > 0 ? "enrolled" : "search");
    setEnrolledSearchFilter("");
    setStudentSearchFilter("");
    setSearchResults([]);
    setHasSearchedServer(false);
    setQuickFirstName("");
    setQuickLastName("");
    setQuickEmail("");
    setIsAssignModalOpen(true);
  };

  const handleExecuteServerSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentSearchFilter.trim() || studentSearchFilter.trim().length < 2) {
      toast.error(t("groups.searchMinChars", "Ingresa al menos 2 caracteres para buscar."));
      return;
    }

    setIsSearchingServer(true);
    try {
      const res = await searchStudentsAction(effectiveBrandId, studentSearchFilter.trim());
      if (res.success && res.data) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      toast.error(t("groups.searchError", "Error al buscar alumnos en el servidor."));
    } finally {
      setIsSearchingServer(false);
      setHasSearchedServer(true);
    }
  };

  const handleEnrollStudent = async (studentId: string) => {
    if (!targetGroupForAssign) return;
    setIsActionSubmitting(true);
    try {
      const res = await enrollStudentToGroupAction(targetGroupForAssign.id, studentId);
      if (res.success) {
        toast.success(t("groups.enrollSuccessSingle", "Alumno inscrito al grupo."));
        fetchGroups();
      } else {
        toast.error(res.error || t("groups.assignError", "Error al inscribir alumno."));
      }
    } catch {
      toast.error(t("groups.assignError", "Error al inscribir alumno."));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!targetGroupForAssign) return;
    setIsActionSubmitting(true);
    try {
      const res = await removeStudentFromGroupAction(targetGroupForAssign.id, studentId);
      if (res.success) {
        toast.success(t("groups.unenrollSuccess", "Alumno desvinculado del grupo."));
        fetchGroups();
      } else {
        toast.error(res.error || t("groups.assignError", "Error al desvincular alumno."));
      }
    } catch {
      toast.error(t("groups.assignError", "Error al desvincular alumno."));
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleQuickCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetGroupForAssign) return;
    if (!quickFirstName.trim()) {
      toast.error(t("groups.firstNameRequired", "El nombre del alumno es obligatorio."));
      return;
    }

    setIsQuickAddSubmitting(true);
    try {
      const res = await createStudentAction({
        brandId: effectiveBrandId,
        firstName: quickFirstName.trim(),
        lastName: quickLastName.trim() || undefined,
        email: quickEmail.trim() || undefined,
      });

      if (res.success && res.data) {
        const newStudent = res.data as unknown as StudentProfileWithUser;
        const displayName = getStudentDisplayName(newStudent);

        const enrollRes = await enrollStudentToGroupAction(
          targetGroupForAssign.id,
          newStudent.id
        );

        if (enrollRes.success) {
          toast.success(
            t(
              "groups.quickStudentCreated",
              `Alumno "${displayName}" registrado e inscrito a la clase.`,
              { name: displayName }
            )
          );
          setAllStudents((prev) => [newStudent, ...prev]);
          fetchGroups();
          setQuickFirstName("");
          setQuickLastName("");
          setQuickEmail("");
          setAssignModalTab("enrolled");
        } else {
          toast.error(enrollRes.error || t("groups.assignError", "Error al inscribir alumno."));
        }
      } else {
        toast.error(res.error || t("groups.saveError", "Error al crear alumno."));
      }
    } catch {
      toast.error(t("groups.saveError", "Error al procesar alta rápida."));
    } finally {
      setIsQuickAddSubmitting(false);
    }
  };

  const allSelected = groups.length > 0 && selectedGroupIds.length === groups.length;

  const enrolledStudentIds = (targetGroupForAssign?.students || []).map((s) => s.studentId);

  const filteredEnrolledStudents = (targetGroupForAssign?.students || []).filter((item) => {
    const st = item.student;
    if (!st) return false;
    const displayName = getStudentDisplayName(st).toLowerCase();
    const emailToDisplay = (st.user?.email || st.email || "").toLowerCase();
    const q = enrolledSearchFilter.toLowerCase().trim();
    return displayName.includes(q) || emailToDisplay.includes(q);
  });

  const filteredAllStudents = allStudents.filter((st) => {
    const displayName = getStudentDisplayName(st).toLowerCase();
    const emailToDisplay = (st.user?.email || st.email || "").toLowerCase();
    const q = studentSearchFilter.toLowerCase().trim();
    return displayName.includes(q) || emailToDisplay.includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <UsersRound className="h-7 w-7 text-amber-500" />
            {t("groups.title", "Grupos y Clases Multi-Disciplina")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t(
              "groups.subtitle",
              "Organiza tus alumnos por horarios (Mayores Principiantes, Avanzados) y combina múltiples disciplinas por día."
            )}
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-sm text-xs cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2 text-slate-950" /> {t("groups.createButton", "Nuevo Grupo")}
        </Button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("groups.kpiRegistered", "Grupos Registrados")}
            </CardTitle>
            <UsersRound className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {totalGroups}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("groups.kpiRegisteredSub", "Clases activas en el dojo")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("groups.kpiStudents", "Alumnos Agrupados")}
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalStudentsAssigned}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("groups.kpiStudentsSub", "Asignados a grupos de entrenamiento")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("groups.kpiDisciplines", "Disciplinas Activas")}
            </CardTitle>
            <Swords className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {disciplines.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("groups.kpiDisciplinesSub", "Disciplinas marciales del dojo")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("groups.kpiEnabled", "Grupos Habilitados")}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {activeCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("groups.kpiEnabledSub", "Horarios en impartición")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar with Search, Discipline Select & View Toggle */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm h-10 flex items-center">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("groups.searchPlaceholder", "Buscar grupo por nombre, código o descripción...")}
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

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/60 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleView("table")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title={t("groups.tableView", "Tabla")}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">{t("groups.tableView", "Tabla")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleView("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title={t("groups.gridView", "Tarjetas")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{t("groups.gridView", "Tarjetas")}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Main Content Container */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur overflow-hidden">
        {viewMode === "table" ? (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAllGroups}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="font-bold text-xs">{t("groups.colGroup", "Grupo")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("groups.colSchedules", "Disciplinas & Horarios")}</TableHead>
                  <TableHead className="font-bold text-xs">{t("groups.colStudentsAndAge", "Alumnos & Edad")}</TableHead>
                  <TableHead className="font-bold text-xs text-right">{t("groups.colActions", "Acciones")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="h-14 text-center">
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse w-3/4 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-zinc-400">
                      <UsersRound className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                      <p className="font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                        {t("groups.emptyTitle", "No hay grupos registrados")}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {t(
                          "groups.emptyDesc",
                          "Crea tu primer grupo como Mayores Principiantes para asociar disciplinas y horarios."
                        )}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.id);
                    return (
                      <TableRow
                        key={group.id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                          isSelected ? "bg-amber-500/5 dark:bg-amber-500/10" : ""
                        }`}
                      >
                        <TableCell className="py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGroupSelection(group.id)}
                            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center shrink-0">
                              <UsersRound className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-2">
                                {group.name}
                                {group.code && (
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {group.code}
                                  </Badge>
                                )}
                                <span
                                  onClick={() => handleToggleGroupActive(group)}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                    group.isActive
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300"
                                  }`}
                                >
                                  {group.isActive ? t("common.active", "Activo") : t("common.inactive", "Inactivo")}
                                </span>
                              </div>
                              {group.description && (
                                <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{group.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5 py-0.5">
                            {group.disciplines.length === 0 ? (
                              <span className="text-xs text-zinc-400 italic">
                                {t("groups.noSchedules", "Sin horarios")}
                              </span>
                            ) : (
                              group.disciplines.map((gd) => (
                                <div key={gd.id} className="flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
                                  >
                                    <Swords className="w-3 h-3 text-amber-500" />
                                    {gd.discipline.name}
                                  </Badge>
                                  {gd.scheduleText && (
                                    <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                                      {gd.scheduleText}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              {group.students.length > 0 && (
                                <div className="flex -space-x-2 overflow-hidden shrink-0">
                                  {group.students.slice(0, 3).map((st) => (
                                    <div
                                      key={st.id}
                                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center border border-amber-500/30 shrink-0"
                                      title={getStudentDisplayName(st.student as unknown as StudentProfileWithUser)}
                                    >
                                      {getStudentDisplayName(st.student as unknown as StudentProfileWithUser).slice(0, 2).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold whitespace-nowrap">
                                {group.students.length} {group.students.length === 1 ? t("groups.studentSingle", "alumno") : t("groups.studentsCount", "alumnos")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>
                                {group.minAge || 4} - {group.maxAge || 99} {t("groups.yearsOld", "años")}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAssignModal(group)}
                              className="h-8 text-xs gap-1 px-2.5 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl cursor-pointer font-bold whitespace-nowrap"
                              title={t("groups.manageStudents", "Gestionar Alumnos")}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t("groups.manage", "Gestionar")}</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditModal(group)}
                              className="w-8 h-8 p-0 text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all shrink-0"
                              title={t("groups.editModalTitle", "Editar Grupo")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingGroup(group)}
                              className="w-8 h-8 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all shrink-0"
                              title={t("groups.confirmDelete", "Eliminar Grupo")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
              ))
            ) : groups.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-400">
                <UsersRound className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("groups.emptyTitle", "No hay grupos registrados")}
                </h3>
              </div>
            ) : (
              groups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <Card
                    key={group.id}
                    className={`bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all shadow-sm flex flex-col justify-between relative ${
                      isSelected ? "ring-2 ring-amber-500 border-amber-500" : ""
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleGroupSelection(group.id)}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                                {group.name}
                              </h3>
                              {group.code && (
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {group.code}
                                </Badge>
                              )}
                              <span
                                onClick={() => handleToggleGroupActive(group)}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-all ${
                                  group.isActive
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300"
                                }`}
                              >
                                {group.isActive ? t("common.active", "Activo") : t("common.inactive", "Inactivo")}
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-amber-500"
                            onClick={() => handleOpenEditModal(group)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-rose-500"
                            onClick={() => setDeletingGroup(group)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {t("groups.ageRangeLabel", "Rango de edad")}: {group.minAge || 4} - {group.maxAge || 99} {t("groups.yearsOld", "años")}
                        </span>
                      </div>

                      <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          {t("groups.colSchedules", "Disciplinas & Horarios")}
                        </span>
                        {group.disciplines.length === 0 ? (
                          <p className="text-xs text-zinc-400 italic">
                            {t("groups.noDisciplinesAssigned", "Sin horarios asignados")}
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {group.disciplines.map((gd) => (
                              <div
                                key={gd.id}
                                className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-lg"
                              >
                                <div className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
                                  <Swords className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{gd.discipline.name}</span>
                                </div>
                                {gd.scheduleText && (
                                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                    {gd.scheduleText}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                          <Users className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {group.students.length}
                          </span>{" "}
                          {t("groups.studentsEnrolled", "alumnos asignados")}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          onClick={() => handleOpenAssignModal(group)}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          {t("groups.manage", "Gestionar")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ALWAYS VISIBLE PAGINATION CONTROL */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
          <PaginationControl
            currentPage={pageParam}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={limitParam}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </Card>

      {/* Floating Bulk Action Bar */}
      {selectedGroupIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-950/95 dark:bg-zinc-900/95 backdrop-blur-md border border-amber-500/30 text-white p-2 px-3 rounded-2xl shadow-2xl flex items-center justify-center gap-2 z-50 animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0">
            {selectedGroupIds.length} {t("groups.selectedCount", "selec.")}
          </span>

          <div className="h-4 w-[1px] bg-white/10 shrink-0" />

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => handleBulkToggleActive(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" /> {t("groups.bulkActivate", "Activar")} ({selectedGroupIds.length})
            </button>

            <button
              type="button"
              onClick={() => handleBulkToggleActive(false)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" /> {t("groups.bulkDeactivate", "Desactivar")} ({selectedGroupIds.length})
            </button>

            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t("groups.bulkDelete", "Eliminar")} ({selectedGroupIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Clean Group Create/Edit Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-amber-500" />
              {editingGroup
                ? t("groups.editModalTitle", "Editar Grupo de Alumnos")
                : t("groups.createModalTitle", "Nuevo Grupo por Nivel / Horario")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t(
                "groups.modalDesc",
                "Define un grupo (ej. Mayores Principiantes) y asigna las disciplinas y días de entrenamiento."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="group-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("groups.nameLabel", "Nombre del Grupo *")}
                </Label>
                <Input
                  id="group-name"
                  placeholder={t("groups.namePlaceholder", "ej. Mayores Principiantes")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="group-code" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("groups.codeLabel", "Código")}
                </Label>
                <Input
                  id="group-code"
                  placeholder="MAY-PRIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-10 text-xs rounded-xl font-mono uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-desc" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t("groups.descLabel", "Descripción")}
              </Label>
              <Input
                id="group-desc"
                placeholder={t("groups.descPlaceholder", "ej. Entrenan Tai Chi y Sanda en días alternos")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("groups.minAgeLabel", "Edad Mínima")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("groups.maxAgeLabel", "Edad Máxima")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            {/* Disciplines + Schedule Checkbox List */}
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <Label className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  {t("groups.assignSchedules", "Disciplinas y Horarios por Día")}
                </Label>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {t("groups.assignSchedulesHelp", "Selecciona las disciplinas que se imparten en esta clase e ingresa su horario de entrenamiento:")}
                </p>
              </div>

              <div className="space-y-2">
                {disciplines.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-2">
                    {t("groups.noDisciplinesFound", "No hay disciplinas registradas en la escuela.")}
                  </p>
                ) : (
                  disciplines.map((d) => {
                    const isEnabled = enabledDisciplineIds.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          isEnabled
                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 dark:border-amber-500/30"
                            : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => {
                                setEnabledDisciplineIds((prev) =>
                                  prev.includes(d.id)
                                    ? prev.filter((id) => id !== d.id)
                                    : [...prev, d.id]
                                );
                              }}
                              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <Swords className="w-3.5 h-3.5 text-amber-500" />
                              {d.name} {d.code ? `(${d.code})` : ""}
                            </span>
                          </label>
                        </div>

                        {isEnabled && (
                          <div className="pl-6 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            <Input
                              placeholder={t(
                                "groups.schedulePlaceholder",
                                "ej. Martes y Jueves 18:00 - 19:30"
                              )}
                              value={disciplineSchedules[d.id] || ""}
                              onChange={(e) => {
                                setDisciplineSchedules((prev) => ({
                                  ...prev,
                                  [d.id]: e.target.value,
                                }));
                              }}
                              className="text-xs h-9 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGroupModalOpen(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              type="button"
              onClick={handleSaveGroup}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redesigned Tabbed ChessCoach Student Group Enrollment Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              {t("groups.assignModalTitle", "Inscribir Alumnos")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <strong className="text-amber-600 dark:text-amber-400 font-bold">
                {targetGroupForAssign?.name}
              </strong>{" "}
              - {t("groups.assignModalDesc", "Gestiona los alumnos pertenecientes a esta clase.")}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={assignModalTab}
            onValueChange={setAssignModalTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6">
              <TabsList className="bg-zinc-100 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 w-full p-1 rounded-xl h-11">
                <TabsTrigger
                  value="enrolled"
                  className="flex-1 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 text-zinc-600 dark:text-zinc-400 transition-all text-xs font-bold cursor-pointer gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {t("groups.tabEnrolled", "Inscritos")} (
                  {targetGroupForAssign?.students?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="flex-1 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 text-zinc-600 dark:text-zinc-400 transition-all text-xs font-bold cursor-pointer gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  {t("groups.tabSearch", "Buscar Existente")}
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="flex-1 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 text-zinc-600 dark:text-zinc-400 transition-all text-xs font-bold cursor-pointer gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t("groups.tabQuickAdd", "Nuevo Registro")}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab 1: Enrolled Students List */}
            <TabsContent
              value="enrolled"
              className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar"
            >
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                <Input
                  placeholder={t(
                    "groups.searchEnrolledPlaceholder",
                    "Filtrar alumnos inscritos por nombre..."
                  )}
                  value={enrolledSearchFilter}
                  onChange={(e) => setEnrolledSearchFilter(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                />
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredEnrolledStudents.length === 0 ? (
                  <div className="py-8 text-center text-zinc-400 text-xs space-y-2">
                    <Users className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                    <p>
                      {enrolledSearchFilter
                        ? t(
                            "groups.noStudentsMatched",
                            "No se encontraron alumnos con ese criterio."
                          )
                        : t(
                            "groups.noEnrolledStudents",
                            "No hay alumnos inscritos en este grupo aún."
                          )}
                    </p>
                    {!enrolledSearchFilter && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignModalTab("search")}
                        className="mt-2 text-xs rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 mr-1" />
                        {t("groups.tabSearch", "Buscar Alumno Existente")}
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredEnrolledStudents.map((item) => {
                    const st = item.student;
                    if (!st) return null;
                    const nameToDisplay = getStudentDisplayName(st);
                    const emailToDisplay = st.user?.email || st.email || "";
                    const studentAge = getStudentAge(st.birthDate);
                    const minAge = targetGroupForAssign?.minAge ?? 0;
                    const maxAge = targetGroupForAssign?.maxAge ?? 99;
                    const isAgeMatch = studentAge === null || (studentAge >= minAge && studentAge <= maxAge);

                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                            {nameToDisplay.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                                {nameToDisplay}
                              </p>
                              {studentAge !== null && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                    isAgeMatch
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {studentAge} años{!isAgeMatch && ` ⚠️`}
                                </span>
                              )}
                            </div>
                            {emailToDisplay && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {emailToDisplay}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveStudent(st.id)}
                          disabled={isActionSubmitting}
                          className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg px-2.5 shrink-0 gap-1 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          {t("groups.unenrollBtn", "Desvincular")}
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Tab 2: Backend Server Search for Existing Students */}
            <TabsContent
              value="search"
              className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar"
            >
              <form onSubmit={handleExecuteServerSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <Input
                    placeholder={t(
                      "groups.searchStudentPlaceholder",
                      "Buscar alumno por nombre o correo..."
                    )}
                    value={studentSearchFilter}
                    onChange={(e) => setStudentSearchFilter(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearchingServer || studentSearchFilter.trim().length < 2}
                  className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 rounded-xl cursor-pointer shrink-0 shadow-xs"
                >
                  {isSearchingServer ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    t("common.search", "Buscar")
                  )}
                </Button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {isSearchingServer ? (
                  <div className="py-12 text-center text-amber-500 space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
                    <p className="text-xs font-bold">
                      {t("groups.searchingServer", "Buscando alumnos en la base de datos...")}
                    </p>
                  </div>
                ) : !hasSearchedServer ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <div className="h-12 w-12 bg-zinc-100 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <p className="text-xs max-w-[240px] mx-auto leading-relaxed font-medium">
                      {t(
                        "groups.searchInitialHelp",
                        "Escribe el nombre o correo del alumno y haz clic en 'Buscar' para consultar la base del dojo."
                      )}
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-12">
                    {t(
                      "groups.noStudentsMatched",
                      "No se encontraron alumnos con ese criterio."
                    )}
                  </p>
                ) : (
                  searchResults.map((st) => {
                    const isEnrolled = enrolledStudentIds.includes(st.id);
                    const nameToDisplay = getStudentDisplayName(st);
                    const emailToDisplay = st.user?.email || st.email || "";
                    const studentAge = getStudentAge(st.birthDate);
                    const minAge = targetGroupForAssign?.minAge ?? 0;
                    const maxAge = targetGroupForAssign?.maxAge ?? 99;
                    const isAgeMatch =
                      studentAge === null || (studentAge >= minAge && studentAge <= maxAge);

                    return (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                            {nameToDisplay.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                                {nameToDisplay}
                              </p>
                              {studentAge !== null && (
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                                    isAgeMatch
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {studentAge} años{!isAgeMatch && ` ⚠️`}
                                </span>
                              )}
                            </div>
                            {emailToDisplay && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {emailToDisplay}
                              </p>
                            )}
                          </div>
                        </div>

                        {isEnrolled ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] h-7 px-2.5 font-bold gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-500" />
                            {t("groups.enrolledBadge", "Inscrito")}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleEnrollStudent(st.id)}
                            disabled={isActionSubmitting}
                            className="h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 rounded-lg shrink-0 cursor-pointer shadow-xs"
                          >
                            {t("groups.enrollBtn", "Inscribir")}
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Tab 3: Quick Student Registration */}
            <TabsContent
              value="create"
              className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
              <form onSubmit={handleQuickCreateStudent} className="space-y-4">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-1">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    {t("groups.quickAddStudent", "Alta Rápida de Alumno")}
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t(
                      "groups.quickAddStudentDesc",
                      "Registra un nuevo practicante e inscríbelo directamente a esta clase."
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t("students.firstName", "Nombre(s)")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="ej. Juan"
                      value={quickFirstName}
                      onChange={(e) => setQuickFirstName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t("students.lastName", "Apellidos")}
                    </Label>
                    <Input
                      placeholder="ej. Pérez"
                      value={quickLastName}
                      onChange={(e) => setQuickLastName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      {t("students.email", "Correo Electrónico")} (
                      {t("common.optional", "Opcional")})
                    </Label>
                    <Input
                      type="email"
                      placeholder="ej. alumno@ejemplo.com"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isQuickAddSubmitting}
                    className="h-9 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-5 rounded-xl cursor-pointer shadow-xs"
                  >
                    {isQuickAddSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t("groups.registerAndEnroll", "Registrar e Inscribir")
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <DialogFooter className="p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("common.close", "Cerrar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog
        open={Boolean(deletingGroup)}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /> {t("groups.confirmDelete", "¿Eliminar Grupo?")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              {t(
                "groups.confirmDeleteDesc",
                `Estás a punto de eliminar el grupo "${deletingGroup?.name}". Esta acción desvinculará los horarios y alumnos asignados.`,
                { name: deletingGroup?.name }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => setDeletingGroup(null)}
              className="rounded-xl text-xs"
            >
              {t("common.cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleDeleteGroup}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("groups.deleteConfirmBtn", "Sí, Eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Modal */}
      <AlertDialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />{" "}
              {t("groups.bulkDeleteModalTitle", `¿Eliminar ${selectedGroupIds.length} grupos seleccionados?`, {
                count: selectedGroupIds.length,
              })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              {t(
                "groups.bulkDeleteModalDesc",
                "Esta acción eliminará permanentemente los grupos seleccionados y desvinculará a sus alumnos. ¿Deseas continuar?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel
              disabled={isBulkDeleting}
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("common.cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("groups.deleteConfirmBtn", "Sí, Eliminar")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center flex items-center justify-center gap-2 text-amber-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <GroupsPageContent />
    </Suspense>
  );
}

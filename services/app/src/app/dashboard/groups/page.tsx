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
} from "@/actions/groups";
import { getDisciplinesByBrandAction } from "@/actions/disciplines";
import { getStudentsAction } from "@/actions/students";
import type { StudentGroupWithDetails, Discipline, StudentProfileWithUser } from "@/types";

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

  // Group Create/Edit Modal State
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroupWithDetails | null>(null);
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [minAge, setMinAge] = useState<number>(4);
  const [maxAge, setMaxAge] = useState<number>(99);
  const [selectedDisciplines, setSelectedDisciplines] = useState<
    { disciplineId: string; scheduleText: string }[]
  >([]);

  // Student Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [targetGroupForAssign, setTargetGroupForAssign] =
    useState<StudentGroupWithDetails | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

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
        setGroups(groupsRes.data.groups);
        setTotalGroups(groupsRes.data.total);
        setTotalPages(groupsRes.data.totalPages);
        setActiveCount(groupsRes.data.activeCount);
        setTotalStudentsAssigned(groupsRes.data.totalStudentsAssigned);
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
    setSelectedDisciplines(
      disciplines.map((d) => ({
        disciplineId: d.id,
        scheduleText: "",
      }))
    );
    setIsGroupModalOpen(true);
  };

  const handleOpenEditModal = (group: StudentGroupWithDetails) => {
    setEditingGroup(group);
    setName(group.name);
    setCode(group.code || "");
    setDescription(group.description || "");
    setMinAge(group.minAge || 4);
    setMaxAge(group.maxAge || 99);

    const mapped = disciplines.map((d) => {
      const found = group.disciplines.find((g) => g.disciplineId === d.id);
      return {
        disciplineId: d.id,
        scheduleText: found?.scheduleText || "",
      };
    });

    setSelectedDisciplines(mapped);
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
      const activeDiscInputs = selectedDisciplines.filter(
        (d) => d.scheduleText.trim().length > 0
      );

      const payload = {
        name,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        minAge,
        maxAge,
        isActive: true,
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
        toast.error(res.error || t("groups.deleteError", "Error al eliminar el grupo."));
      }
    } catch {
      toast.error(t("groups.deleteError", "Error al eliminar."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Assignment Handlers
  const handleOpenAssignModal = (group: StudentGroupWithDetails) => {
    setTargetGroupForAssign(group);
    const existingIds = group.students.map((s) => s.studentId);
    setSelectedStudentIds(existingIds);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssign = async () => {
    if (!targetGroupForAssign) return;
    setIsSubmitting(true);
    try {
      const res = await assignStudentsToGroupAction({
        groupId: targetGroupForAssign.id,
        studentIds: selectedStudentIds,
      });

      if (res.success) {
        toast.success(t("groups.assignSuccess", "Alumnos asignados al grupo."));
        setIsAssignModalOpen(false);
        fetchGroups();
      } else {
        toast.error(res.error || t("groups.assignError", "Error al asignar alumnos."));
      }
    } catch {
      toast.error(t("groups.assignError", "Error al procesar asignación."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentSelection = (stId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    );
  };

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
              Grupos Registrados
            </CardTitle>
            <UsersRound className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
              {totalGroups}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Clases activas en el dojo</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Alumnos Agrupados
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalStudentsAssigned}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Asignados a grupos de entrenamiento</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Disciplinas Activas
            </CardTitle>
            <Swords className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {disciplines.length}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Disciplinas marciales del dojo</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Grupos Habilitados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {activeCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Horarios en impartición</p>
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
              title="Vista de Tabla"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleView("grid")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Tarjetas</span>
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
                  <TableHead className="font-bold text-xs">Grupo</TableHead>
                  <TableHead className="font-bold text-xs">Disciplinas & Horarios</TableHead>
                  <TableHead className="font-bold text-xs">Rango de Edad</TableHead>
                  <TableHead className="font-bold text-xs">Alumnos Asignados</TableHead>
                  <TableHead className="font-bold text-xs text-right">Acciones</TableHead>
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
                  groups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <TableCell>
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
                            </div>
                            {group.description && (
                              <p className="text-xs text-zinc-500 line-clamp-1">{group.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {group.disciplines.length === 0 ? (
                            <span className="text-xs text-zinc-400 italic">Sin horarios</span>
                          ) : (
                            group.disciplines.map((gd) => (
                              <Badge
                                key={gd.id}
                                variant="outline"
                                className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 font-bold px-2.5 py-1 flex items-center gap-1.5 rounded-xl shadow-2xs"
                              >
                                <Swords className="w-3 h-3 text-amber-500" />
                                {gd.discipline.name}
                                {gd.scheduleText && (
                                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 border-l border-amber-500/30 pl-1.5 ml-1">
                                    {gd.scheduleText}
                                  </span>
                                )}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>
                            {group.minAge || 4} - {group.maxAge || 99} {t("common.years", "años")}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {group.students.slice(0, 3).map((st) => (
                              <div
                                key={st.id}
                                className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] flex items-center justify-center border border-amber-500/30 shrink-0"
                                title={st.student?.user?.name || "Alumno"}
                              >
                                {st.student?.user?.name?.slice(0, 2).toUpperCase() || "AL"}
                              </div>
                            ))}
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            {group.students.length} alumnos
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenAssignModal(group)}
                            className="h-8 text-xs gap-1 border border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl"
                            title="Gestionar Alumnos"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Gestionar</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(group)}
                            className="w-8 h-8 p-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer transition-all"
                            title="Editar Grupo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingGroup(group)}
                            className="w-8 h-8 p-0 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-all"
                            title="Eliminar Grupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
              groups.map((group) => (
                <Card
                  key={group.id}
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 transition-all shadow-sm flex flex-col justify-between"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
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
                        </div>
                        {group.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
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
                        Rango de edad: {group.minAge || 4} - {group.maxAge || 99} años
                      </span>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Disciplinas & Horarios
                      </span>
                      {group.disciplines.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">Sin horarios asignados</p>
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
                        alumnos asignados
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => handleOpenAssignModal(group)}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Gestionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
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

      {/* Group Create/Edit Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {editingGroup
                ? t("groups.editModalTitle", "Editar Grupo de Alumnos")
                : t("groups.createModalTitle", "Nuevo Grupo por Nivel / Horario")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "groups.modalDesc",
                "Define un grupo (ej. Mayores Principiantes) y asigna las disciplinas y días de entrenamiento."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="group-name">{t("groups.nameLabel", "Nombre del Grupo *")}</Label>
                <Input
                  id="group-name"
                  placeholder="ej. Mayores Principiantes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="group-code">{t("groups.codeLabel", "Código")}</Label>
                <Input
                  id="group-code"
                  placeholder="MAY-PRIN"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-desc">{t("groups.descLabel", "Descripción")}</Label>
              <Input
                id="group-desc"
                placeholder="ej. Entrenan Tai Chi y Sanda en días alternos"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("groups.minAgeLabel", "Edad Mínima")}</Label>
                <Input
                  type="number"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("groups.maxAgeLabel", "Edad Máxima")}</Label>
                <Input
                  type="number"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Disciplines + Schedule mapping */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="font-bold text-xs uppercase tracking-wider text-zinc-500">
                {t("groups.assignSchedules", "Disciplinas y Horarios por Día")}
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedDisciplines.map((sd, idx) => {
                  const discObj = disciplines.find((d) => d.id === sd.disciplineId);
                  return (
                    <div
                      key={sd.disciplineId}
                      className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-800/40"
                    >
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-amber-500" />
                        {discObj?.name || "Disciplina"}
                      </span>
                      <Input
                        placeholder="ej. Martes y Jueves 18:00 - 19:30"
                        value={sd.scheduleText}
                        onChange={(e) => {
                          const updated = [...selectedDisciplines];
                          updated[idx].scheduleText = e.target.value;
                          setSelectedDisciplines(updated);
                        }}
                        className="text-xs h-8 bg-white dark:bg-zinc-900"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGroupModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleSaveGroup}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {t("common.save", "Guardar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Students Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              {t("groups.assignModalTitle", "Asignar Alumnos al Grupo")}
            </DialogTitle>
            <DialogDescription>
              {targetGroupForAssign?.name} - Selecciona los alumnos pertenecientes a esta clase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-64 overflow-y-auto pr-1">
            {allStudents.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-4">
                {t("groups.noStudentsRegistered", "No hay alumnos registrados en el dojo.")}
              </p>
            ) : (
              allStudents.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentSelection(st.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-zinc-100"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">
                        {st.user?.name || "Alumno sin nombre"}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {st.user?.email}
                      </p>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleSaveAssign}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {t("groups.saveAssignment", "Guardar Asignación")}
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
              <AlertTriangle className="h-5 w-5 shrink-0" /> ¿Eliminar Grupo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              Estás a punto de eliminar el grupo{" "}
              <strong className="text-zinc-900 dark:text-white">"{deletingGroup?.name}"</strong>. Esta acción desvinculará los horarios y alumnos asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              onClick={() => setDeletingGroup(null)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={handleDeleteGroup}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, Eliminar"}
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

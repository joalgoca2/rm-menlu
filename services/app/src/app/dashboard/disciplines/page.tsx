"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Swords,
  Award,
  Layers,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Flame,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getDisciplinesByBrandAction,
  createDisciplineAction,
  updateDisciplineAction,
  deleteDisciplineAction,
  toggleDisciplineActiveAction,
  getBeltsByDisciplineAction,
  createBeltAction,
  updateBeltAction,
  deleteBeltAction,
  reorderBeltsAction,
} from "@/actions/disciplines";
import type { Discipline, Belt } from "@/types";

export default function DisciplinesPage() {
  const { selectedBrandId } = useBrand();
  const { t } = useTranslation();

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBelts, setIsLoadingBelts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states for Create Discipline
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [newDisciplineCode, setNewDisciplineCode] = useState("");
  const [isCreatingDiscipline, setIsCreatingDiscipline] = useState(false);

  // Form states for Create Belt
  const [newBeltName, setNewBeltName] = useState("");
  const [newBeltColor, setNewBeltColor] = useState("#F59E0B");
  const [newBeltClasses, setNewBeltClasses] = useState(24);
  const [newBeltMonths, setNewBeltMonths] = useState(3);
  const [isCreatingBelt, setIsCreatingBelt] = useState(false);

  // Edit / Delete states (Modals)
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [deletingDiscipline, setDeletingDiscipline] = useState<Discipline | null>(null);
  const [editingBelt, setEditingBelt] = useState<Belt | null>(null);
  const [deletingBelt, setDeletingBelt] = useState<Belt | null>(null);

  const [isSavingEditDiscipline, setIsSavingEditDiscipline] = useState(false);
  const [isSavingEditBelt, setIsSavingEditBelt] = useState(false);

  // Fetch Disciplines from DB
  const fetchDisciplines = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    try {
      const res = await getDisciplinesByBrandAction(selectedBrandId);
      if (res.success && res.data) {
        setDisciplines(res.data);
        if (res.data.length > 0 && !selectedDiscipline) {
          setSelectedDiscipline(res.data[0]);
        }
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Error al cargar disciplinas del dojo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Belts for selected discipline
  const fetchBelts = async (disciplineId: string) => {
    setIsLoadingBelts(true);
    try {
      const res = await getBeltsByDisciplineAction(disciplineId);
      if (res.success && res.data) {
        setBelts(res.data);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Error al cargar cinturones de la disciplina.");
    } finally {
      setIsLoadingBelts(false);
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, [selectedBrandId]);

  useEffect(() => {
    if (selectedDiscipline) {
      fetchBelts(selectedDiscipline.id);
    }
  }, [selectedDiscipline]);

  // Create Discipline Handler
  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisciplineName.trim()) {
      toast.error("Por favor ingresa el nombre de la disciplina.");
      return;
    }

    setIsCreatingDiscipline(true);
    try {
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await createDisciplineAction({
        brandId: brandToUse,
        name: newDisciplineName.trim(),
        code: newDisciplineCode.trim(),
      });

      if (res.success && res.data) {
        toast.success(`Disciplina "${res.data.name}" creada correctamente.`);
        setNewDisciplineName("");
        setNewDisciplineCode("");
        setSelectedDiscipline(res.data);
        fetchDisciplines();
      } else {
        toast.error(res.error || "No se pudo crear la disciplina.");
      }
    } catch {
      toast.error("Error inesperado al crear disciplina.");
    } finally {
      setIsCreatingDiscipline(false);
    }
  };

  // Move Belt Up or Down in Hierarchy
  const handleMoveBelt = async (index: number, direction: "up" | "down") => {
    if (!selectedDiscipline) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= belts.length) return;

    const newBelts = [...belts];
    const [moved] = newBelts.splice(index, 1);
    newBelts.splice(targetIndex, 0, moved);

    const reordered = newBelts.map((b, i) => ({ ...b, orderIndex: i + 1 }));
    setBelts(reordered);

    try {
      const ids = reordered.map((b) => b.id);
      const res = await reorderBeltsAction(ids);
      if (res.success) {
        toast.success("Jerarquía de cinturones reordenada correctamente.");
      } else {
        toast.error(res.error || "No se pudo reordenar los cinturones.");
        fetchBelts(selectedDiscipline.id);
      }
    } catch {
      toast.error("Error al guardar el nuevo orden.");
      fetchBelts(selectedDiscipline.id);
    }
  };

  // Update Discipline Handler
  const handleUpdateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDiscipline || !editingDiscipline.name.trim()) return;

    setIsSavingEditDiscipline(true);
    try {
      const res = await updateDisciplineAction(
        editingDiscipline.id,
        editingDiscipline.name.trim(),
        editingDiscipline.code ? editingDiscipline.code.trim() : ""
      );

      if (res.success && res.data) {
        toast.success("Disciplina actualizada correctamente.");
        setEditingDiscipline(null);
        fetchDisciplines();
        if (selectedDiscipline?.id === res.data.id) {
          setSelectedDiscipline(res.data);
        }
      } else {
        toast.error(res.error || "Error al actualizar la disciplina.");
      }
    } catch {
      toast.error("Error al actualizar la disciplina.");
    } finally {
      setIsSavingEditDiscipline(false);
    }
  };

  // Delete Discipline Handler
  const handleDeleteDiscipline = async () => {
    if (!deletingDiscipline) return;
    const targetId = deletingDiscipline.id;
    try {
      const res = await deleteDisciplineAction(targetId);

      if (res.success) {
        toast.success(`Disciplina "${deletingDiscipline.name}" eliminada.`);
        setDeletingDiscipline(null);
        const remaining = disciplines.filter((d) => d.id !== targetId);
        setDisciplines(remaining);
        if (selectedDiscipline?.id === targetId) {
          setSelectedDiscipline(remaining.length > 0 ? remaining[0] : null);
          setBelts([]);
        }
      } else {
        toast.error(res.error || "No se pudo eliminar la disciplina.");
      }
    } catch {
      toast.error("Error al eliminar la disciplina.");
    }
  };

  // Toggle Discipline Active/Inactive Handler
  const handleToggleDisciplineActive = async (disc: Discipline) => {
    const currentActive = disc.isActive !== false;
    const nextState = !currentActive;
    try {
      const res = await toggleDisciplineActiveAction(disc.id, nextState);
      if (res.success) {
        toast.success(
          nextState
            ? `Disciplina "${disc.name}" activada correctamente.`
            : `Disciplina "${disc.name}" desactivada correctamente.`
        );
        fetchDisciplines();
      } else {
        toast.error(res.error || "No se pudo cambiar el estado de la disciplina.");
      }
    } catch {
      toast.error("Error al cambiar el estado de la disciplina.");
    }
  };

  // Create Belt Handler
  const handleCreateBelt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscipline) {
      toast.error("Selecciona primero una disciplina.");
      return;
    }
    if (!newBeltName.trim()) {
      toast.error("Por favor ingresa el nombre del cinturón o grado.");
      return;
    }

    setIsCreatingBelt(true);
    try {
      const res = await createBeltAction({
        disciplineId: selectedDiscipline.id,
        name: newBeltName.trim(),
        colorHex: newBeltColor,
        orderIndex: belts.length + 1,
        minClasses: Number(newBeltClasses),
        minMonths: Number(newBeltMonths),
      });

      if (res.success && res.data) {
        toast.success(`Grado "${res.data.name}" añadido a ${selectedDiscipline.name}.`);
        setNewBeltName("");
        fetchBelts(selectedDiscipline.id);
      } else {
        toast.error(res.error || "No se pudo añadir el cinturón.");
      }
    } catch {
      toast.error("Error inesperado al añadir cinturón.");
    } finally {
      setIsCreatingBelt(false);
    }
  };

  // Update Belt Handler
  const handleUpdateBelt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBelt || !editingBelt.name.trim()) return;

    setIsSavingEditBelt(true);
    try {
      const res = await updateBeltAction(
        editingBelt.id,
        editingBelt.name.trim(),
        editingBelt.colorHex,
        editingBelt.minClasses,
        editingBelt.minMonths
      );

      if (res.success && selectedDiscipline) {
        toast.success("Grado de cinturón actualizado.");
        setEditingBelt(null);
        fetchBelts(selectedDiscipline.id);
      } else {
        toast.error(res.error || "Error al actualizar cinturón.");
      }
    } catch {
      toast.error("Error al actualizar cinturón.");
    } finally {
      setIsSavingEditBelt(false);
    }
  };

  // Delete Belt Handler
  const handleDeleteBelt = async () => {
    if (!deletingBelt || !selectedDiscipline) return;

    try {
      const res = await deleteBeltAction(deletingBelt.id);
      if (res.success) {
        toast.success(`Cinturón "${deletingBelt.name}" eliminado.`);
        setDeletingBelt(null);
        fetchBelts(selectedDiscipline.id);
      } else {
        toast.error(res.error || "No se pudo eliminar el cinturón.");
      }
    } catch {
      toast.error("Error al eliminar cinturón.");
    }
  };

  // Filtered disciplines
  const filteredDisciplines = useMemo(() => {
    if (!searchQuery.trim()) return disciplines;
    const q = searchQuery.toLowerCase().trim();
    return disciplines.filter(
      (d) => d.name.toLowerCase().includes(q) || (d.code && d.code.toLowerCase().includes(q))
    );
  }, [disciplines, searchQuery]);

  // Compute KPI metrics
  const totalDisciplines = disciplines.length;
  const totalBeltsCount = belts.length;
  const avgMinClasses =
    belts.length > 0
      ? Math.round(belts.reduce((sum, b) => sum + (b.minClasses || 0), 0) / belts.length)
      : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Swords className="h-7 w-7 text-amber-500" />
            {t("dojo.disciplinesTitle", "Disciplinas & Cursos")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t(
              "dojo.disciplinesSub",
              "Administra las disciplinas marciales de la academia, sus cursos y la jerarquía de cinturones de grado."
            )}
          </p>
        </div>
      </div>

      {/* TOP KPI CARDS (STATISTICS SUMMARY) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiTotalDisciplines", "Disciplinas Activas")}
              </span>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-serif">
                {totalDisciplines}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {t("dojo.kpiInAcademicOffer", "En oferta académica")}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
              <Layers className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiTotalBelts", "Grados Configurados")}
              </span>
              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-serif">
                {totalBeltsCount}
              </div>
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> {t("dojo.kpiInActiveDiscipline", "En disciplina activa")}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("dojo.kpiAvgMinClasses", "Promedio Clases/Grado")}
              </span>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-white font-serif">
                {avgMinClasses} <span className="text-sm text-zinc-400 font-sans font-normal">{t("dojo.classesWord", "clases")}</span>
              </div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> {t("dojo.kpiExamRequirement", "Requisito de examen")}
              </span>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl border border-purple-500/20">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: LIST & REGISTRATION OF DISCIPLINES */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              {t("dojo.academyDisciplines", "Disciplinas de la Academia")}
            </h2>
          </div>

          {/* Quick Filter Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 h-10 flex items-center">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t("dojo.searchDisciplinePlaceholder", "Buscar disciplina...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 box-border"
              />
            </div>
            <Button
              type="button"
              className="h-10 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-3.5 cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
            >
              <Search className="h-3.5 w-3.5 mr-1" /> {t("dojo.searchBtn", "Buscar")}
            </Button>
          </div>

          {/* Form Create Discipline Card */}
          <form onSubmit={handleCreateDiscipline} className="p-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
              {t("dojo.registerNewDiscipline", "+ Registrar Nueva Disciplina")}
            </span>
            <Input
              placeholder={t("dojo.disciplineNamePlaceholder", "Nombre (ej. Sanda, Wing Chun)")}
              value={newDisciplineName}
              onChange={(e) => setNewDisciplineName(e.target.value)}
              className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
            />
            <div className="flex gap-2">
              <Input
                placeholder={t("dojo.disciplineCodePlaceholder", "Código Abreviado (ej. SND)")}
                value={newDisciplineCode}
                onChange={(e) => setNewDisciplineCode(e.target.value)}
                className="w-1/2 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
              />
              <Button
                type="submit"
                disabled={isCreatingDiscipline}
                className="w-1/2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {isCreatingDiscipline ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" /> {t("dojo.createBtn", "Crear")}
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Discipline Cards List */}
          <div className="space-y-2 pt-1 max-h-[500px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> {t("dojo.loadingDisciplines", "Cargando disciplinas...")}
              </div>
            ) : filteredDisciplines.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                {t("dojo.noDisciplinesRegistered", "No hay disciplinas registradas.")}
              </div>
            ) : (
              filteredDisciplines.map((disc) => {
                const isSelected = selectedDiscipline?.id === disc.id;
                const isDiscActive = disc.isActive !== false;
                return (
                  <div
                    key={disc.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    } ${!isDiscActive ? "opacity-75" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDiscipline(disc)}
                      className="flex-1 text-left flex justify-between items-center mr-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Swords className={`h-4 w-4 ${isSelected ? "text-amber-500" : "text-zinc-400"}`} />
                        <span className="font-bold text-sm">{disc.name}</span>
                        {!isDiscActive && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 uppercase">
                            {t("dojo.inactiveBadge", "Inactiva")}
                          </span>
                        )}
                      </div>
                      {disc.code && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase">
                          {disc.code}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDisciplineActive(disc);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDiscActive
                            ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            : "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                        }`}
                        title={isDiscActive ? "Desactivar disciplina" : "Activar disciplina"}
                      >
                        {isDiscActive ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDiscipline(disc);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                        title="Editar disciplina"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDiscipline(disc);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Eliminar disciplina"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BELT RANK HIERARCHY & PROGRESSION TIMELINE */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          {selectedDiscipline ? (
            <>
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    {t("dojo.beltHierarchyTitle", "Jerarquía y Progresión de Grados")}:{" "}
                    <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                      {selectedDiscipline.name}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("dojo.beltHierarchySub", "Requisitos mínimos de asistencia y permanencia por grado.")}
                  </p>
                </div>
              </div>

              {/* Form Add Belt Card */}
              <form onSubmit={handleCreateBelt} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  {t("dojo.addNewBeltTitle", "+ Agregar Nuevo Grado / Cinturón")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-zinc-400 mb-1 block">{t("dojo.beltNameLabel", "Nombre Grado")}</Label>
                    <Input
                      placeholder={t("dojo.beltNamePlaceholder", "ej. Cinturón Amarillo")}
                      value={newBeltName}
                      onChange={(e) => setNewBeltName(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-zinc-400 mb-1 block">{t("dojo.beltColorLabel", "Color Distintivo")}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newBeltColor}
                        onChange={(e) => setNewBeltColor(e.target.value)}
                        className="h-9 w-full p-1 border border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-1">
                    <Label className="text-[10px] text-zinc-400 mb-1 block">{t("dojo.minClassesLabel", "Mín. Clases")}</Label>
                    <Input
                      type="number"
                      value={newBeltClasses}
                      onChange={(e) => setNewBeltClasses(Number(e.target.value))}
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <Button
                      type="submit"
                      disabled={isCreatingBelt}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs h-9"
                    >
                      {isCreatingBelt ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" /> {t("dojo.addBtn", "Añadir")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Belt Rank Hierarchy Progression Timeline */}
              <div className="space-y-3 pt-1">
                {isLoadingBelts ? (
                  <div className="p-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> {t("dojo.loadingBelts", "Cargando grados...")}
                  </div>
                ) : belts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-2">
                    <Award className="h-8 w-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                    <p>{t("dojo.noBeltsConfigured", "No hay cinturones configurados")} para {selectedDiscipline.name}.</p>
                    <p className="text-[11px] text-zinc-400">{t("dojo.addFirstBeltHint", "Añade el primer cinturón utilizando el formulario superior.")}</p>
                  </div>
                ) : (
                  belts.map((belt, idx) => (
                    <div
                      key={belt.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-2xs hover:border-amber-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Rank Position Badge */}
                        <span className="text-xs font-black text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-lg w-7 h-7 flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Color Swatch Circle */}
                        <div
                          className="w-7 h-7 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shadow-md shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: belt.colorHex }}
                          title={`Color Hex: ${belt.colorHex}`}
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white text-sm">
                              {belt.name}
                            </span>
                            {idx === 0 && (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold uppercase px-2 py-0">
                                {t("dojo.initialRankBadge", "Grado Inicial")}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            HEX: {belt.colorHex.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Requirements Chips & Actions */}
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-bold border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 gap-1">
                            <Flame className="h-3 w-3 text-amber-500" />
                            {belt.minClasses} {t("dojo.classesWord", "Clases")}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-bold border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 gap-1 hidden sm:flex">
                            <Clock className="h-3 w-3 text-indigo-500" />
                            {belt.minMonths} {t("dojo.monthsLabel", "Meses")}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
                          <div className="flex flex-col gap-0.5 mr-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveBelt(idx, "up")}
                              className="p-1 text-zinc-400 hover:text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              title={t("dojo.moveBeltUp", "Subir nivel jerárquico")}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === belts.length - 1}
                              onClick={() => handleMoveBelt(idx, "down")}
                              className="p-1 text-zinc-400 hover:text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                              title={t("dojo.moveBeltDown", "Bajar nivel jerárquico")}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingBelt(belt)}
                            className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Editar cinturón"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBelt(belt)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar cinturón"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-400 space-y-2">
              <Layers className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm font-medium">{t("dojo.selectDisciplineHint", "Selecciona o crea una disciplina para administrar sus cinturones.")}</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDIT DISCIPLINE */}
      <Dialog open={Boolean(editingDiscipline)} onOpenChange={(open) => !open && setEditingDiscipline(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" /> Editar Disciplina
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Modifica el nombre o código abreviado de la disciplina marcial.
            </DialogDescription>
          </DialogHeader>

          {editingDiscipline && (
            <form onSubmit={handleUpdateDiscipline} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre de la Disciplina
                </Label>
                <Input
                  value={editingDiscipline.name}
                  onChange={(e) => setEditingDiscipline({ ...editingDiscipline, name: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Código Abreviado (Opcional)
                </Label>
                <Input
                  value={editingDiscipline.code || ""}
                  onChange={(e) => setEditingDiscipline({ ...editingDiscipline, code: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white font-mono uppercase"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingDiscipline(null)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEditDiscipline}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingEditDiscipline ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRM DELETE DISCIPLINE */}
      <Dialog open={Boolean(deletingDiscipline)} onOpenChange={(open) => !open && setDeletingDiscipline(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /> ¿Eliminar Disciplina?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              Estás a punto de eliminar la disciplina{" "}
              <strong className="text-zinc-900 dark:text-white">"{deletingDiscipline?.name}"</strong>.
              Esta acción eliminará permanentemente sus cinturones y configuraciones asociadas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDiscipline(null)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteDiscipline}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT BELT */}
      <Dialog open={Boolean(editingBelt)} onOpenChange={(open) => !open && setEditingBelt(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" /> Editar Cinturón / Grado
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Ajusta el nombre, color hexadecimal y los requisitos mínimos de clases y permanencia.
            </DialogDescription>
          </DialogHeader>

          {editingBelt && (
            <form onSubmit={handleUpdateBelt} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre del Cinturón
                </Label>
                <Input
                  value={editingBelt.name}
                  onChange={(e) => setEditingBelt({ ...editingBelt, name: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Color Hexadecimal
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editingBelt.colorHex}
                    onChange={(e) => setEditingBelt({ ...editingBelt, colorHex: e.target.value })}
                    className="h-10 w-16 p-1 border border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-800 shrink-0"
                  />
                  <Input
                    value={editingBelt.colorHex}
                    onChange={(e) => setEditingBelt({ ...editingBelt, colorHex: e.target.value })}
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Mín. Clases
                  </Label>
                  <Input
                    type="number"
                    value={editingBelt.minClasses}
                    onChange={(e) => setEditingBelt({ ...editingBelt, minClasses: Number(e.target.value) })}
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Mín. Meses
                  </Label>
                  <Input
                    type="number"
                    value={editingBelt.minMonths}
                    onChange={(e) => setEditingBelt({ ...editingBelt, minMonths: Number(e.target.value) })}
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBelt(null)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEditBelt}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingEditBelt ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRM DELETE BELT */}
      <Dialog open={Boolean(deletingBelt)} onOpenChange={(open) => !open && setDeletingBelt(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /> ¿Eliminar Cinturón?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              Estás a punto de eliminar el cinturón{" "}
              <strong className="text-zinc-900 dark:text-white">"{deletingBelt?.name}"</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingBelt(null)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteBelt}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Sí, Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

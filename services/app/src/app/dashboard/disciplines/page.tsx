"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Swords,
  Award,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  Flame,
  Search,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Loader2,
  UserCheck,
  UserX,
  X,
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
  DISCIPLINE_TEMPLATE_LIST,
  getDisciplineTemplateById,
} from "@/config/discipline-templates";
import {
  getDisciplinesByBrandAction,
  createDisciplineWithTemplateAction,
  applyDisciplineTemplateAction,
  updateDisciplineAction,
  deleteDisciplineAction,
  toggleDisciplineActiveAction,
  getBeltsByDisciplineAction,
  createBeltAction,
  updateBeltAction,
  deleteBeltAction,
  deleteBeltsBulkAction,
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
  const [selectedTemplateId, setSelectedTemplateId] = useState("CUSTOM");
  const [includeBelts, setIncludeBelts] = useState(true);
  const [includeChallenges, setIncludeChallenges] = useState(true);
  const [includeRubrics, setIncludeRubrics] = useState(true);
  const [isCreatingDiscipline, setIsCreatingDiscipline] = useState(false);
  const [isCreateDisciplineModalOpen, setIsCreateDisciplineModalOpen] = useState(false);

  // Apply Template Modal State
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [applyTemplateId, setApplyTemplateId] = useState("TAEKWONDO");
  const [applyIncludeBelts, setApplyIncludeBelts] = useState(true);
  const [applyIncludeChallenges, setApplyIncludeChallenges] = useState(true);
  const [applyIncludeRubrics, setApplyIncludeRubrics] = useState(true);
  const [applyReplaceExistingBelts, setApplyReplaceExistingBelts] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Bulk Selection State for Belts
  const [selectedBeltIds, setSelectedBeltIds] = useState<string[]>([]);
  const [isDeletingBeltsBulk, setIsDeletingBeltsBulk] = useState(false);
  const [isConfirmBulkDeleteModalOpen, setIsConfirmBulkDeleteModalOpen] = useState(false);


  // Form states for Create Belt
  const [newBeltName, setNewBeltName] = useState("");
  const [newBeltColor, setNewBeltColor] = useState("#F59E0B");
  const [newBeltClasses, setNewBeltClasses] = useState(24);
  const [newBeltMonths, _setNewBeltMonths] = useState(3);
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
        if (res.data.length > 0) {
          setSelectedDiscipline((prev) => {
            if (!prev) return res.data![0];
            const updated = res.data!.find((d) => d.id === prev.id);
            return updated || res.data![0];
          });
        } else {
          setSelectedDiscipline(null);
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
    setSelectedBeltIds([]);
    if (selectedDiscipline) {
      fetchBelts(selectedDiscipline.id);
    }
  }, [selectedDiscipline]);

  // Handle Template Dropdown Change
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId !== "CUSTOM") {
      const template = getDisciplineTemplateById(templateId);
      if (template) {
        setNewDisciplineName(template.name);
        setNewDisciplineCode(template.code);
      }
    }
  };

  // Create Discipline Handler with Template
  const handleCreateDiscipline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisciplineName.trim()) {
      toast.error("Por favor ingresa el nombre de la disciplina.");
      return;
    }

    setIsCreatingDiscipline(true);
    try {
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await createDisciplineWithTemplateAction({
        brandId: brandToUse,
        name: newDisciplineName.trim(),
        code: newDisciplineCode.trim(),
        templateId: selectedTemplateId !== "CUSTOM" ? selectedTemplateId : undefined,
        includeBelts,
        includeChallenges,
        includeRubrics,
      });

      if (res.success && res.data) {
        toast.success(`Disciplina "${res.data.name}" creada correctamente.`);
        setNewDisciplineName("");
        setNewDisciplineCode("");
        setSelectedTemplateId("CUSTOM");
        setSelectedDiscipline(res.data);
        setIsCreateDisciplineModalOpen(false);
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

  // Apply Template to Existing Discipline Handler
  const handleApplyTemplate = async () => {
    if (!selectedDiscipline) return;
    setIsApplyingTemplate(true);
    try {
      const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
      const res = await applyDisciplineTemplateAction(
        selectedDiscipline.id,
        brandToUse,
        applyTemplateId,
        {
          includeBelts: applyIncludeBelts,
          includeChallenges: applyIncludeChallenges,
          includeRubrics: applyIncludeRubrics,
          replaceExistingBelts: applyReplaceExistingBelts,
        }
      );

      if (res.success) {
        toast.success("Plantilla preconfigurada aplicada exitosamente.");
        setIsApplyTemplateModalOpen(false);
        setSelectedBeltIds([]);
        fetchBelts(selectedDiscipline.id);
      } else {
        const errorMsg = res.errorKey ? t(res.errorKey, res.error, res.errorParams) : (res.error || "Error al aplicar la plantilla.");
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Error al aplicar plantilla preconfigurada.");
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Bulk Delete Belts Handler
  const handleBulkDeleteBelts = async () => {
    if (selectedBeltIds.length === 0) return;
    setIsDeletingBeltsBulk(true);
    try {
      const res = await deleteBeltsBulkAction(selectedBeltIds);
      if (res.success) {
        toast.success(`${selectedBeltIds.length} cinturón(es) eliminado(s) exitosamente.`);
        setSelectedBeltIds([]);
        setIsConfirmBulkDeleteModalOpen(false);
        if (selectedDiscipline) {
          fetchBelts(selectedDiscipline.id);
        }
      } else {
        const errorMsg = res.errorKey ? t(res.errorKey, res.error, res.errorParams) : (res.error || "No se pudieron eliminar los cinturones.");
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Error al eliminar cinturones seleccionados.");
    } finally {
      setIsDeletingBeltsBulk(false);
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
        const errorMsg = res.errorKey ? t(res.errorKey, res.error, res.errorParams) : (res.error || "No se pudo eliminar la disciplina.");
        toast.error(errorMsg);
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
        setSelectedDiscipline((prev) =>
          prev && prev.id === disc.id ? { ...prev, isActive: nextState } : prev
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
        const errorMsg = res.errorKey ? t(res.errorKey, res.error, res.errorParams) : (res.error || "No se pudo eliminar el cinturón.");
        toast.error(errorMsg);
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

      {/* MAIN TABS & FULL-WIDTH STAGE LAYOUT */}
      <div className="space-y-6">
      {/* DISCIPLINE TABS HEADER & ACTIONS BAR */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Filter + Label */}
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 shrink-0">
              <Layers className="h-4 w-4 text-indigo-500" />
              {t("dojo.academyDisciplines", "Disciplinas:")}
            </h2>
            <div className="relative h-8 flex items-center min-w-[200px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t("dojo.searchDisciplinePlaceholder", "Buscar...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-7 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* New Discipline Button (Opens Modal) */}
          <Button
            type="button"
            onClick={() => setIsCreateDisciplineModalOpen(true)}
            className="h-8 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-3 shadow-xs cursor-pointer gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t("dojo.registerNewDisciplineBtn", "Registrar Disciplina")}</span>
          </Button>
        </div>

        {/* Scrollable Discipline Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          {isLoading ? (
            <div className="py-2 text-xs text-zinc-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              {t("dojo.loadingDisciplines", "Cargando disciplinas...")}
            </div>
          ) : filteredDisciplines.length === 0 ? (
            <div className="py-2 text-xs text-zinc-400 italic">
              {t("dojo.noDisciplinesRegistered", "No hay disciplinas registradas.")}
            </div>
          ) : (
            filteredDisciplines.map((disc) => {
              const isSelected = selectedDiscipline?.id === disc.id;
              const isDiscActive = disc.isActive !== false;
              return (
                <div
                  key={disc.id}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/30"
                      : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 bg-zinc-50/60 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  } ${!isDiscActive ? "opacity-70" : ""}`}
                >
                  <Swords className={`h-3.5 w-3.5 ${isSelected ? "text-amber-500" : "text-zinc-400"}`} />
                  <span>{disc.name}</span>

                  {disc.code && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-extrabold ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}>
                      {disc.code}
                    </span>
                  )}

                  {!isDiscActive && (
                    <span className="text-[9px] font-extrabold px-1 rounded bg-amber-500/20 text-amber-500 uppercase">
                      Off
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FULL-WIDTH STAGE: BELT RANK HIERARCHY & PROGRESSION TIMELINE */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        {selectedDiscipline ? (
          <>
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Award className="h-5 w-5 text-amber-500 shrink-0" />
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {t("dojo.beltHierarchyTitle", "Jerarquía y Progresión de Grados")}:
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                    {selectedDiscipline.name}
                  </span>
                  {selectedDiscipline.code && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {selectedDiscipline.code}
                    </span>
                  )}
                  {selectedDiscipline.isActive === false && (
                    <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] uppercase font-bold">
                      {t("dojo.inactiveBadge", "Inactiva")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t("dojo.beltHierarchySub", "Requisitos mínimos de asistencia y permanencia por grado.")}
                </p>
              </div>

              {/* Action Toolbar for Active Discipline */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleDisciplineActive(selectedDiscipline)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedDiscipline.isActive !== false
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      : "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                  }`}
                  title={
                    selectedDiscipline.isActive !== false
                      ? t("dojo.deactivateDiscipline", "Desactivar disciplina")
                      : t("dojo.activateDiscipline", "Activar disciplina")
                  }
                >
                  {selectedDiscipline.isActive !== false ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> {t("dojo.activeBadge", "Activa")}
                    </>
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" /> {t("dojo.inactiveBadge", "Inactiva")}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingDiscipline(selectedDiscipline)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title={t("dojo.editDisciplineTooltip", "Editar disciplina")}
                >
                  <Edit2 className="h-3.5 w-3.5" /> {t("dojo.editBtn", "Editar")}
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingDiscipline(selectedDiscipline)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title={t("dojo.deleteDisciplineTooltip", "Eliminar disciplina")}
                >
                  <Trash2 className="h-3.5 w-3.5" /> {t("dojo.deleteBtn", "Eliminar")}
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsApplyTemplateModalOpen(true)}
                  className="h-8 text-[11px] font-medium gap-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg shrink-0 transition-colors ml-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{t("dojo.applyTemplateBtn", "Cargar Plantilla")}</span>
                </Button>
              </div>
            </div>

              {/* Form Add Belt Card */}
              <form
                onSubmit={handleCreateBelt}
                className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3"
              >
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  {t("dojo.addNewBeltTitle", "+ Agregar Nuevo Grado / Cinturón")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                      {t("dojo.beltNameLabel", "Nombre Grado")}
                    </Label>
                    <Input
                      placeholder={t("dojo.beltNamePlaceholder", "ej. Cinturón Amarillo")}
                      value={newBeltName}
                      onChange={(e) => setNewBeltName(e.target.value)}
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white h-9"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                      {t("dojo.beltColorLabel", "Color Distintivo")}
                    </Label>
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-1 h-9">
                      <input
                        type="color"
                        value={newBeltColor}
                        onChange={(e) => setNewBeltColor(e.target.value)}
                        className="h-7 w-10 border-0 rounded-lg cursor-pointer bg-transparent shrink-0"
                      />
                      <span className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-300 uppercase truncate">
                        {newBeltColor}
                      </span>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">
                      {t("dojo.minClassesLabel", "Mín. Clases")}
                    </Label>
                    <Input
                      type="number"
                      value={newBeltClasses}
                      onChange={(e) => setNewBeltClasses(Number(e.target.value))}
                      className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white h-9"
                    />
                  </div>

                  <div className="sm:col-span-2">
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
                {belts.length > 0 && !isLoadingBelts && (
                  <div className="flex items-center justify-between px-1 py-1 text-xs">
                    <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedBeltIds.length === belts.length && belts.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBeltIds(belts.map((b) => b.id));
                          } else {
                            setSelectedBeltIds([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <span>{t("dojo.selectAll", "Seleccionar todos")}</span>
                      {selectedBeltIds.length > 0 && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                          ({selectedBeltIds.length} / {belts.length})
                        </span>
                      )}
                    </label>
                  </div>
                )}

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
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all group ${
                        selectedBeltIds.includes(belt.id)
                          ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 shadow-2xs hover:border-amber-500/40"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Checkbox for Bulk Selection */}
                        <input
                          type="checkbox"
                          checked={selectedBeltIds.includes(belt.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBeltIds((prev) => [...prev, belt.id]);
                            } else {
                              setSelectedBeltIds((prev) => prev.filter((id) => id !== belt.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 cursor-pointer shrink-0"
                        />

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
                            title={t("dojo.editBeltTooltip", "Editar cinturón")}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBelt(belt)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title={t("dojo.deleteBeltTooltip", "Eliminar cinturón")}
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
      <Dialog
        open={Boolean(editingDiscipline)}
        onOpenChange={(open) => !open && setEditingDiscipline(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" /> {t("dojo.editDisciplineTitle", "Editar Disciplina")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {t("dojo.editDisciplineSub", "Modifica el nombre o código abreviado de la disciplina marcial.")}
            </DialogDescription>
          </DialogHeader>

          {editingDiscipline && (
            <form onSubmit={handleUpdateDiscipline} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.disciplineNameLabel", "Nombre de la Disciplina")}
                </Label>
                <Input
                  value={editingDiscipline.name}
                  onChange={(e) =>
                    setEditingDiscipline({ ...editingDiscipline, name: e.target.value })
                  }
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.disciplineCodeLabel", "Código Abreviado (Opcional)")}
                </Label>
                <Input
                  value={editingDiscipline.code || ""}
                  onChange={(e) =>
                    setEditingDiscipline({ ...editingDiscipline, code: e.target.value })
                  }
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
                  {t("dojo.cancelBtn", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEditDiscipline}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingEditDiscipline ? <Loader2 className="h-4 w-4 animate-spin" /> : t("dojo.saveChangesBtn", "Guardar Cambios")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRM DELETE DISCIPLINE */}
      <Dialog
        open={Boolean(deletingDiscipline)}
        onOpenChange={(open) => !open && setDeletingDiscipline(null)}
      >
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" /> {t("dojo.deleteDisciplineTitle", "¿Eliminar Disciplina?")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              {t("dojo.deleteDisciplineSub", "Estás a punto de eliminar la disciplina")}{" "}
              <strong className="text-zinc-900 dark:text-white">"{deletingDiscipline?.name}"</strong>.{" "}
              {t("dojo.deleteDisciplineWarning", "Esta acción eliminará permanentemente sus cinturones y configuraciones asociadas.")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingDiscipline(null)}
              className="rounded-xl text-xs"
            >
              {t("dojo.cancelBtn", "Cancelar")}
            </Button>
            <Button
              type="button"
              onClick={handleDeleteDiscipline}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {t("dojo.confirmDeleteBtn", "Sí, Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT BELT */}
      <Dialog open={Boolean(editingBelt)} onOpenChange={(open) => !open && setEditingBelt(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-500" /> {t("dojo.editBeltTitle", "Editar Cinturón / Grado")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {t("dojo.editBeltSub", "Ajusta el nombre, color hexadecimal y los requisitos mínimos de clases y permanencia.")}
            </DialogDescription>
          </DialogHeader>

          {editingBelt && (
            <form onSubmit={handleUpdateBelt} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.beltNameInputLabel", "Nombre del Cinturón")}
                </Label>
                <Input
                  value={editingBelt.name}
                  onChange={(e) => setEditingBelt({ ...editingBelt, name: e.target.value })}
                  className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {t("dojo.hexColorLabel", "Color Hexadecimal")}
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
                    {t("dojo.minClassesLabel", "Mín. Clases")}
                  </Label>
                  <Input
                    type="number"
                    value={editingBelt.minClasses}
                    onChange={(e) =>
                      setEditingBelt({ ...editingBelt, minClasses: Number(e.target.value) })
                    }
                    className="bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {t("dojo.minMonthsLabel", "Mín. Meses")}
                  </Label>
                  <Input
                    type="number"
                    value={editingBelt.minMonths}
                    onChange={(e) =>
                      setEditingBelt({ ...editingBelt, minMonths: Number(e.target.value) })
                    }
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
                  {t("dojo.cancelBtn", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEditBelt}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isSavingEditBelt ? <Loader2 className="h-4 w-4 animate-spin" /> : t("dojo.saveChangesBtn", "Guardar Cambios")}
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
              <AlertTriangle className="h-5 w-5 shrink-0" /> {t("dojo.deleteBeltTitle", "¿Eliminar Cinturón?")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              {t("dojo.deleteBeltSub", "Estás a punto de eliminar el cinturón")}{" "}
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
              {t("dojo.cancelBtn", "Cancelar")}
            </Button>
            <Button
              type="button"
              onClick={handleDeleteBelt}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {t("dojo.confirmDeleteBtn", "Sí, Eliminar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRM BULK DELETE BELTS */}
      <Dialog open={isConfirmBulkDeleteModalOpen} onOpenChange={setIsConfirmBulkDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {t("dojo.confirmBulkDeleteBeltsTitle", "¿Eliminar cinturones seleccionados?")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-600 dark:text-zinc-300 pt-1">
              {t("dojo.confirmBulkDeleteBeltsDesc", "Estás a punto de eliminar {count} cinturón(es) seleccionado(s) de esta disciplina. Esta acción no se puede deshacer.", { count: selectedBeltIds.length })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmBulkDeleteModalOpen(false)}
              className="rounded-xl text-xs"
            >
              {t("dojo.cancelBtn", "Cancelar")}
            </Button>
            <Button
              type="button"
              disabled={isDeletingBeltsBulk}
              onClick={handleBulkDeleteBelts}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              {isDeletingBeltsBulk ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {t("dojo.deleteSelectedBelts", "Eliminar Seleccionados")} ({selectedBeltIds.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: APPLY TEMPLATE TO EXISTING DISCIPLINE */}
      <Dialog open={isApplyTemplateModalOpen} onOpenChange={setIsApplyTemplateModalOpen}>

        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {t("dojo.applyTemplateModalTitle", "Cargar Plantilla Preconfigurada")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("dojo.applyTemplateModalDesc", "Selecciona una plantilla para cargar sus cinturones, retos y rúbricas en ")}
              <strong className="text-amber-600 dark:text-amber-400">{selectedDiscipline?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t("dojo.selectTemplateLabel", "Selecciona la Disciplina Estándar:")}
              </Label>
              <select
                value={applyTemplateId}
                onChange={(e) => setApplyTemplateId(e.target.value)}
                className="w-full h-10 text-xs font-semibold rounded-xl px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {DISCIPLINE_TEMPLATE_LIST.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    🥋 {tpl.name} ({tpl.belts.length} Cintas, {tpl.challenges.length} Retos)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                Módulos a Cargar:
              </span>
              <div className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIncludeBelts}
                    onChange={(e) => setApplyIncludeBelts(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    🥋 Jerarquía de Cinturones (
                    {getDisciplineTemplateById(applyTemplateId)?.belts.length || 0})
                  </span>
                </label>
                {applyIncludeBelts && (
                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    <input
                      type="checkbox"
                      checked={applyReplaceExistingBelts}
                      onChange={(e) => setApplyReplaceExistingBelts(e.target.checked)}
                      className="rounded text-rose-500 focus:ring-rose-500"
                    />
                    <span>⚠️ {t("dojo.replaceExistingBeltsHint", "Reemplazar / limpiar cinturones existentes antes de importar")}</span>
                  </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIncludeChallenges}
                    onChange={(e) => setApplyIncludeChallenges(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    🔥 Retos Físicos (
                    {getDisciplineTemplateById(applyTemplateId)?.challenges.length || 0})
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIncludeRubrics}
                    onChange={(e) => setApplyIncludeRubrics(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    📋 Rúbricas de Evaluación (
                    {getDisciplineTemplateById(applyTemplateId)?.rubrics.length || 0})
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsApplyTemplateModalOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={isApplyingTemplate}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs h-9 cursor-pointer"
            >
              {isApplyingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {t("dojo.applyTemplateConfirmBtn", "Cargar en Disciplina")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REGISTER NEW DISCIPLINE */}
      <Dialog open={isCreateDisciplineModalOpen} onOpenChange={setIsCreateDisciplineModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-500" />
              {t("dojo.registerNewDiscipline", "+ Registrar Nueva Disciplina")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("dojo.registerNewDisciplineDesc", "Crea una disciplina marcial personalizada o basada en una plantilla estandarizada.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDiscipline} className="space-y-3.5 py-2">
            {/* Template Selector Dropdown */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {t("dojo.templateLabel", "Plantilla Preconfigurada:")}
              </Label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full h-10 text-xs font-semibold rounded-xl px-3 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="CUSTOM">{t("dojo.customEmptyForm", "✏️ Personalizado (Formulario Vacío)")}</option>
                {DISCIPLINE_TEMPLATE_LIST.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    🥋 {tpl.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {t("dojo.disciplineNameLabel", "Nombre de la Disciplina:")}
              </Label>
              <Input
                placeholder={t("dojo.disciplineNamePlaceholder", "ej. Sanda, Wing Chun, Taekwondo")}
                value={newDisciplineName}
                onChange={(e) => setNewDisciplineName(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white h-10"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
                {t("dojo.disciplineCodeLabel", "Código Abreviado (Opcional):")}
              </Label>
              <Input
                placeholder={t("dojo.disciplineCodePlaceholder", "ej. SND, TKD, BJJ")}
                value={newDisciplineCode}
                onChange={(e) => setNewDisciplineCode(e.target.value)}
                className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-xs rounded-xl text-zinc-900 dark:text-white h-10"
              />
            </div>

            {selectedTemplateId !== "CUSTOM" && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
                  {t("dojo.includeAutoPresets", "Incluir Preconfiguraciones Automáticas:")}
                </span>
                <div className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBelts}
                      onChange={(e) => setIncludeBelts(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      🥋 {t("dojo.presetBelts", "Jerarquía de Cinturones")} (
                      {getDisciplineTemplateById(selectedTemplateId)?.belts.length || 0})
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeChallenges}
                      onChange={(e) => setIncludeChallenges(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      🔥 {t("dojo.presetChallenges", "Retos de Gamificación")} (
                      {getDisciplineTemplateById(selectedTemplateId)?.challenges.length || 0})
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRubrics}
                      onChange={(e) => setIncludeRubrics(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>
                      📋 {t("dojo.presetRubrics", "Rúbricas de Evaluación")} (
                      {getDisciplineTemplateById(selectedTemplateId)?.rubrics.length || 0})
                    </span>
                  </label>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDisciplineModalOpen(false)}
                className="border-zinc-300 dark:border-zinc-700 text-xs font-bold rounded-xl h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingDiscipline}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs h-10 px-5"
              >
                {isCreatingDiscipline ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" /> {t("dojo.createBtn", "Crear Disciplina")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Floating Bulk Action Bar (Matching /dashboard/users) */}
      {selectedBeltIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 px-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-amber-500 text-zinc-950 font-extrabold text-[10px] uppercase rounded-lg px-2.5 h-6">
              {selectedBeltIds.length} {t("dojo.selectedCount", "SELECCIONADOS")}
            </Badge>
          </div>

          <div className="h-6 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              onClick={() => setIsConfirmBulkDeleteModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl h-9 px-3 gap-1.5 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t("dojo.deleteSelectedBelts", "Eliminar Seleccionados")}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSelectedBeltIds([])}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-xl shrink-0 cursor-pointer"
            title={t("dojo.cancelBtn", "Cancelar")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}


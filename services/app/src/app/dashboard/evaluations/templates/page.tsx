"use client";

import React, { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Swords,
  Loader2,
  Star,
  PlusCircle,
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
  getEvaluationTemplatesByBrandAction,
  createEvaluationTemplateAction,
  updateEvaluationTemplateAction,
  deleteEvaluationTemplateAction,
} from "@/actions/rubrics";
import { getDisciplinesByBrandAction } from "@/actions/disciplines";
import type { EvaluationTemplate, Discipline } from "@/types";

export default function EvaluationTemplatesPage() {
  const { selectedBrandId } = useBrand();
  const { t } = useTranslation();

  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<EvaluationTemplate | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [disciplineId, setDisciplineId] = useState<string>("");
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [criteria, setCriteria] = useState<
    { name: string; category: string; description: string; orderIndex: number }[]
  >([
    { name: "Posturas y Formas", category: "TECNICA", description: "", orderIndex: 1 },
    { name: "Golpes y Patadas", category: "TECNICA", description: "", orderIndex: 2 },
    { name: "Espíritu y Actitud", category: "ACTITUD", description: "", orderIndex: 3 },
  ]);

  useEffect(() => {
    if (selectedBrandId) {
      loadData();
    }
  }, [selectedBrandId]);

  const loadData = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    try {
      const [tmplRes, discRes] = await Promise.all([
        getEvaluationTemplatesByBrandAction(selectedBrandId),
        getDisciplinesByBrandAction(selectedBrandId),
      ]);

      if (tmplRes.success && tmplRes.data) {
        setTemplates(tmplRes.data);
      }
      if (discRes.success && discRes.data) {
        setDisciplines(discRes.data);
      }
    } catch {
      toast.error(t("rubrics.loadError", "Error al cargar plantillas de evaluación."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setTitle("");
    setDescription("");
    setDisciplineId("");
    setIsDefault(templates.length === 0);
    setCriteria([
      {
        name: "Posturas y Formas (Tao Lu / Kata)",
        category: "TECNICA",
        description: "Estabilidad de postura, ritmo y fuerza.",
        orderIndex: 1,
      },
      {
        name: "Técnicas de Golpe y Patadas",
        category: "TECNICA",
        description: "Precisión y extensión técnica.",
        orderIndex: 2,
      },
      {
        name: "Espíritu, Kiai y Actitud",
        category: "ACTITUD",
        description: "Enfoque mental, respeto y marcialidad.",
        orderIndex: 3,
      },
      {
        name: "Condición Física",
        category: "FISICO",
        description: "Resistencia y potencia física.",
        orderIndex: 4,
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl: EvaluationTemplate) => {
    setEditingTemplate(tmpl);
    setTitle(tmpl.title);
    setDescription(tmpl.description || "");
    setDisciplineId(tmpl.disciplineId || "");
    setIsDefault(tmpl.isDefault);

    if (tmpl.criteria && tmpl.criteria.length > 0) {
      setCriteria(
        tmpl.criteria.map((c, idx) => ({
          name: c.name,
          category: c.category || "GENERAL",
          description: c.description || "",
          orderIndex: c.orderIndex || idx + 1,
        }))
      );
    }
    setIsModalOpen(true);
  };

  const handleAddCriterionRow = () => {
    setCriteria((prev) => [
      ...prev,
      {
        name: "",
        category: "TECNICA",
        description: "",
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const handleRemoveCriterionRow = (index: number) => {
    if (criteria.length <= 1) {
      toast.error(t("rubrics.minCriteriaRequired", "Debe existir al menos un criterio."));
      return;
    }
    setCriteria((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveTemplate = async () => {
    if (!selectedBrandId) return;
    if (!title.trim()) {
      toast.error(t("rubrics.titleRequired", "El título de la plantilla es obligatorio."));
      return;
    }

    const validCriteria = criteria.filter((c) => c.name.trim().length > 0);
    if (validCriteria.length === 0) {
      toast.error(t("rubrics.criteriaRequired", "Agrega al menos un criterio válido."));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description: description.trim() || undefined,
        disciplineId: disciplineId || undefined,
        isDefault,
        criteria: validCriteria,
      };

      let res;
      if (editingTemplate) {
        res = await updateEvaluationTemplateAction(editingTemplate.id, payload);
      } else {
        res = await createEvaluationTemplateAction(selectedBrandId, payload);
      }

      if (res.success) {
        toast.success(
          editingTemplate
            ? t("rubrics.updatedSuccess", "Plantilla actualizada.")
            : t("rubrics.createdSuccess", "Plantilla creada.")
        );
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || t("rubrics.saveError", "Error al guardar plantilla."));
      }
    } catch {
      toast.error(t("rubrics.saveError", "Error al procesar la solicitud."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm(t("rubrics.confirmDelete", "¿Eliminar esta plantilla de evaluación?"))) return;

    try {
      const res = await deleteEvaluationTemplateAction(id);
      if (res.success) {
        toast.success(t("rubrics.deleteSuccess", "Plantilla eliminada."));
        loadData();
      } else {
        toast.error(res.error || t("rubrics.deleteError", "Error al eliminar plantilla."));
      }
    } catch {
      toast.error(t("rubrics.deleteError", "Error al eliminar."));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("rubrics.title", "Plantillas de Evaluación (Semáforo 3 Niveles)")}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t(
              "rubrics.subtitle",
              "Configura rúbricas de evaluación rápida en tatami con 3 estados visuales (🟩 100% Dominado, 🟡 75% En proceso, 🔴 No Apto)."
            )}
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold gap-2 shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          {t("rubrics.createButton", "Nueva Plantilla")}
        </Button>
      </div>

      {/* 3-Tier Visual Semaphore Legend Banner */}
      <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-md">
        <CardContent className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {t("rubrics.legendTitle", "Sistema de Evaluación Tatami de 3 Niveles Visuales")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-400">🟩 100% - Dominado / Apto</p>
                <p className="text-[11px] text-slate-400">Verde con palomita. Ejecución impecable.</p>
              </div>
            </div>

            <div className="bg-amber-950/60 border border-amber-500/30 p-3 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center shrink-0">
                <ThumbsUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400">🟡 75% - En Proceso / Aceptable</p>
                <p className="text-[11px] text-slate-400">Amarillo con manita arriba. Requiere ajuste minor.</p>
              </div>
            </div>

            <div className="bg-rose-950/60 border border-rose-500/30 p-3 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center shrink-0">
                <ThumbsDown className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400">🔴 0% - No Apto / Práctica</p>
                <p className="text-[11px] text-slate-400">Rojo con manita abajo. Requiere mayor práctica.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
          <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {t("rubrics.emptyTitle", "No hay plantillas de evaluación")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {t("rubrics.emptyDesc", "Crea tu primera rúbrica semafórica para calificar exámenes de grado.")}
          </p>
          <Button onClick={handleOpenCreateModal} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {t("rubrics.createButton", "Nueva Plantilla")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((tmpl) => (
            <Card
              key={tmpl.id}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                        {tmpl.title}
                      </h3>
                      {tmpl.isDefault && (
                        <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] gap-1">
                          <Star className="w-3 h-3 fill-slate-950" />
                          {t("rubrics.defaultBadge", "Predeterminada")}
                        </Badge>
                      )}
                      {tmpl.discipline && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Swords className="w-3 h-3" />
                          {tmpl.discipline.name}
                        </Badge>
                      )}
                    </div>
                    {tmpl.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {tmpl.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-amber-500"
                      onClick={() => handleOpenEditModal(tmpl)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-500"
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Criteria Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t("rubrics.criteriaTitle", "Criterios de Evaluación a Calificar")} (
                    {tmpl.criteria?.length || 0})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {tmpl.criteria?.map((crit, idx) => (
                      <div
                        key={crit.id || idx}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {crit.name}
                            </p>
                            <Badge variant="secondary" className="text-[9px] uppercase">
                              {crit.category || "GENERAL"}
                            </Badge>
                          </div>
                          {crit.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {crit.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? t("rubrics.editModalTitle", "Editar Plantilla de Evaluación")
                : t("rubrics.createModalTitle", "Nueva Plantilla de Evaluación")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "rubrics.modalDesc",
                "Define los criterios que el Sensei calificará con los 3 botones de semáforo."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="tmpl-title">{t("rubrics.titleLabel", "Título de la Plantilla *")}</Label>
              <Input
                id="tmpl-title"
                placeholder="ej. Rúbrica Examen Kung Fu / Sanda"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tmpl-desc">{t("rubrics.descLabel", "Descripción")}</Label>
              <Input
                id="tmpl-desc"
                placeholder="ej. Evaluación técnica de formas y combate"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("rubrics.disciplineLabel", "Disciplina (Opcional)")}</Label>
                <select
                  value={disciplineId}
                  onChange={(e) => setDisciplineId(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs"
                >
                  <option value="">{t("rubrics.allDisciplines", "-- General / Todas --")}</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="tmpl-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <Label htmlFor="tmpl-default" className="cursor-pointer text-xs font-semibold">
                  {t("rubrics.isDefaultLabel", "Usar como plantilla predeterminada")}
                </Label>
              </div>
            </div>

            {/* Criteria Dynamic Rows */}
            <div className="space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  {t("rubrics.criteriaListTitle", "Criterios a Calificar")}
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCriterionRow}
                  className="h-7 text-xs gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {t("rubrics.addCriterion", "Agregar Criterio")}
                </Button>
              </div>

              <div className="space-y-2">
                {criteria.map((crit, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-500">#{idx + 1}</span>
                      <Input
                        placeholder="Nombre del criterio (ej. Posturas Ma Bu)"
                        value={crit.name}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].name = e.target.value;
                          setCriteria(updated);
                        }}
                        className="h-8 text-xs bg-white dark:bg-slate-900 flex-1"
                      />
                      <select
                        value={crit.category}
                        onChange={(e) => {
                          const updated = [...criteria];
                          updated[idx].category = e.target.value;
                          setCriteria(updated);
                        }}
                        className="h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-[11px]"
                      >
                        <option value="TECNICA">TÉCNICA</option>
                        <option value="ACTITUD">ACTITUD</option>
                        <option value="FISICO">FÍSICO</option>
                        <option value="GENERAL">GENERAL</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-500"
                        onClick={() => handleRemoveCriterionRow(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Descripción u observación guía (opcional)"
                      value={crit.description}
                      onChange={(e) => {
                        const updated = [...criteria];
                        updated[idx].description = e.target.value;
                        setCriteria(updated);
                      }}
                      className="h-7 text-[11px] bg-white dark:bg-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {t("common.save", "Guardar Plantilla")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

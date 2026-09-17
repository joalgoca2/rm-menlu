"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  createTournamentCategoryAction,
  updateTournamentCategoryAction,
  deleteTournamentCategoryAction,
} from "@/actions/tournaments";
import type { TournamentCategory, TournamentParticipant } from "@/types";
import { Plus, Trash2, Pencil, Tag, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface TournamentCategoriesTabProps {
  tournamentId: string;
  tournamentStatus?: string;
  categories: TournamentCategory[];
  participants: TournamentParticipant[];
  onRefresh: () => void;
}

export function TournamentCategoriesTab({
  tournamentId,
  tournamentStatus,
  categories,
  participants,
  onRefresh,
}: TournamentCategoriesTabProps) {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TournamentCategory | null>(null);
  const [name, setName] = useState("");
  const [minAge, setMinAge] = useState<number>(4);
  const [maxAge, setMaxAge] = useState<number>(17);
  const [gender, setGender] = useState<string>("MIXED");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isWeighInOrBeyond =
    tournamentStatus === "WEIGH_IN" ||
    tournamentStatus === "IN_PROGRESS" ||
    tournamentStatus === "COMPLETED";

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setMinAge(4);
    setMaxAge(17);
    setGender("MIXED");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cat: TournamentCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setMinAge(cat.minAge || 4);
    setMaxAge(cat.maxAge || 17);
    setGender(cat.gender || "MIXED");
    setShowAddModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(
        t(
          "tournamentsPage.categoryNameRequired",
          "El nombre de la categoría es requerido."
        )
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const res = await updateTournamentCategoryAction(
          editingCategory.id,
          name,
          minAge,
          maxAge,
          gender
        );
        if (res.success) {
          toast.success(
            t(
              "tournamentsPage.categoryUpdated",
              "Categoría actualizada correctamente."
            )
          );
          setEditingCategory(null);
          setShowAddModal(false);
          onRefresh();
        } else {
          toast.error(
            res.error ||
              t("tournamentsPage.categoryUpdateError", "Error al actualizar categoría.")
          );
        }
      } else {
        const res = await createTournamentCategoryAction(
          tournamentId,
          name,
          minAge,
          maxAge,
          gender
        );
        if (res.success) {
          toast.success(
            t(
              "tournamentsPage.categoryCreated",
              "Categoría creada correctamente."
            )
          );
          setName("");
          setMinAge(4);
          setMaxAge(17);
          setGender("MIXED");
          setShowAddModal(false);
          onRefresh();
        } else {
          toast.error(
            res.error ||
              t("tournamentsPage.categoryCreateError", "Error al crear categoría.")
          );
        }
      }
    } catch {
      toast.error(
        t("tournamentsPage.unexpectedServerError", "Error inesperado en servidor.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (isWeighInOrBeyond) {
      toast.error(
        t(
          "tournamentsPage.deleteDisabledInWeighIn",
          "No se pueden eliminar categorías en la etapa de confirmación de asistencia o posterior."
        )
      );
      return;
    }

    if (
      !confirm(
        t("common.confirmDelete", "¿Estás seguro de eliminar esta categoría?")
      )
    ) {
      return;
    }

    try {
      const res = await deleteTournamentCategoryAction(categoryId);
      if (res.success) {
        toast.success(
          t("tournamentsPage.categoryDeleted", "Categoría eliminada.")
        );
        onRefresh();
      } else {
        toast.error(
          res.error ||
            t("tournamentsPage.deleteCategoryError", "Error al eliminar.")
        );
      }
    } catch {
      toast.error(
        t("tournamentsPage.unexpectedServerError", "Error inesperado en servidor.")
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            {t("tournamentsPage.categoriesTitle", "Categorías de Competencia")}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t(
              "tournamentsPage.categoriesSubtitle",
              "Define las divisiones por edad y género para agrupamiento y pareos."
            )}
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {t("tournamentsPage.addCategory", "Agregar Categoría")}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <Card className="col-span-full p-12 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl space-y-2 shadow-xs">
            <Award className="w-10 h-10 text-zinc-400 mx-auto" />
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              {t("tournamentsPage.noCategories", "No hay categorías configuradas.")}
            </p>
            <p className="text-xs text-zinc-500">
              {t(
                "tournamentsPage.noCategoriesHint",
                "Agrega categorías para organizar las rondas."
              )}
            </p>
          </Card>
        ) : (
          categories.map((cat) => {
            const count = participants.filter(
              (p) => p.categoryId === cat.id
            ).length;

            return (
              <Card
                key={cat.id}
                className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all rounded-3xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                      {cat.name}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="p-1 text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={t("common.edit", "Editar categoría")}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!isWeighInOrBeyond && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title={t("common.delete", "Eliminar categoría")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-4 font-medium">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">
                        {t("tournamentsPage.ageRange", "Rango de Edad")}:
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {cat.minAge} - {cat.maxAge}{" "}
                        {t("tournamentsPage.years", "años")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">
                        {t("tournamentsPage.gender", "Género")}:
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {cat.gender === "MALE"
                          ? t("tournamentsPage.genderMale", "Masculino")
                          : cat.gender === "FEMALE"
                          ? t("tournamentsPage.genderFemale", "Femenino")
                          : t("tournamentsPage.genderMixed", "Mixto")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    {t("tournamentsPage.competitorsInscribed", "Competidores")}
                  </span>
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold">
                    {count}
                  </Badge>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Add Category */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {editingCategory
                  ? t("tournamentsPage.editCategoryTitle", "Editar Categoría")
                  : t("tournamentsPage.addCategoryTitle", "Nueva Categoría de Torneo")}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("tournamentsPage.categoryName", "Nombre de la Categoría")} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t(
                    "tournamentsPage.categoryNamePlaceholder",
                    "ej. Infantil Cinta Negra 8-10 yrs"
                  )}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("tournamentsPage.minAge", "Edad Mínima")}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="99"
                    value={minAge}
                    onChange={(e) => setMinAge(parseInt(e.target.value) || 4)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    {t("tournamentsPage.maxAge", "Edad Máxima")}
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="99"
                    value={maxAge}
                    onChange={(e) => setMaxAge(parseInt(e.target.value) || 99)}
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  {t("tournamentsPage.genderRule", "Género")}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="MIXED">
                    {t("tournamentsPage.genderMixed", "Mixto")}
                  </option>
                  <option value="MALE">
                    {t("tournamentsPage.genderMale", "Masculino")}
                  </option>
                  <option value="FEMALE">
                    {t("tournamentsPage.genderFemale", "Femenino")}
                  </option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 rounded-xl cursor-pointer"
                >
                  {t("common.cancel", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {isSubmitting
                    ? t("common.saving", "Guardando...")
                    : editingCategory
                    ? t("common.saveChanges", "Guardar Cambios")
                    : t("common.create", "Crear Categoría")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Loader2,
  Tag,
  Users,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cleanDesertCategoriesAction } from "@/actions/tournaments";
import { useTranslation } from "@/components/providers/i18n-provider";
import type { TournamentCategory, TournamentParticipant } from "@/types";

interface TournamentPreflightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  categories: TournamentCategory[];
  participants: TournamentParticipant[];
  onConfirmProceed: () => Promise<void>;
  onSuccessClean: () => void;
  onGoToCategories: () => void;
}

export function TournamentPreflightModal({
  open,
  onOpenChange,
  tournamentId,
  categories,
  participants,
  onConfirmProceed,
  onSuccessClean,
  onGoToCategories,
}: TournamentPreflightModalProps) {
  const { t } = useTranslation();
  const [cleaning, setCleaning] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  // Group participants by categoryId
  const participantsByCat = React.useMemo(() => {
    const map = new Map<string, TournamentParticipant[]>();
    categories.forEach((c) => map.set(c.id, []));
    participants.forEach((p) => {
      if (p.categoryId && map.has(p.categoryId)) {
        map.get(p.categoryId)?.push(p);
      }
    });
    return map;
  }, [categories, participants]);

  const emptyCategories = categories.filter(
    (c) => (participantsByCat.get(c.id) || []).length === 0
  );
  const singleCompetitorCategories = categories.filter(
    (c) => (participantsByCat.get(c.id) || []).length === 1
  );
  const validCategories = categories.filter(
    (c) => (participantsByCat.get(c.id) || []).length >= 2
  );

  const hasIssues = emptyCategories.length > 0 || singleCompetitorCategories.length > 0;

  const handleAutoCleanAndProceed = async () => {
    setCleaning(true);
    try {
      if (emptyCategories.length > 0) {
        const res = await cleanDesertCategoriesAction(tournamentId);
        if (!res.success) {
          toast.error(
            res.error ||
              t(
                "tournamentsPage.cleanError",
                "Error al limpiar categorías desiertas."
              )
          );
          setCleaning(false);
          return;
        }
        toast.success(
          t(
            "tournamentsPage.desertCategoriesCleaned",
            "Se eliminaron las categorías desiertas seleccionadas."
          )
        );
        onSuccessClean();
      }

      await onConfirmProceed();
      onOpenChange(false);
    } catch {
      toast.error(
        t(
          "tournamentsPage.unexpectedServerError",
          "Error inesperado en servidor."
        )
      );
    } finally {
      setCleaning(false);
    }
  };

  const handleDirectProceed = async () => {
    setProceeding(true);
    try {
      await onConfirmProceed();
      onOpenChange(false);
    } catch {
      toast.error(
        t(
          "tournamentsPage.unexpectedStatusError",
          "Error inesperado al cambiar estatus."
        )
      );
    } finally {
      setProceeding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white">
                {t(
                  "tournamentsPage.preflightModalTitle",
                  "Auditoría Pre-Pesaje y Asistencia"
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                {t(
                  "tournamentsPage.preflightModalDesc",
                  "Verifica la distribución de categorías y el quórum de competidores antes de iniciar."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 my-4">
          {/* Summary Badges Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              <div className="text-2xl font-black">{emptyCategories.length}</div>
              <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1">
                <Tag className="w-3 h-3 shrink-0" />
                {t("tournamentsPage.desertBadge", "Desiertas (0)")}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <div className="text-2xl font-black">{singleCompetitorCategories.length}</div>
              <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                {t("tournamentsPage.noQuorumBadge", "Sin Quórum (1)")}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <div className="text-2xl font-black">{validCategories.length}</div>
              <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {t("tournamentsPage.quorumBadge", "Con Quórum (2+)")}
              </div>
            </div>
          </div>

          {/* Details Scroll Area */}
          <div className="max-h-64 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {emptyCategories.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/15 space-y-2">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t(
                    "tournamentsPage.desertCategoriesHeader",
                    "Categorías Desiertas sin Inscritos"
                  )}{" "}
                  ({emptyCategories.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {emptyCategories.map((c) => (
                    <span
                      key={c.id}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-semibold"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {singleCompetitorCategories.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-2">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {t(
                    "tournamentsPage.singleCompetitorHeader",
                    "Categorías con 1 solo competidor"
                  )}{" "}
                  ({singleCompetitorCategories.length})
                </h4>
                <div className="space-y-1.5">
                  {singleCompetitorCategories.map((c) => {
                    const comp = (participantsByCat.get(c.id) || [])[0];
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 text-xs text-zinc-800 dark:text-zinc-200"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {comp
                            ? `${comp.firstName} ${comp.lastName || ""}`
                            : t("tournamentsPage.singleCompetitorLabel", "1 competidor")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!hasIssues && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                {t(
                  "tournamentsPage.allQuorumSuccess",
                  "Todas las categorías activas cuentan con quórum suficiente para iniciar el pesaje."
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            onClick={onGoToCategories}
            className="w-full sm:w-auto rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            {t("tournamentsPage.reviewCategoriesBtn", "Revisar Categorías")}
          </Button>

          {emptyCategories.length > 0 && (
            <Button
              onClick={handleAutoCleanAndProceed}
              disabled={cleaning || proceeding}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              {cleaning ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              {t(
                "tournamentsPage.cleanAndProceedBtn",
                "Limpiar Desiertas y Avanzar"
              )}
            </Button>
          )}

          <Button
            onClick={handleDirectProceed}
            disabled={cleaning || proceeding}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
          >
            {proceeding ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-1.5" />
            )}
            {t("tournamentsPage.proceedToWeighInBtn", "Avanzar a Pesaje")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

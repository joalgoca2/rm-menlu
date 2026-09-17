"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  generateTournamentBracketsAction,
  updateMatchScoreAction,
} from "@/actions/tournaments";
import type {
  TournamentCategory,
  TournamentMatch,
  TournamentParticipant,
} from "@/types";
import { Swords, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface TournamentBracketsTabProps {
  categories: TournamentCategory[];
  participants: TournamentParticipant[];
  onRefresh: () => void;
}

export function TournamentBracketsTab({
  categories,
  participants,
  onRefresh,
}: TournamentBracketsTabProps) {
  const { t } = useTranslation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingScores, setEditingScores] = useState<
    Record<string, { redScore: number; blueScore: number }>
  >({});
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryMatches = selectedCategory?.matches || [];
  const categoryParticipants = participants.filter(
    (p) => p.categoryId === selectedCategoryId
  );

  // Group matches by roundIndex
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  categoryMatches.forEach((m) => {
    const rNum = (m as unknown as { roundIndex?: number; round?: number }).roundIndex ||
      (m as unknown as { roundIndex?: number; round?: number }).round || 1;
    if (!matchesByRound[rNum]) {
      matchesByRound[rNum] = [];
    }
    matchesByRound[rNum].push(m);
  });

  const roundNumbers = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const handleGenerateBrackets = async () => {
    if (!selectedCategoryId) {
      toast.error(
        t(
          "tournamentsPage.selectCategoryFirst",
          "Selecciona una categoría primero."
        )
      );
      return;
    }

    if (categoryParticipants.length < 2) {
      toast.error(
        t(
          "tournamentsPage.minParticipantsForBrackets",
          "Se requieren al menos 2 competidores para generar el pareo."
        )
      );
      return;
    }

    if (
      categoryMatches.length > 0 &&
      !confirm(
        t(
          "tournamentsPage.confirmRegenerateBrackets",
          "Ya existen combates en esta categoría. ¿Deseas regenerar el pareo?"
        )
      )
    ) {
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateTournamentBracketsAction(selectedCategoryId);
      if (res.success) {
        toast.success(
          t(
            "tournamentsPage.bracketsGenerated",
            "Pareo de rondas generado con éxito."
          )
        );
        onRefresh();
      } else {
        toast.error(
          res.error ||
            t("tournamentsPage.generateBracketsError", "Error al generar brackets.")
        );
      }
    } catch {
      toast.error(
        t("tournamentsPage.unexpectedServerError", "Error inesperado en servidor.")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScoreChange = (
    matchId: string,
    field: "redScore" | "blueScore",
    val: number
  ) => {
    const targetMatch = categoryMatches.find((m) => m.id === matchId);
    setEditingScores((prev) => {
      const current = prev[matchId] || {
        redScore: targetMatch?.redScore || 0,
        blueScore: targetMatch?.blueScore || 0,
      };
      return {
        ...prev,
        [matchId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleSaveScore = async (match: TournamentMatch, winnerId?: string) => {
    setSavingMatchId(match.id);
    try {
      const scoreObj = editingScores[match.id] || {
        redScore: match.redScore || 0,
        blueScore: match.blueScore || 0,
      };

      const redId =
        match.redStudentId ||
        (match as unknown as { competitor1Id?: string }).competitor1Id;
      const blueId =
        match.blueStudentId ||
        (match as unknown as { competitor2Id?: string }).competitor2Id;

      const finalWinnerId =
        winnerId !== undefined
          ? winnerId
          : scoreObj.redScore > scoreObj.blueScore
          ? redId || undefined
          : scoreObj.blueScore > scoreObj.redScore
          ? blueId || undefined
          : undefined;

      const res = await updateMatchScoreAction(
        match.id,
        scoreObj.redScore,
        scoreObj.blueScore,
        finalWinnerId,
        "COMPLETED"
      );

      if (res.success) {
        toast.success(
          t("tournamentsPage.scoreSaved", "Resultado de combate guardado.")
        );
        onRefresh();
      } else {
        toast.error(
          res.error ||
            t("tournamentsPage.saveScoreError", "Error al guardar combate.")
        );
      }
    } catch {
      toast.error(
        t("tournamentsPage.unexpectedServerError", "Error inesperado en servidor.")
      );
    } finally {
      setSavingMatchId(null);
    }
  };

  const getCompetitorName = (id?: string | null) => {
    if (!id) return t("tournamentsPage.byeOrTbd", "BYE / Por Definir");
    const p = participants.find((part) => part.studentId === id || part.id === id);
    if (!p) return t("tournamentsPage.competitor", "Competidor");
    return `${p.firstName} ${p.lastName || ""}`.trim();
  };

  return (
    <div className="space-y-6">
      {/* Category Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {t("tournamentsPage.selectCategory", "Categoría")}:
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white font-bold focus:outline-none"
          >
            {categories.length === 0 ? (
              <option value="">
                {t("tournamentsPage.noCategoriesAvailable", "Sin Categorías")}
              </option>
            ) : (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} (
                  {participants.filter((p) => p.categoryId === cat.id).length}{" "}
                  {t("tournamentsPage.competitorsShort", "comp.")})
                </option>
              ))
            )}
          </select>
        </div>

        <Button
          onClick={handleGenerateBrackets}
          disabled={isGenerating || !selectedCategoryId}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-xs w-full sm:w-auto"
        >
          <RefreshCw
            className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
          />
          {t("tournamentsPage.generatePairings", "Generar Brackets")}
        </Button>
      </div>

      {/* Bracket Tree View */}
      {roundNumbers.length === 0 ? (
        <Card className="p-12 text-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl space-y-2 shadow-xs">
          <Swords className="w-10 h-10 text-zinc-400 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            {t("tournamentsPage.noMatchesYet", "Sin combates generados")}
          </h4>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {t(
              "tournamentsPage.noMatchesHint",
              "Haz clic en 'Generar Brackets' para crear los pareos de eliminación."
            )}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-6 min-w-[700px]">
            {roundNumbers.map((rNum) => {
              const matchesInRound = matchesByRound[rNum] || [];
              const roundTitle =
                rNum === roundNumbers.length && roundNumbers.length > 1
                  ? t("tournamentsPage.finalRound", "GRAN FINAL")
                  : rNum === roundNumbers.length - 1 && roundNumbers.length > 2
                  ? t("tournamentsPage.semifinals", "SEMIFINALES")
                  : `${t("tournamentsPage.round", "Ronda")} ${rNum}`;

              return (
                <div key={rNum} className="flex-1 space-y-4">
                  <div className="text-center bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 py-2 rounded-xl text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-center gap-2">
                    {rNum === roundNumbers.length && (
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {roundTitle}
                  </div>

                  <div className="space-y-4">
                    {matchesInRound.map((m) => {
                      const redId =
                        m.redStudentId ||
                        (m as unknown as { competitor1Id?: string }).competitor1Id;
                      const blueId =
                        m.blueStudentId ||
                        (m as unknown as { competitor2Id?: string }).competitor2Id;
                      const winnerId =
                        m.winnerStudentId ||
                        (m as unknown as { winnerId?: string }).winnerId;

                      const scores = editingScores[m.id] || {
                        redScore: m.redScore || 0,
                        blueScore: m.blueScore || 0,
                      };
                      const isSaving = savingMatchId === m.id;

                      return (
                        <Card
                          key={m.id}
                          className={`p-3.5 space-y-2 border rounded-2xl bg-white dark:bg-zinc-900 shadow-xs ${
                            m.status === "COMPLETED"
                              ? "border-emerald-500/30"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                        >
                          {/* Competitor Red */}
                          <div
                            className={`flex justify-between items-center p-2 rounded-xl text-xs font-semibold border ${
                              winnerId === redId && redId
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                            }`}
                          >
                            <span className="truncate max-w-[140px] flex items-center gap-1.5">
                              {winnerId === redId && redId && (
                                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              {getCompetitorName(redId)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={scores.redScore}
                                onChange={(e) =>
                                  handleScoreChange(
                                    m.id,
                                    "redScore",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center rounded-lg px-1 py-0.5 text-amber-600 dark:text-amber-400 font-extrabold focus:outline-none"
                              />
                              {redId && (
                                <button
                                  onClick={() => handleSaveScore(m, redId)}
                                  className="text-[10px] bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  title={t("tournamentsPage.markWinner", "Ganador")}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-center text-[10px] text-zinc-400 uppercase font-black tracking-widest">
                            vs
                          </div>

                          {/* Competitor Blue */}
                          <div
                            className={`flex justify-between items-center p-2 rounded-xl text-xs font-semibold border ${
                              winnerId === blueId && blueId
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                            }`}
                          >
                            <span className="truncate max-w-[140px] flex items-center gap-1.5">
                              {winnerId === blueId && blueId && (
                                <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              )}
                              {getCompetitorName(blueId)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={scores.blueScore}
                                onChange={(e) =>
                                  handleScoreChange(
                                    m.id,
                                    "blueScore",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center rounded-lg px-1 py-0.5 text-amber-600 dark:text-amber-400 font-extrabold focus:outline-none"
                              />
                              {blueId && (
                                <button
                                  onClick={() => handleSaveScore(m, blueId)}
                                  className="text-[10px] bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                                  title={t("tournamentsPage.markWinner", "Ganador")}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={isSaving}
                            onClick={() => handleSaveScore(m)}
                            className="w-full text-[11px] font-bold py-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl cursor-pointer shadow-xs"
                          >
                            {isSaving
                              ? t("common.saving", "Guardando...")
                              : t("tournamentsPage.saveMatchScore", "Guardar Marcador")}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

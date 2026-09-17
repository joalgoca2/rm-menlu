"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { checkInParticipantAction } from "@/actions/tournaments";
import type { TournamentParticipant } from "@/types";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Search,
  User,
  ShieldAlert,
  Save,
  QrCode,
  Camera,
  VideoOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TournamentQRScanner } from "./tournament-qr-scanner";
import { TournamentCheckinExpressModal } from "./tournament-checkin-express-modal";

interface TournamentCheckinTabProps {
  tournamentId?: string;
  participants: TournamentParticipant[];
  onRefresh: () => void;
}

export function TournamentCheckinTab({
  tournamentId = "",
  participants,
  onRefresh,
}: TournamentCheckinTabProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "CHECKED_IN" | "PENDING"
  >("ALL");
  const [editingWeights, setEditingWeights] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // QR Station Modal state
  const [showStationModal, setShowStationModal] = useState(false);

  const filteredParticipants = participants.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName || ""}`.toLowerCase();
    const dojo = (p.dojoName || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      dojo.includes(searchTerm.toLowerCase());

    if (filterStatus === "CHECKED_IN") return matchesSearch && p.isCheckedIn;
    if (filterStatus === "PENDING") return matchesSearch && !p.isCheckedIn;
    return matchesSearch;
  });

  const checkedInCount = participants.filter((p) => p.isCheckedIn).length;
  const pendingCount = participants.length - checkedInCount;

  const handleWeightChange = (id: string, val: string) => {
    setEditingWeights((prev) => ({ ...prev, [id]: val }));
  };

  const handleCheckInToggle = async (
    participant: TournamentParticipant,
    shouldCheckIn: boolean
  ) => {
    setLoadingId(participant.id);
    try {
      const rawWeight = editingWeights[participant.id];
      const actualWeightKg =
        rawWeight !== undefined && rawWeight !== ""
          ? parseFloat(rawWeight)
          : participant.actualWeightKg ?? participant.weightKg ?? undefined;

      const res = await checkInParticipantAction(
        participant.id,
        actualWeightKg,
        shouldCheckIn
      );

      if (res.success) {
        toast.success(
          shouldCheckIn
            ? t(
                "tournamentsPage.checkinSuccess",
                "Pesaje y registro presencial completado."
              )
            : t("tournamentsPage.checkinCancelled", "Registro presencial removido.")
        );
        onRefresh();
      } else {
        toast.error(res.error || "Error al actualizar pesaje.");
      }
    } catch {
      toast.error("Error inesperado en servidor.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {t("tournamentsPage.totalInscribed", "Total Inscritos")}
            </p>
            <p className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {participants.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {t("tournamentsPage.checkedInCount", "Verificados en Báscula")}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {checkedInCount}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              {t("tournamentsPage.pendingCheckinCount", "Pendientes de Báscula")}
            </p>
            <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </p>
          </div>
        </Card>
      </div>

      {/* Filter & QR Station Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2.5 w-full sm:w-80 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              placeholder={t(
                "tournamentsPage.searchCompetitor",
                "Buscar competidor o dojo..."
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 font-medium"
            />
          </div>

          <Button
            onClick={() => setShowStationModal(true)}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
          >
            <Camera className="w-4 h-4 mr-1.5" />
            Abrir Estación de Báscula QR
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant={filterStatus === "ALL" ? "default" : "ghost"}
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              filterStatus === "ALL"
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t("common.all", "Todos")} ({participants.length})
          </Button>

          <Button
            size="sm"
            variant={filterStatus === "PENDING" ? "default" : "ghost"}
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              filterStatus === "PENDING"
                ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t("tournamentsPage.pending", "Pendientes")} ({pendingCount})
          </Button>

          <Button
            size="sm"
            variant={filterStatus === "CHECKED_IN" ? "default" : "ghost"}
            onClick={() => setFilterStatus("CHECKED_IN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              filterStatus === "CHECKED_IN"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {t("tournamentsPage.checkedIn", "Listos")} ({checkedInCount})
          </Button>
        </div>
      </div>

      {/* Checkin Table */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 uppercase">
              <tr>
                <th className="p-4">{t("tournamentsPage.competitor", "Competidor")}</th>
                <th className="p-4">{t("tournamentsPage.dojo", "Escuela / Dojo")}</th>
                <th className="p-4">{t("tournamentsPage.category", "Categoría")}</th>
                <th className="p-4">{t("tournamentsPage.weights", "Peso (Declarado / Báscula)")}</th>
                <th className="p-4 text-center">{t("tournamentsPage.status", "Estatus")}</th>
                <th className="p-4 text-right">{t("common.actions", "Acciones")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400 font-medium">
                    {t("tournamentsPage.noParticipantsFound", "No se encontraron competidores.")}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const currentVal =
                    editingWeights[p.id] !== undefined
                      ? editingWeights[p.id]
                      : p.actualWeightKg !== null && p.actualWeightKg !== undefined
                      ? String(p.actualWeightKg)
                      : p.weightKg !== null && p.weightKg !== undefined
                      ? String(p.weightKg)
                      : "";

                  const isLoading = loadingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="p-4 font-bold text-zinc-900 dark:text-white">
                        {p.firstName} {p.lastName || ""}
                        {p.beltName && (
                          <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                            {p.beltName}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-zinc-700 dark:text-zinc-300 font-semibold">
                        {p.dojoName || "Menlu Dojo"}
                      </td>
                      <td className="p-4 text-zinc-500 dark:text-zinc-400 font-medium">
                        {p.category?.name || "Sin Categoría"}
                      </td>
                      <td className="p-4 space-y-1">
                        {/* Renglón 1: Peso Declarado */}
                        <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                          <span className="text-zinc-400 dark:text-zinc-500">Declarado:</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {p.weightKg ? `${p.weightKg} kg` : "N/A"}
                          </span>
                        </div>
                        {/* Renglón 2: Peso en Báscula */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            Báscula:
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={currentVal}
                            onChange={(e) => handleWeightChange(p.id, e.target.value)}
                            className="w-20 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold focus:outline-none"
                          />
                          <span className="text-[10px] text-zinc-400 font-mono">kg</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {p.isCheckedIn ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            {t("tournamentsPage.checkedIn", "Verificado")}
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                            {t("tournamentsPage.pending", "Pendiente")}
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {p.isCheckedIn ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isLoading}
                            onClick={() => handleCheckInToggle(p, false)}
                            className="text-xs font-semibold text-zinc-500 hover:text-rose-500 rounded-xl cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            {t("tournamentsPage.uncheckIn", "Desmarcar")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleCheckInToggle(p, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5 mr-1" />
                            {t("tournamentsPage.confirmCheckin", "Confirmar Pesaje")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Express Weigh-in Station Modal */}
      {showStationModal && (
        <TournamentCheckinExpressModal
          open={showStationModal}
          onOpenChange={setShowStationModal}
          tournamentId={tournamentId}
          participants={participants}
          onSuccessCheckin={onRefresh}
        />
      )}
    </div>
  );
}

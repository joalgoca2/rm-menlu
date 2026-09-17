"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import {
  getTournamentByIdAction,
  getTournamentParticipantsAction,
  awardParticipantAction,
  deleteParticipantAction,
  updateTournamentAction,
  updateTournamentStatusAction,
  updateParticipantCategoryAction,
  cleanDesertCategoriesAction,
} from "@/actions/tournaments";
import { getDiplomaConfigAction } from "@/actions/diploma";
import type {
  Tournament,
  TournamentCategory,
  TournamentParticipant,
  DiplomaConfig,
} from "@/types";
import { TournamentCheckinTab } from "@/components/tournaments/tournament-checkin-tab";
import { TournamentCategoriesTab } from "@/components/tournaments/tournament-categories-tab";
import { TournamentBracketsTab } from "@/components/tournaments/tournament-brackets-tab";
import { TournamentWizard } from "@/components/tournaments/tournament-wizard";
import { TournamentSettingsTab } from "@/components/tournaments/tournament-settings-tab";
import { TournamentPreflightModal } from "@/components/tournaments/tournament-preflight-modal";
import { ShareDropdown } from "@/components/tournaments/share-dropdown";
import { PrintDropdown } from "@/components/tournaments/print-dropdown";
import { PrintSingleCredentialButton } from "@/components/tournaments/print-credentials-button";
import { TournamentParticipantsDialog } from "@/components/tournaments/tournament-participants-dialog";
import { TournamentPaymentModal } from "@/components/tournaments/tournament-payment-modal";
import { TournamentEditParticipantModal } from "@/components/tournaments/tournament-edit-participant-modal";
import { printTournamentDiplomas } from "@/lib/print-utils";
import {
  ArrowLeft,
  Users,
  Tag,
  Scale,
  Activity,
  Swords,
  Settings,
  Printer,
  Plus,
  Trash2,
  DollarSign,
  Trophy,
  Loader2,
  Search,
  CheckCircle2,
  Check,
  X,
  Edit2,
  Pencil,
  Lock,
  ArrowRight,
  RotateCcw,
  Flag,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

const formatDateStr = (dateVal?: Date | string | null): string => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") {
    return dateVal.split("T")[0];
  }
  try {
    return new Date(dateVal).toISOString().split("T")[0];
  } catch {
    return String(dateVal);
  }
};

const getTournamentDateDisplay = (
  startDate?: Date | string,
  endDate?: Date | string | null
): string => {
  const start = formatDateStr(startDate);
  const end = formatDateStr(endDate);
  if (end && end !== start) {
    return `${start} — ${end}`;
  }
  return start;
};

const getTournamentLocationDisplay = (
  location?: string | null,
  city?: string | null,
  country?: string | null
): string => {
  const venue = location?.trim();
  const cityCountry = [city?.trim(), country?.trim()].filter(Boolean).join(", ");

  if (venue && cityCountry) {
    return `${venue} (${cityCountry})`;
  }
  if (venue) return venue;
  if (cityCountry) return cityCountry;
  return "Instalaciones del Dojo";
};

type TabType =
  | "participants"
  | "categories"
  | "checkin"
  | "status"
  | "brackets"
  | "settings";

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t } = useTranslation();
  const { canAccessTournaments, getUpgradeMessage } = useEntitlements();

  const [activeTab, setActiveTab] = useState<TabType>("participants");
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [diplomaConfig, setDiplomaConfig] = useState<DiplomaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedPaymentParticipant, setSelectedPaymentParticipant] =
    useState<TournamentParticipant | null>(null);
  const [editingParticipant, setEditingParticipant] =
    useState<TournamentParticipant | null>(null);
  const [showStatusPreflightModal, setShowStatusPreflightModal] = useState(false);
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false);

  // Search & Filter state for participants
  const [participantSearch, setParticipantSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline Category Editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [selectedCategoryValue, setSelectedCategoryValue] = useState<string>("");
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  const fetchTournamentData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [tRes, pRes, dRes] = await Promise.all([
        getTournamentByIdAction(id),
        getTournamentParticipantsAction(id),
        getDiplomaConfigAction("TOURNAMENT"),
      ]);

      if (tRes.success && tRes.data) {
        setTournament(tRes.data);
        setCategories(tRes.data.categories || []);
      } else {
        toast.error(tRes.error || "Torneo no encontrado.");
      }

      if (pRes.success && pRes.data) {
        setParticipants(pRes.data);
      }

      if (dRes.success && dRes.data) {
        setDiplomaConfig(dRes.data);
      }
    } catch {
      toast.error("Error al cargar torneo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const handleStatusChange = async (newStatus: string) => {
    if (!tournament) return;
    if (newStatus === "WEIGH_IN") {
      setShowStatusPreflightModal(true);
      return;
    }
    try {
      const res = await updateTournamentStatusAction(tournament.id, newStatus);
      if (res.success) {
        setTournament((prev) =>
          prev ? { ...prev, status: newStatus as unknown as string } : null
        );
        toast.success(
          t("tournamentsPage.statusUpdated", "Estatus del torneo actualizado.")
        );
      } else {
        toast.error(res.error || "Error al cambiar estatus.");
      }
    } catch {
      toast.error("Error inesperado en servidor.");
    }
  };

  const handleAwardChange = async (
    participantId: string,
    awardRank: "GOLD" | "SILVER" | "BRONZE" | "PARTICIPANT" | null
  ) => {
    setActionLoadingId(participantId);
    try {
      const res = await awardParticipantAction(participantId, awardRank);
      if (res.success) {
        toast.success(
          t("tournamentsPage.awardSaved", "Premio asignado con éxito.")
        );
        fetchTournamentData();
      } else {
        toast.error(res.error || "Error al asignar premio.");
      }
    } catch {
      toast.error("Error en servidor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (
      !confirm(
        t(
          "common.confirmDelete",
          "¿Estás seguro de desvincular a este participante?"
        )
      )
    ) {
      return;
    }

    setActionLoadingId(participantId);
    try {
      const res = await deleteParticipantAction(participantId);
      if (res.success) {
        toast.success(
          t("tournamentsPage.participantDeleted", "Participante desvinculado.")
        );
        fetchTournamentData();
      } else {
        toast.error(res.error || "Error al desvincular.");
      }
    } catch {
      toast.error("Error en servidor.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveParticipantCategory = async (participantId: string) => {
    setSavingCategoryId(participantId);
    try {
      const res = await updateParticipantCategoryAction(
        participantId,
        selectedCategoryValue || null
      );
      if (res.success) {
        toast.success(t("tournamentsPage.categoryUpdated", "Categoría actualizada correctamente."));
        setEditingCategoryId(null);
        await fetchTournamentData();
      } else {
        toast.error(res.error || "Error al actualizar la categoría.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar la categoría.");
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handlePrintDiplomas = (mode: "PARTICIPATION" | "WINNERS") => {
    if (!tournament) return;
    const items = participants.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      dojoName: p.dojoName,
      categoryName: p.category?.name || "General",
      awardRank: p.awardRank,
    }));

    printTournamentDiplomas({
      tournamentTitle: tournament.title,
      tournamentDateStr: new Date(
        tournament.tournamentDate
      ).toLocaleDateString("es-ES"),
      participants: items,
      diplomaConfig,
      mode,
    });
  };

  // Plan Entitlement Check
  if (!canAccessTournaments) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20 bg-zinc-900/90 border border-zinc-800 rounded-3xl my-10 shadow-xl">
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {t(
            "tournamentsPage.proRequiredTitle",
            "Módulo de Torneos Exclusivo Plan Pro"
          )}
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed">
          {getUpgradeMessage("Módulo de Torneos")}
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors"
        >
          {t("common.upgradePlan", "Actualizar Plan a Pro")}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-xs font-semibold">
          {t("common.loading", "Cargando torneo...")}
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
        <p>{t("tournamentsPage.notFound", "Torneo no encontrado.")}</p>
        <Link
          href="/dashboard/tournaments"
          className="inline-block mt-4 text-amber-500 underline text-sm font-semibold"
        >
          {t("common.backToTournaments", "Volver a Torneos")}
        </Link>
      </div>
    );
  }

  const filteredParticipants = participants.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName || ""}`.toLowerCase();
    const dojo = (p.dojoName || "").toLowerCase();
    return (
      fullName.includes(participantSearch.toLowerCase()) ||
      dojo.includes(participantSearch.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header banner */}
      <div
        className={
          "relative overflow-hidden flex flex-col sm:flex-row justify-between items-start " +
          "sm:items-center gap-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white " +
          "p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
        }
      >
        <div
          className={
            "absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 " +
            "rounded-full blur-3xl pointer-events-none"
          }
        />

        <div className="flex items-center gap-4 relative z-10">
          <Link
            href="/dashboard/tournaments"
            className={
              "p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border " +
              "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 " +
              "hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 " +
              "dark:hover:bg-zinc-700 transition-colors"
            }
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                {tournament.title}
              </h1>
              {tournament.status === "FINISHED" ? (
                <Badge
                  className={
                    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 " +
                    "border-emerald-500/30 text-[10px] font-extrabold uppercase"
                  }
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Finalizado
                </Badge>
              ) : tournament.status === "IN_PROGRESS" ? (
                <Badge
                  className={
                    "bg-amber-500/15 text-amber-700 dark:text-amber-300 " +
                    "border-amber-500/30 text-[10px] font-extrabold uppercase"
                  }
                >
                  ⚡ En Ejecución
                </Badge>
              ) : (
                <Badge
                  className={
                    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 " +
                    "border-indigo-500/30 text-[10px] font-extrabold uppercase"
                  }
                >
                  📅 Borrador
                </Badge>
              )}
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="font-mono">
                📅 {getTournamentDateDisplay(tournament.tournamentDate, tournament.endDate)}
              </span>
              <span>•</span>
              {tournament.googleMapsUrl ? (
                <a
                  href={tournament.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-amber-500 transition-colors flex items-center gap-1"
                >
                  📍 {getTournamentLocationDisplay(tournament.location, tournament.city, tournament.country)}
                </a>
              ) : (
                <span>📍 {getTournamentLocationDisplay(tournament.location, tournament.city, tournament.country)}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Tournament Orchestration Wizard */}
      <TournamentWizard
        tournament={tournament}
        participantsCount={participants.length}
        categoriesCount={categories.length}
        categories={categories}
        participants={participants}
        activeTab={activeTab}
        onTabChange={(tKey) => setActiveTab(tKey as TabType)}
        onRefresh={fetchTournamentData}
      />

      {/* Navigation 6 Responsive Tabs (Grid 3x / 6x, No Scrollbar) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 w-full gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab("participants")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "participants"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {t("tournamentsPage.tabParticipants", "Participantes")} ({participants.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "categories"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {t("tournamentsPage.tabCategories", "Categorías")} ({categories.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("status")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "status"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t("tournamentsPage.tabStatus", "Estado")}</span>
        </button>

        <button
          onClick={() => setActiveTab("checkin")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "checkin"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {t("tournamentsPage.tabCheckin", "Pesaje / Asistencia")}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("brackets")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "brackets"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Swords className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t("tournamentsPage.tabBrackets", "Brackets / Llaves")}</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "settings"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t("tournamentsPage.tabSettings", "Configuración")}</span>
        </button>
      </div>

      {/* Tab 1: PARTICIPANTES */}
      {activeTab === "participants" && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center gap-2.5 w-full lg:w-72 bg-zinc-50 dark:bg-zinc-800/60 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder={t("tournamentsPage.searchCompetitor", "Buscar competidor...")}
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <ShareDropdown
                tournamentId={tournament.id}
                tournamentTitle={tournament.title}
              />

              <PrintDropdown
                tournamentId={tournament.id}
                tournamentTitle={tournament.title}
                tournamentDate={tournament.tournamentDate}
                tournamentLocation={tournament.location}
                tournamentCity={tournament.city}
                participants={participants}
                onPrintDiplomas={(type) => handlePrintDiplomas(type)}
              />

              <Button
                onClick={() => setShowEnrollDialog(true)}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t("tournamentsPage.enrollParticipants", "Inscribir Participantes")}
              </Button>
            </div>
          </div>

          {/* Table of Participants */}
          <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4 w-12 text-center">PAGO</th>
                    <th className="p-4">{t("tournamentsPage.competitor", "Competidor")}</th>
                    <th className="p-4">{t("tournamentsPage.type", "Tipo")}</th>
                    <th className="p-4">{t("tournamentsPage.dojo", "Escuela / Dojo")}</th>
                    <th className="p-4">{t("tournamentsPage.category", "Categoría")}</th>
                    <th className="p-4 text-right">{t("common.actions", "Acciones")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-zinc-400 font-medium">
                        {t(
                          "tournamentsPage.noParticipantsInscribed",
                          "No hay participantes inscritos en este torneo."
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* 1. Indicador de Estado de Pago (Verde / Amarillo) */}
                        <td className="p-4 text-center whitespace-nowrap">
                          {p.paymentStatus === "PAID" ? (
                            <span
                              className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/30 shadow-xs inline-block cursor-help align-middle"
                              title="Pagado"
                            />
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-amber-400/30 shadow-xs inline-block cursor-help align-middle"
                              title="Pendiente de pago"
                            />
                          )}
                        </td>

                        {/* 2. Competidor */}
                        <td className="p-4">
                          <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>{p.firstName} {p.lastName || ""}</span>
                            {p.age !== undefined && p.age !== null && (
                              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                                ({p.age} {p.age === 1 ? "año" : "años"})
                              </span>
                            )}
                          </div>
                          {p.beltName && (
                            <div className="mt-1">
                              <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
                                {p.beltName}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* 3. Tipo */}
                        <td className="p-4">
                          {p.isExternal ? (
                            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px] font-extrabold">
                              {t("tournamentsPage.external", "Externo")}
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px] font-extrabold">
                              {t("tournamentsPage.dojoStudent", "Alumno Dojo")}
                            </Badge>
                          )}
                        </td>

                        {/* 4. Escuela / Dojo */}
                        <td className="p-4 text-zinc-700 dark:text-zinc-300 font-semibold">
                          {p.dojoName || "Dojo Principal"}
                        </td>

                        {/* 5. Categoría (Píldora interactiva con edición en el mismo renglón) */}
                        <td className="p-4">
                          {editingCategoryId === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={selectedCategoryValue}
                                onChange={(e) => setSelectedCategoryValue(e.target.value)}
                                disabled={savingCategoryId === p.id}
                                className="text-xs font-semibold px-2 py-1 rounded-lg border border-amber-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 max-w-[170px]"
                              >
                                <option value="">-- Sin Categoría --</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>

                              {/* Palomita / Aceptar */}
                              <button
                                onClick={() => handleSaveParticipantCategory(p.id)}
                                disabled={savingCategoryId === p.id}
                                className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer border border-emerald-500/30"
                                title="Guardar categoría"
                              >
                                {savingCategoryId === p.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                )}
                              </button>

                              {/* Cruz / Cancelar */}
                              <button
                                onClick={() => setEditingCategoryId(null)}
                                disabled={savingCategoryId === p.id}
                                className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer border border-rose-500/30"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCategoryId(p.id);
                                setSelectedCategoryValue(p.categoryId || "");
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer group ${
                                p.category
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                              }`}
                              title="Haz clic para seleccionar o cambiar categoría"
                            >
                              <span>{p.category?.name || "Sin Categoría"}</span>
                              <Edit2 className="w-3 h-3 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                            </button>
                          )}
                        </td>

                        {/* 6. Acciones */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.paymentStatus !== "PAID" && (
                              <button
                                onClick={() => setSelectedPaymentParticipant(p)}
                                className="p-1.5 text-zinc-400 hover:text-emerald-500 rounded-lg transition-colors cursor-pointer"
                                title={`Registrar Pago ($${p.feeAmount})`}
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => setEditingParticipant(p)}
                              className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                              title={t("common.edit", "Editar participante")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <PrintSingleCredentialButton
                              tournamentTitle={tournament.title}
                              tournamentDate={tournament.tournamentDate}
                              location={tournament.location}
                              city={tournament.city}
                              participant={p}
                            />

                            <button
                              disabled={actionLoadingId === p.id}
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title={t("common.delete", "Desvincular")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: CATEGORÍAS */}
      {activeTab === "categories" && (
        <TournamentCategoriesTab
          tournamentId={tournament.id}
          tournamentStatus={tournament.status}
          categories={categories}
          participants={participants}
          onRefresh={fetchTournamentData}
        />
      )}

      {/* Tab 3: STATUS DEL TORNEO */}
      {activeTab === "status" && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Pre-flight Audit Card */}
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" />
                  Auditoría Pre-Asistencia y Quórum
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Valida la distribución de participantes antes de abrir la estación de báscula.
                </p>
              </div>

              <Button
                onClick={() => setShowStatusPreflightModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs shrink-0"
              >
                <Scale className="w-4 h-4 mr-1.5" />
                Auditar e Iniciar Pesaje
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {(() => {
                const catMap = new Map<string, number>();
                categories.forEach((c) => catMap.set(c.id, 0));
                participants.forEach((p) => {
                  if (p.categoryId && catMap.has(p.categoryId)) {
                    catMap.set(p.categoryId, (catMap.get(p.categoryId) || 0) + 1);
                  }
                });

                const emptyCount = categories.filter((c) => (catMap.get(c.id) || 0) === 0).length;
                const singleCount = categories.filter((c) => (catMap.get(c.id) || 0) === 1).length;
                const validCount = categories.filter((c) => (catMap.get(c.id) || 0) >= 2).length;

                return (
                  <>
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xl font-black text-rose-500">{emptyCount}</div>
                      <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Categorías Desiertas (0)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xl font-black text-amber-500">{singleCount}</div>
                      <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Sin Quórum (1 Atleta)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xl font-black text-emerald-500">{validCount}</div>
                      <div className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Con Quórum (2+ Atletas)
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </Card>

          {/* Sequential Stepper Timeline */}
          <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  Ciclo de Vida del Torneo
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Flujo secuencial controlado para proteger la integridad de las categorías y combates.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Fase Actual: {tournament.status || "DRAFT"}
                </span>
              </div>
            </div>

            {(() => {
              const STEPS = [
                {
                  key: "DRAFT",
                  label: "Borrador",
                  title: "1. Diseño e Inserción Inicial",
                  desc: "Definición general del torneo, sede y categorías iniciales.",
                  icon: Settings,
                },
                {
                  key: "REGISTRATION",
                  label: "Registro",
                  title: "2. Convocatoria y Registro",
                  desc: "Inscripción activa de participantes de escuelas e invitados.",
                  icon: Users,
                },
                {
                  key: "WEIGH_IN",
                  label: "Pesaje / Asistencia",
                  title: "3. Pesaje y Asistencia Presencial",
                  desc: "Estación de báscula presencial, confirmación de peso y pagos.",
                  icon: Scale,
                },
                {
                  key: "IN_PROGRESS",
                  label: "En Proceso",
                  title: "4. Combates y Llaves",
                  desc: "Ejecución de enfrentamientos, combates en tiempo real y puntajes.",
                  icon: Swords,
                },
                {
                  key: "FINISHED",
                  label: "Finalizado",
                  title: "5. Cierre y Premiación",
                  desc: "Torneo concluido, podios consolidados e impresión de diplomas.",
                  icon: Flag,
                },
              ];

              const getIndex = (st?: string) => {
                if (st === "DRAFT") return 0;
                if (st === "REGISTRATION") return 1;
                if (st === "WEIGH_IN") return 2;
                if (st === "IN_PROGRESS") return 3;
                if (st === "FINISHED" || st === "COMPLETED") return 4;
                return 0;
              };

              const activeIdx = getIndex(tournament.status);
              const nextStep = STEPS[activeIdx + 1];
              const prevStep = STEPS[activeIdx - 1];

              return (
                <div className="space-y-6">
                  {/* Timeline Stepper Cards */}
                  <div className="relative space-y-3">
                    {STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCompleted = idx < activeIdx;
                      const isActive = idx === activeIdx;
                      const isLocked = idx > activeIdx;

                      return (
                        <div
                          key={step.key}
                          className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                            isActive
                              ? "bg-amber-500/10 border-amber-500 shadow-xs"
                              : isCompleted
                              ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-900 dark:text-zinc-100"
                              : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 opacity-60"
                          }`}
                        >
                          {/* Step Icon Badge */}
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isActive
                                ? "bg-amber-500 text-zinc-950 font-bold"
                                : isCompleted
                                ? "bg-emerald-500 text-white font-bold"
                                : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5" />
                            ) : (
                              <StepIcon className="w-5 h-5" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                                {step.title}
                              </h4>
                              {isActive && (
                                <Badge className="bg-amber-500 text-zinc-950 border-amber-500 font-extrabold text-[10px] uppercase">
                                  Fase Activa
                                </Badge>
                              )}
                              {isCompleted && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                  Completado ✓
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                                  Bloqueado 🔒
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Primary Next Action & Discrete Rollback Action */}
                  <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {prevStep ? (
                      <Button
                        variant="ghost"
                        onClick={() => setRollbackConfirmOpen(true)}
                        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer rounded-xl"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        Regresar a la fase anterior ({prevStep.label})
                      </Button>
                    ) : (
                      <div />
                    )}

                    {nextStep ? (
                      <Button
                        onClick={() => {
                          if (nextStep.key === "WEIGH_IN") {
                            setShowStatusPreflightModal(true);
                          } else {
                            handleStatusChange(nextStep.key);
                          }
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-6 h-11 cursor-pointer shadow-xs w-full sm:w-auto"
                      >
                        Avanzar a {nextStep.title}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        El torneo ha alcanzado su etapa final.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      {/* Tab 4: REGISTRO PRESENCIAL / BÁSCULA */}
      {activeTab === "checkin" && (
        <TournamentCheckinTab
          tournamentId={tournament.id}
          participants={participants}
          onRefresh={fetchTournamentData}
        />
      )}

      {/* Tab 5: PAREO DE RONDAS / BRACKETS */}
      {activeTab === "brackets" && (
        <TournamentBracketsTab
          categories={categories}
          participants={participants}
          onRefresh={fetchTournamentData}
        />
      )}

      {/* Tab 6: CONFIGURACIÓN GENERAL Y UBICACIÓN */}
      {activeTab === "settings" && (
        <TournamentSettingsTab
          tournament={tournament}
          onRefresh={fetchTournamentData}
        />
      )}

      {/* Enrollment Dialog */}
      {showEnrollDialog && (
        <TournamentParticipantsDialog
          open={showEnrollDialog}
          onOpenChange={setShowEnrollDialog}
          tournament={tournament}
          onSuccess={fetchTournamentData}
        />
      )}

      {/* Quick Payment Modal */}
      {selectedPaymentParticipant && (
        <TournamentPaymentModal
          open={Boolean(selectedPaymentParticipant)}
          onOpenChange={(open) => !open && setSelectedPaymentParticipant(null)}
          participantId={selectedPaymentParticipant.id}
          competitorName={`${selectedPaymentParticipant.firstName} ${selectedPaymentParticipant.lastName || ""}`}
          tournamentTitle={tournament.title}
          feeAmount={
            selectedPaymentParticipant.feeAmount > 0
              ? selectedPaymentParticipant.feeAmount
              : (tournament.feeAmount || 0)
          }
          onSuccess={fetchTournamentData}
        />
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <TournamentEditParticipantModal
          open={Boolean(editingParticipant)}
          onOpenChange={(open) => !open && setEditingParticipant(null)}
          participant={editingParticipant}
          categories={categories}
          onSuccess={fetchTournamentData}
        />
      )}

      {/* Pre-Flight Category Audit Modal */}
      {showStatusPreflightModal && (
        <TournamentPreflightModal
          open={showStatusPreflightModal}
          onOpenChange={setShowStatusPreflightModal}
          tournamentId={tournament.id}
          categories={categories}
          participants={participants}
          onConfirmProceed={async () => {
            const res = await updateTournamentStatusAction(tournament.id, "WEIGH_IN");
            if (res.success) {
              setTournament((prev) => (prev ? { ...prev, status: "WEIGH_IN" } : null));
              toast.success("Torneo cambiado a estatus de Pesaje / Asistencia.");
            } else {
              toast.error(res.error || "Error al actualizar estado.");
            }
          }}
          onSuccessClean={fetchTournamentData}
          onGoToCategories={() => {
            setShowStatusPreflightModal(false);
            setActiveTab("categories");
          }}
        />
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackConfirmOpen && tournament && (
        <AlertDialog open={rollbackConfirmOpen} onOpenChange={setRollbackConfirmOpen}>
          <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl max-w-md p-6">
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
                ¿Regresar a la Fase Anterior?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 pt-2">
                <span>
                  Al retroceder la fase del torneo, se reabrirán las modificaciones de la etapa seleccionada. Asegúrate de verificar las inscripciones antes de volver a avanzar.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel className="rounded-xl text-xs font-bold cursor-pointer">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  setRollbackConfirmOpen(false);
                  const getIdx = (st?: string) => {
                    if (st === "DRAFT") return 0;
                    if (st === "REGISTRATION") return 1;
                    if (st === "WEIGH_IN") return 2;
                    if (st === "IN_PROGRESS") return 3;
                    if (st === "FINISHED" || st === "COMPLETED") return 4;
                    return 0;
                  };
                  const STEPS_KEYS = ["DRAFT", "REGISTRATION", "WEIGH_IN", "IN_PROGRESS", "FINISHED"];
                  const curIdx = getIdx(tournament.status);
                  if (curIdx > 0) {
                    const prevKey = STEPS_KEYS[curIdx - 1];
                    const res = await updateTournamentStatusAction(tournament.id, prevKey);
                    if (res.success) {
                      setTournament((prev) => (prev ? { ...prev, status: prevKey } : null));
                      toast.success(`Estado retrocedido a ${prevKey}.`);
                    } else {
                      toast.error(res.error || "Error al retroceder estatus.");
                    }
                  }
                }}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs px-5 cursor-pointer"
              >
                Confirmar Retroceso
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

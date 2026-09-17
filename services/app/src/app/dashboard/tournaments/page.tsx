"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Plus,
  Lock,
  Search,
  LayoutGrid,
  List,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Play,
  Copy,
  Layers,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useEntitlements } from "@/hooks/use-entitlements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { PaginationControl } from "@/components/ui/pagination-control";
import { TournamentFormDialog } from "@/components/tournaments/tournament-form-dialog";
import {
  getTournamentsByBrandAction,
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  duplicateTournamentAction,
  createTournamentCategoryAction,
  getCategoriesByTournamentAction,
  deleteTournamentCategoryAction,
} from "@/actions/tournaments";
import type { Tournament, TournamentCategory } from "@/types";
import Link from "next/link";
import { toast } from "sonner";

interface TournamentWithDetails extends Tournament {
  categories?: TournamentCategory[];
  participants?: { id: string }[];
}

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
  return "Dojo Principal";
};

function TournamentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBrandId } = useBrand();
  const { t } = useTranslation();
  const { canAccessTournaments, getUpgradeMessage } = useEntitlements();

  const searchFromUrl = searchParams.get("search") || "";
  const statusFromUrl = searchParams.get("status") || "ALL";
  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [statusInput, setStatusInput] = useState(statusFromUrl);
  const [appliedSearch, setAppliedSearch] = useState(searchFromUrl);
  const [appliedStatus, setAppliedStatus] = useState(statusFromUrl);

  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  // CRUD Data State
  const [tournaments, setTournaments] = useState<TournamentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [duplicatingTournament, setDuplicatingTournament] =
    useState<TournamentWithDetails | null>(null);
  const [managingCategoriesTournament, setManagingCategoriesTournament] =
    useState<TournamentWithDetails | null>(null);

  // Categories State inside Modal
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");

  const fetchTournaments = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    const brandToUse = selectedBrandId === "ALL"
      ? "seed-brand-general"
      : selectedBrandId;
    const res = await getTournamentsByBrandAction({
      brandId: brandToUse,
      search: appliedSearch,
      status: appliedStatus,
      page: currentPage,
      limit: 10,
    });
    if (res.success && res.data) {
      setTournaments(res.data.tournaments);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } else {
      setTournaments([]);
      setTotalPages(1);
      setTotalCount(0);
    }
    setIsLoading(false);
  };

  const fetchCategories = async (tournamentId: string) => {
    const res = await getCategoriesByTournamentAction(tournamentId);
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [selectedBrandId, currentPage, appliedSearch, appliedStatus]);

  const updateUrlParams = (
    newSearch: string,
    newStatus: string,
    newPage: number
  ) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
    params.set("page", String(newPage));
    router.push(`/dashboard/tournaments?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchInput);
    setAppliedStatus(statusInput);
    setCurrentPage(1);
    updateUrlParams(searchInput, statusInput, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(appliedSearch, appliedStatus, page);
  };

  const handleCloseFormModal = (openState: boolean) => {
    setIsCreateModalOpen(openState);
    if (!openState) {
      setEditingTournament(null);
    }
  };

  const handleFormSubmit = async (data: {
    title: string;
    tournamentDate: string;
    endDate?: string;
    feeAmount?: number;
    currency?: string;
    location?: string;
    city?: string;
    country?: string;
    googleMapsUrl?: string;
    description?: string;
  }) => {
    const brandToUse = selectedBrandId === "ALL"
      ? "seed-brand-general"
      : selectedBrandId;

    if (editingTournament) {
      const res = await updateTournamentAction(
        editingTournament.id,
        data.title,
        data.tournamentDate,
        data.description,
        data.location,
        data.city,
        data.country,
        data.googleMapsUrl,
        data.endDate,
        data.feeAmount,
        data.currency
      );
      if (res.success) {
        toast.success(t("tournamentsPage.tournamentUpdated", "Torneo actualizado."));
        setEditingTournament(null);
        setIsCreateModalOpen(false);
        fetchTournaments();
      } else {
        toast.error(res.error || "Error al actualizar.");
      }
    } else {
      const res = await createTournamentAction({
        brandId: brandToUse,
        title: data.title,
        tournamentDate: data.tournamentDate,
        endDate: data.endDate,
        feeAmount: data.feeAmount || 0,
        currency: data.currency || "MXN",
        location: data.location,
        city: data.city,
        country: data.country,
        googleMapsUrl: data.googleMapsUrl,
        description: data.description,
      });
      if (res.success && res.data) {
        toast.success(
          t("tournamentsPage.tournamentCreated", "Torneo creado correctamente.")
        );
        await createTournamentCategoryAction(
          res.data.id,
          "Categoría General",
          4,
          99,
          "MIXED"
        );
        setIsCreateModalOpen(false);
        fetchTournaments();
      } else {
        toast.error(res.error || "Error al crear torneo.");
      }
    }
  };

  const handleDeleteTournament = async () => {
    if (!deletingTournament) return;
    const res = await deleteTournamentAction(deletingTournament.id);
    if (res.success) {
      toast.success(t("tournamentsPage.tournamentDeleted", "Torneo eliminado."));
      setDeletingTournament(null);
      fetchTournaments();
    } else {
      toast.error(res.error || "Error al eliminar.");
    }
  };

  const handleDuplicateTournament = async () => {
    if (!duplicatingTournament) return;
    const res = await duplicateTournamentAction(duplicatingTournament.id);
    if (res.success) {
      toast.success(
        t("tournamentsPage.copySuccess", "Torneo duplicado exitosamente.")
      );
      setDuplicatingTournament(null);
      fetchTournaments();
    } else {
      toast.error(res.error || "Error al duplicar torneo.");
    }
  };

  const handleOpenCategoriesModal = (tournament: TournamentWithDetails) => {
    setManagingCategoriesTournament(tournament);
    fetchCategories(tournament.id);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCategoriesTournament || !newCatName.trim()) return;

    const res = await createTournamentCategoryAction(
      managingCategoriesTournament.id,
      newCatName
    );
    if (res.success) {
      setNewCatName("");
      fetchCategories(managingCategoriesTournament.id);
      fetchTournaments();
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!managingCategoriesTournament) return;
    const res = await deleteTournamentCategoryAction(catId);
    if (res.success) {
      fetchCategories(managingCategoriesTournament.id);
      fetchTournaments();
    }
  };

  const handleNavigateToDetail = (tournament: Tournament) => {
    router.push(`/dashboard/tournaments/${tournament.id}`);
  };

  // KPI Calculations
  const activeCount = tournaments.filter(
    (tItem) => tItem.status === "IN_PROGRESS"
  ).length;
  const totalParticipantsCount = tournaments.reduce(
    (acc, item) => acc + (item.participants?.length || 0),
    0
  );
  const totalCategoriesCount = tournaments.reduce(
    (acc, item) => acc + (item.categories?.length || 0),
    0
  );

  // Plan Entitlement Gating Guard
  if (!canAccessTournaments) {
    return (
      <div
        className={
          "p-8 max-w-4xl mx-auto text-center py-20 " +
          "bg-slate-900/60 border border-slate-800 " +
          "rounded-2xl my-10 shadow-xl"
        }
      >
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {t(
            "tournamentsPage.proRequiredTitle",
            "Módulo de Torneos Exclusivo Plan Pro"
          )}
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
          {getUpgradeMessage("Módulo de Torneos")}
        </p>
        <Link
          href="/dashboard/settings/billing"
          className={
            "inline-flex items-center gap-2 px-6 py-3 rounded-xl " +
            "font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 " +
            "transition-colors"
          }
        >
          {t("tournamentsPage.upgradePlanBtn", "Actualizar a Plan Pro")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
            {t("tournamentsPage.title", "Torneos Internos & Brackets")}
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            {t(
              "tournamentsPage.subtitle",
              "Gestiona competencias de dojo, convocatorias de combate/formas, " +
                "llaves de eliminación, pesaje y reconocimientos."
            )}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingTournament(null);
            setIsCreateModalOpen(true);
          }}
          className={
            "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold " +
            "rounded-xl shadow-xs text-xs cursor-pointer"
          }
        >
          <Plus className="h-4 w-4 mr-1 text-zinc-950" />
          {t("tournamentsPage.createButton", "Nuevo Torneo")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("tournamentsPage.kpiTotalTournaments", "Torneos Registrados")}
              </p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white font-mono mt-0.5">
                {totalCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Trophy className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("tournamentsPage.kpiActiveTournaments", "Torneos Activos")}
              </p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {activeCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Play className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t(
                  "tournamentsPage.kpiTotalParticipants",
                  "Competidores Inscritos"
                )}
              </p>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {totalParticipantsCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                {t("tournamentsPage.kpiTotalCategories", "Categorías Creadas")}
              </p>
              <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                {totalCategoriesCount}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar with Search, Status Select & View Switcher */}
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs rounded-2xl p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm h-10 flex items-center">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t(
                  "tournamentsPage.searchPlaceholder",
                  "Buscar torneo por nombre o lugar..."
                )}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={
                  "w-full h-10 pl-9 pr-3 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none focus:ring-2 " +
                  "focus:ring-amber-500 box-border"
                }
              />
            </div>

            <select
              value={statusInput}
              onChange={(e) => setStatusInput(e.target.value)}
              className={
                "h-10 px-3 text-xs border border-zinc-200 dark:border-zinc-700 " +
                "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                "focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer " +
                "box-border flex items-center"
              }
            >
              <option value="ALL">
                {t("tournamentsPage.allStatuses", "Todos los Estados")}
              </option>
              <option value="DRAFT">
                {t("tournamentsPage.statusDraft", "Borrador")}
              </option>
              <option value="OPEN">
                {t("tournamentsPage.statusOpen", "Abierto / Convocatoria")}
              </option>
              <option value="IN_PROGRESS">
                {t("tournamentsPage.statusInProgress", "En Ejecución")}
              </option>
              <option value="FINISHED">
                {t("tournamentsPage.statusFinished", "Finalizado")}
              </option>
              <option value="CANCELLED">
                {t("tournamentsPage.statusCancelled", "Cancelado")}
              </option>
            </select>

            <Button
              type="submit"
              className={
                "h-10 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold " +
                "rounded-xl text-xs px-4 cursor-pointer shrink-0 shadow-xs " +
                "flex items-center justify-center"
              }
            >
              <Search className="h-3.5 w-3.5 mr-1" /> {t("dojo.searchBtn", "Buscar")}
            </Button>
          </div>

          {/* Grid vs List View Switcher */}
          <div
            className={
              "flex items-center gap-1.5 self-end sm:self-auto bg-zinc-100 " +
              "dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700"
            }
          >
            <Button
              size="sm"
              type="button"
              variant={viewMode === "cards" ? "default" : "ghost"}
              onClick={() => setViewMode("cards")}
              className={`h-8 px-3 text-xs font-bold rounded-lg cursor-pointer ${
                viewMode === "cards"
                  ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              {t("tournamentsPage.viewCards", "Tarjetas")}
            </Button>

            <Button
              size="sm"
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setViewMode("list")}
              className={`h-8 px-3 text-xs font-bold rounded-lg cursor-pointer ${
                viewMode === "list"
                  ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              {t("tournamentsPage.viewList", "Lista")}
            </Button>
          </div>
        </form>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <Card
          className={
            "p-12 text-center text-zinc-400 border border-zinc-200 " +
            "dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl"
          }
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-3" />
          <p className="text-xs font-semibold">
            Cargando torneos desde el servidor...
          </p>
        </Card>
      ) : tournaments.length === 0 ? (
        <Card
          className={
            "p-12 text-center text-zinc-400 border border-zinc-200 " +
            "dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl space-y-3"
          }
        >
          <Trophy className="h-10 w-10 text-zinc-500 mx-auto" />
          <p className="text-sm font-bold text-zinc-900 dark:text-white">
            No se encontraron torneos registrados.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("tournamentsPage.createButton", "Nuevo Torneo")}
          </Button>
        </Card>
      ) : viewMode === "cards" ? (
        /* CARDS GRID VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((tItem) => {
              const dateDisplay = getTournamentDateDisplay(tItem.tournamentDate, tItem.endDate);
              const locationDisplay = getTournamentLocationDisplay(
                tItem.location,
                tItem.city,
                tItem.country
              );
              const isFinished = tItem.status === "FINISHED";
              const isInProgress = tItem.status === "IN_PROGRESS";

              return (
                <Card
                  key={tItem.id}
                  className={
                    "group relative border border-zinc-200 dark:border-zinc-800 " +
                    "bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all " +
                    "rounded-3xl overflow-hidden flex flex-col justify-between"
                  }
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                          {isFinished ? (
                            <Badge
                              className={
                                "bg-emerald-500/15 text-emerald-700 " +
                                "dark:text-emerald-300 border-emerald-500/30 " +
                                "text-[10px] font-extrabold uppercase"
                              }
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {t("tournamentsPage.statusFinished", "Finalizado")}
                            </Badge>
                          ) : isInProgress ? (
                            <Badge
                              className={
                                "bg-amber-500/15 text-amber-700 " +
                                "dark:text-amber-300 border-amber-500/30 " +
                                "text-[10px] font-extrabold uppercase"
                              }
                            >
                              ⚡ {t("tournamentsPage.statusInProgress", "En Ejecución")}
                            </Badge>
                          ) : (
                            <Badge
                              className={
                                "bg-indigo-500/15 text-indigo-700 " +
                                "dark:text-indigo-300 border-indigo-500/30 " +
                                "text-[10px] font-extrabold uppercase"
                              }
                            >
                              📅 {t("tournamentsPage.statusDraft", "Borrador")}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                          {tItem.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-indigo-500 cursor-pointer"
                          onClick={() => setDuplicatingTournament(tItem)}
                          title={t("tournamentsPage.duplicateButton", "Duplicar Torneo")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-amber-500 cursor-pointer"
                          onClick={() => {
                            setEditingTournament(tItem);
                            setIsCreateModalOpen(true);
                          }}
                          title="Editar Torneo"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-rose-500 cursor-pointer"
                          onClick={() => setDeletingTournament(tItem)}
                          title="Eliminar Torneo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px]">
                      {tItem.description || "Sin descripción adicional."}
                    </p>

                    <div
                      className={
                        "space-y-2 text-xs text-zinc-500 dark:text-zinc-400 " +
                        "border-t border-zinc-100 dark:border-zinc-800 pt-3"
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {dateDisplay}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        {tItem.googleMapsUrl ? (
                          <a
                            href={tItem.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={
                              "truncate hover:underline hover:text-amber-500 " +
                              "transition-colors text-zinc-700 dark:text-zinc-300 font-medium"
                            }
                            title={`Abrir en Google Maps: ${locationDisplay}`}
                          >
                            {locationDisplay}
                          </a>
                        ) : (
                          <span
                            className="truncate text-zinc-700 dark:text-zinc-300 font-medium"
                            title={locationDisplay}
                          >
                            {locationDisplay}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      "p-4 bg-zinc-50 dark:bg-zinc-800/40 border-t " +
                      "border-zinc-100 dark:border-zinc-800 space-y-3"
                    }
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-medium">
                        {tItem.categories?.length || 0}{" "}
                        {t("tournamentsPage.categoriesCount", "categorías")}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white font-mono">
                        {tItem.participants?.length || 0}{" "}
                        {t("tournamentsPage.participantsCount", "competidores")}
                      </span>
                    </div>

                    <div>
                      <Button
                        size="sm"
                        onClick={() => handleNavigateToDetail(tItem)}
                        className={
                          "w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 " +
                          "font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                        }
                      >
                        <Play className="h-3.5 w-3.5 mr-1 fill-zinc-950" />
                        {t("tournamentsPage.executeBtn", "Ejecutar")}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div
            className={
              "p-4 border border-zinc-200 dark:border-zinc-800 " +
              "bg-white dark:bg-zinc-900 rounded-3xl flex justify-center shadow-xs"
            }
          >
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <Card
          className={
            "border border-zinc-200 dark:border-zinc-800 bg-white " +
            "dark:bg-zinc-900 shadow-xs rounded-3xl overflow-hidden"
          }
        >
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableRow>
                <TableHead className="text-xs font-bold">TORNEO</TableHead>
                <TableHead className="text-xs font-bold">LUGAR / UBICACIÓN</TableHead>
                <TableHead className="text-xs font-bold">FECHA</TableHead>
                <TableHead className="text-xs font-bold">ESTADO</TableHead>
                <TableHead className="text-xs font-bold text-right">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tournaments.map((tItem) => {
                const dateDisplay = getTournamentDateDisplay(tItem.tournamentDate, tItem.endDate);
                const locationDisplay = getTournamentLocationDisplay(
                  tItem.location,
                  tItem.city,
                  tItem.country
                );
                const isFinished = tItem.status === "FINISHED";
                const isInProgress = tItem.status === "IN_PROGRESS";

                return (
                  <TableRow
                    key={tItem.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                  >
                    <TableCell className="py-3 font-bold text-xs text-zinc-900 dark:text-white">
                      <div>{tItem.title}</div>
                      <div className="text-[11px] font-normal text-zinc-500 truncate max-w-xs">
                        {tItem.description || "Sin descripción"}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        {tItem.googleMapsUrl ? (
                          <a
                            href={tItem.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={
                              "hover:underline hover:text-amber-500 transition-colors " +
                              "font-medium truncate max-w-xs"
                            }
                            title={`Abrir en Google Maps: ${locationDisplay}`}
                          >
                            {locationDisplay}
                          </a>
                        ) : (
                          <span className="font-medium truncate max-w-xs">{locationDisplay}</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 font-mono">
                      <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                        <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        {dateDisplay}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {isFinished ? (
                        <Badge
                          className={
                            "bg-emerald-500/15 text-emerald-700 " +
                            "dark:text-emerald-300 border-emerald-500/30 " +
                            "text-[10px] font-extrabold uppercase"
                          }
                        >
                          {t("tournamentsPage.statusFinished", "Finalizado")}
                        </Badge>
                      ) : isInProgress ? (
                        <Badge
                          className={
                            "bg-amber-500/15 text-amber-700 " +
                            "dark:text-amber-300 border-amber-500/30 " +
                            "text-[10px] font-extrabold uppercase"
                          }
                        >
                          {t("tournamentsPage.statusInProgress", "En Ejecución")}
                        </Badge>
                      ) : (
                        <Badge
                          className={
                            "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 " +
                            "dark:text-zinc-400 text-[10px] font-extrabold uppercase"
                          }
                        >
                          {t("tournamentsPage.statusDraft", "Borrador")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => handleNavigateToDetail(tItem)}
                          className={
                            "bg-amber-500 hover:bg-amber-600 text-zinc-950 " +
                            "font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                          }
                        >
                          <Play className="h-3.5 w-3.5 mr-1 fill-zinc-950" />
                          {t("tournamentsPage.executeBtn", "Ejecutar")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-indigo-500 cursor-pointer"
                          onClick={() => setDuplicatingTournament(tItem)}
                          title={t("tournamentsPage.duplicateButton", "Duplicar Torneo")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-amber-500 cursor-pointer"
                          onClick={() => {
                            setEditingTournament(tItem);
                            setIsCreateModalOpen(true);
                          }}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-rose-500 cursor-pointer"
                          onClick={() => setDeletingTournament(tItem)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </Card>
      )}

      {/* Create / Edit Form Dialog */}
      {isCreateModalOpen && (
        <TournamentFormDialog
          open={isCreateModalOpen}
          onOpenChange={handleCloseFormModal}
          editingTournament={editingTournament}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Categories Modal */}
      {managingCategoriesTournament && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={
              "bg-white dark:bg-zinc-900 border border-zinc-200 " +
              "dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            }
          >
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                Categorías: {managingCategoriesTournament.title}
              </h3>
              <button
                onClick={() => setManagingCategoriesTournament(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ej. Infantil (-35kg)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className={
                    "flex-1 bg-zinc-50 dark:bg-zinc-800 border " +
                    "border-zinc-200 dark:border-zinc-700 rounded-xl " +
                    "px-3.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  }
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    Sin categorías registradas en este torneo.
                  </p>
                ) : (
                  categories.map((c) => (
                    <div
                      key={c.id}
                      className={
                        "flex justify-between items-center p-3 bg-zinc-50 " +
                        "dark:bg-zinc-800/60 border border-zinc-200 " +
                        "dark:border-zinc-700/60 rounded-xl text-xs"
                      }
                    >
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {c.name}
                      </span>
                      <button
                        onClick={() => handleDeleteCategory(c.id)}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {duplicatingTournament && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={
              "bg-white dark:bg-zinc-900 border border-zinc-200 " +
              "dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            }
          >
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              {t(
                "tournamentsPage.duplicateConfirm",
                `¿Duplicar torneo "${duplicatingTournament.title}"?`
              )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t(
                "tournamentsPage.duplicateDesc",
                "Se creará una copia en borrador con las mismas categorías configuradas."
              )}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDuplicatingTournament(null)}
                className={
                  "px-4 py-2 text-xs font-semibold text-zinc-600 " +
                  "dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 " +
                  "rounded-xl cursor-pointer"
                }
              >
                {t("common.cancel", "Cancelar")}
              </button>
              <button
                onClick={handleDuplicateTournament}
                className={
                  "px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 " +
                  "text-zinc-950 rounded-xl cursor-pointer"
                }
              >
                {t("tournamentsPage.duplicateButton", "Duplicar Torneo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTournament && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={
              "bg-white dark:bg-zinc-900 border border-zinc-200 " +
              "dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            }
          >
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              {t("common.confirmDelete", "¿Eliminar torneo?")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Esta acción eliminará el torneo &quot;{deletingTournament.title}&quot; y todas sus
              categorías y participantes asociados.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingTournament(null)}
                className={
                  "px-4 py-2 text-xs font-semibold text-zinc-600 " +
                  "dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 " +
                  "rounded-xl cursor-pointer"
                }
              >
                {t("common.cancel", "Cancelar")}
              </button>
              <button
                onClick={handleDeleteTournament}
                className={
                  "px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 " +
                  "text-white rounded-xl cursor-pointer"
                }
              >
                {t("common.delete", "Eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-zinc-400">Cargando...</div>
      }
    >
      <TournamentsContent />
    </Suspense>
  );
}

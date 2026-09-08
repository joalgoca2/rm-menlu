"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Plus,
  MapPin,
  ArrowLeft,
  ChevronRight,
  Crown,
  AlertTriangle,
  X,
} from "lucide-react";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { TournamentListTable } from "@/components/tournaments/tournament-list-table";
import { TournamentFormDialog } from "@/components/tournaments/tournament-form-dialog";
import {
  getTournamentsByBrandAction,
  createTournamentAction,
  updateTournamentAction,
  deleteTournamentAction,
  createTournamentCategoryAction,
  getCategoriesByTournamentAction,
  deleteTournamentCategoryAction,
} from "@/actions/tournaments";
import type { Tournament, TournamentCategory } from "@/types";

interface StudentCheckin {
  id: string;
  name: string;
  beltName: string;
  category: string;
  isCheckedIn: boolean;
}

interface BracketMatch {
  id: string;
  roundName: string;
  roundIndex: number;
  matchIndex: number;
  redStudentId?: string;
  redName: string;
  redScore: number;
  blueStudentId?: string;
  blueName: string;
  blueScore: number;
  winnerStudentId?: string | null;
  winnerName?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

function TournamentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBrandId } = useBrand();
  const { t } = useTranslation();

  const searchFromUrl = searchParams.get("search") || "";
  const pageFromUrl = Number(searchParams.get("page")) || 1;

  const [search, setSearch] = useState(searchFromUrl);
  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, _setTotalPages] = useState(1);

  // View Mode: "list" | "execution"
  const [viewMode, setViewMode] = useState<"list" | "execution">("list");
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

  // CRUD Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [managingCategoriesTournament, setManagingCategoriesTournament] =
    useState<Tournament | null>(null);

  // Categories State inside Modal
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");

  // Execution Engine States
  const [executionStep, setExecutionStep] = useState<1 | 2 | 3>(1);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Sanda Infantil (-35kg)");
  const [students, setStudents] = useState<StudentCheckin[]>([
    { id: "st-1", name: "Carlos Mendoza", beltName: "Cinturón Amarillo", category: "Infantil", isCheckedIn: true },
    { id: "st-2", name: "Sofía Ramírez", beltName: "Cinturón Amarillo", category: "Infantil", isCheckedIn: true },
    { id: "st-3", name: "Mateo Torres", beltName: "Cinturón Amarillo", category: "Infantil", isCheckedIn: true },
    { id: "st-4", name: "Roberto Silva", beltName: "Cinturón Amarillo", category: "Infantil", isCheckedIn: true },
  ]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(1);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [champion, setChampion] = useState<string | null>(null);

  const fetchTournaments = async () => {
    if (!selectedBrandId) return;
    setIsLoading(true);
    const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;
    const res = await getTournamentsByBrandAction(brandToUse);
    if (res.success && res.data) {
      setTournaments(res.data);
    }
    setIsLoading(false);
  };

  const fetchCategories = async (tournamentId: string) => {
    const res = await getCategoriesByTournamentAction(tournamentId);
    if (res.success && res.data) {
      setCategories(res.data);
      if (res.data.length > 0) {
        setSelectedCategoryName(res.data[0].name);
      }
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [selectedBrandId]);

  const updateUrlParams = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    params.set("page", String(newPage));
    router.push(`/dashboard/tournaments?${params.toString()}`);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    updateUrlParams(val, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(search, page);
  };

  const handleFormSubmit = async (data: {
    title: string;
    tournamentDate: string;
    location?: string;
    description?: string;
  }) => {
    const brandToUse = selectedBrandId === "ALL" ? "seed-brand-general" : selectedBrandId;

    if (editingTournament) {
      const res = await updateTournamentAction(
        editingTournament.id,
        data.title,
        data.tournamentDate,
        data.description,
        data.location
      );
      if (res.success) {
        setEditingTournament(null);
        fetchTournaments();
      }
    } else {
      const res = await createTournamentAction({
        brandId: brandToUse,
        title: data.title,
        tournamentDate: data.tournamentDate,
        location: data.location,
        description: data.description,
      });
      if (res.success && res.data) {
        await createTournamentCategoryAction(res.data.id, "Sanda Infantil (-35kg)", 4, 12, "MIXED");
        setIsCreateModalOpen(false);
        fetchTournaments();
      }
    }
  };

  const handleDeleteTournament = async () => {
    if (!deletingTournament) return;
    const res = await deleteTournamentAction(deletingTournament.id);
    if (res.success) {
      setDeletingTournament(null);
      fetchTournaments();
    }
  };

  const handleOpenCategoriesModal = (tournament: Tournament) => {
    setManagingCategoriesTournament(tournament);
    fetchCategories(tournament.id);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCategoriesTournament || !newCatName.trim()) return;

    const res = await createTournamentCategoryAction(managingCategoriesTournament.id, newCatName);
    if (res.success) {
      setNewCatName("");
      fetchCategories(managingCategoriesTournament.id);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!managingCategoriesTournament) return;
    const res = await deleteTournamentCategoryAction(catId);
    if (res.success) {
      fetchCategories(managingCategoriesTournament.id);
    }
  };

  const handleStartExecution = (tournament: Tournament) => {
    setActiveTournament(tournament);
    fetchCategories(tournament.id);
    setViewMode("execution");
    setExecutionStep(1);
    setMatches([]);
    setChampion(null);
  };

  const toggleCheckin = (studentId: string) => {
    setStudents(
      students.map((s) =>
        s.id === studentId ? { ...s, isCheckedIn: !s.isCheckedIn } : s
      )
    );
  };

  const generateBrackets = () => {
    const checkedIn = students.filter((s) => s.isCheckedIn);
    if (checkedIn.length < 2) {
      alert("Se requieren al menos 2 peleadores presentes.");
      return;
    }

    const newMatches: BracketMatch[] = [];
    for (let i = 0; i < checkedIn.length; i += 2) {
      const red = checkedIn[i];
      const blue = checkedIn[i + 1];

      newMatches.push({
        id: `match-r1-${i}`,
        roundName: `Semifinales - Combate #${Math.floor(i / 2) + 1}`,
        roundIndex: 1,
        matchIndex: Math.floor(i / 2) + 1,
        redStudentId: red.id,
        redName: red.name,
        redScore: 0,
        blueStudentId: blue ? blue.id : undefined,
        blueName: blue ? blue.name : "BYE",
        blueScore: 0,
        winnerStudentId: blue ? null : red.id,
        winnerName: blue ? null : red.name,
        status: blue ? "PENDING" : "COMPLETED",
      });
    }

    setMatches(newMatches);
    setCurrentRoundIndex(1);
    setExecutionStep(2);
  };

  const handleDeclareWinner = (matchId: string, winnerSide: "red" | "blue") => {
    setMatches(
      matches.map((m) => {
        if (m.id !== matchId) return m;
        const winnerStudentId = winnerSide === "red" ? m.redStudentId : m.blueStudentId;
        const winnerName = winnerSide === "red" ? m.redName : m.blueName;
        return { ...m, winnerStudentId, winnerName, status: "COMPLETED" };
      })
    );
  };

  const handleAdvanceNextRound = () => {
    const currentRoundMatches = matches.filter((m) => m.roundIndex === currentRoundIndex);
    const uncompleted = currentRoundMatches.filter((m) => m.status !== "COMPLETED");

    if (uncompleted.length > 0) {
      alert("Debes definir el ganador de todos los combates de la ronda antes de avanzar.");
      return;
    }

    const winners = currentRoundMatches.map((m) => ({
      id: m.winnerStudentId || "",
      name: m.winnerName || "Ganador",
    }));

    if (winners.length === 1) {
      setChampion(winners[0].name);
      setExecutionStep(3);
      return;
    }

    // Generar combates de la siguiente ronda
    const nextRoundIndex = currentRoundIndex + 1;
    const isFinal = winners.length <= 2;
    const nextRoundMatches: BracketMatch[] = [];

    for (let i = 0; i < winners.length; i += 2) {
      const red = winners[i];
      const blue = winners[i + 1];

      nextRoundMatches.push({
        id: `match-r${nextRoundIndex}-${i}`,
        roundName: isFinal ? "GRAN FINAL 🥇" : `Ronda ${nextRoundIndex} - Combate #${Math.floor(i / 2) + 1}`,
        roundIndex: nextRoundIndex,
        matchIndex: Math.floor(i / 2) + 1,
        redStudentId: red.id,
        redName: red.name,
        redScore: 0,
        blueStudentId: blue ? blue.id : undefined,
        blueName: blue ? blue.name : "BYE",
        blueScore: 0,
        winnerStudentId: blue ? null : red.id,
        winnerName: blue ? null : red.name,
        status: blue ? "PENDING" : "COMPLETED",
      });
    }

    setMatches((prev) => [...prev, ...nextRoundMatches]);
    setCurrentRoundIndex(nextRoundIndex);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* VISTA 1: TABLA CRUD DE TORNEOS */}
      {viewMode === "list" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-7 w-7 text-amber-500" />
                {t("dojo.tournamentsTitle", "Gestión de Torneos Internos")}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Administra el catálogo de torneos, asigna categorías de combate y
                ejecuta las llaves.
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-2" /> Nuevo Torneo
            </Button>
          </div>

          <TournamentListTable
            tournaments={tournaments}
            isLoading={isLoading}
            search={search}
            onSearchChange={handleSearchChange}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onOpenEditModal={(t) => setEditingTournament(t)}
            onOpenDeleteModal={(t) => setDeletingTournament(t)}
            onOpenCategoriesModal={handleOpenCategoriesModal}
            onStartExecution={handleStartExecution}
          />
        </div>
      )}

      {/* VISTA 2: MODO EJECUCIÓN INTERACTIVO */}
      {viewMode === "execution" && activeTournament && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setViewMode("list")}
                className="rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver a la Lista
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-zinc-900 dark:text-white text-lg">{activeTournament.title}</h2>
                  {categories.length > 0 && (
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {selectedCategoryName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> {activeTournament.location || "Dojo Principal"}
                </p>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-3 gap-2 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-center">
            <button onClick={() => setExecutionStep(1)} className={`p-2 rounded-xl ${executionStep === 1 ? "bg-amber-500 text-white shadow-xs" : "text-zinc-400"}`}>
              1. Pase de Asistencia
            </button>
            <button onClick={() => setExecutionStep(2)} className={`p-2 rounded-xl ${executionStep === 2 ? "bg-amber-500 text-white shadow-xs" : "text-zinc-400"}`}>
              2. Combates Ronda {currentRoundIndex}
            </button>
            <button onClick={() => champion && setExecutionStep(3)} className={`p-2 rounded-xl ${executionStep === 3 ? "bg-amber-500 text-white shadow-xs" : "text-zinc-400"}`}>
              3. Podio 🥇
            </button>
          </div>

          {/* Paso 1: Asistencia */}
          {executionStep === 1 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-zinc-900 dark:text-white">Confirmación de Asistencia & Pesaje</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {students.map((st) => (
                  <label
                    key={st.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer ${
                      st.isCheckedIn
                        ? "border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={st.isCheckedIn}
                        onChange={() => toggleCheckin(st.id)}
                        className="h-4 w-4 accent-amber-500 rounded"
                      />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{st.name}</span>
                    </div>
                    <span className="text-xs font-bold">{st.isCheckedIn ? "PRESENTE" : "AUSENTE"}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={generateBrackets} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs">
                  🚀 Iniciar Combates
                </Button>
              </div>
            </div>
          )}

          {/* Paso 2: Combates */}
          {executionStep === 2 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Ronda {currentRoundIndex} de Combates</h3>
                <Button onClick={handleAdvanceNextRound} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs">
                  Avanzar de Ronda <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match) => {
                  const isRedWinner =
                    match.winnerStudentId === match.redStudentId &&
                    match.winnerStudentId !== null;
                  const isBlueWinner =
                    match.winnerStudentId === match.blueStudentId &&
                    match.winnerStudentId !== null;

                  return (
                    <div key={match.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/40">
                      <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>{match.roundName}</span>
                        <span className={match.status === "COMPLETED" ? "text-amber-500" : "text-emerald-500"}>
                          {match.status === "COMPLETED" ? "FINALIZADO" : "EN COMBATE"}
                        </span>
                      </div>

                      {/* Esquina Roja */}
                      <div className={`p-3 rounded-xl border flex justify-between items-center ${
                        isRedWinner ? "bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/50 font-bold" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      }`}>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">🔴 {match.redName}</span>
                        {!isRedWinner && (
                          <Button size="sm" onClick={() => handleDeclareWinner(match.id, "red")} className="bg-rose-600 text-white text-xs rounded-xl">
                            <Crown className="h-3.5 w-3.5 mr-1" /> Declarar Ganador 🔴
                          </Button>
                        )}
                      </div>

                      {/* Esquina Azul */}
                      <div className={`p-3 rounded-xl border flex justify-between items-center ${
                        isBlueWinner ? "bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/50 font-bold" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      }`}>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">🔵 {match.blueName}</span>
                        {!isBlueWinner && match.blueStudentId && (
                          <Button size="sm" onClick={() => handleDeclareWinner(match.id, "blue")} className="bg-blue-600 text-white text-xs rounded-xl">
                            <Crown className="h-3.5 w-3.5 mr-1" /> Declarar Ganador 🔵
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paso 3: Campeón */}
          {executionStep === 3 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-xl space-y-4">
              <div className="text-5xl">🥇</div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">¡Campeón: {champion}!</h3>
              <Button onClick={() => setViewMode("list")} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
                Volver a la Lista de Torneos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODALES FORMULARIO Y CATEGORÍAS */}
      <TournamentFormDialog
        isOpen={isCreateModalOpen || !!editingTournament}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTournament(null);
        }}
        tournamentToEdit={editingTournament}
        onSubmit={handleFormSubmit}
      />

      {/* Modal Categorías */}
      {managingCategoriesTournament && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Categorías del Torneo</h3>
                <p className="text-xs text-zinc-500">{managingCategoriesTournament.title}</p>
              </div>
              <button onClick={() => setManagingCategoriesTournament(null)} className="text-zinc-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                placeholder="ej. Sanda Infantil (-35kg)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold">
                <Plus className="h-4 w-4 mr-1" /> Añadir Categoría
              </Button>
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/40">
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-rose-500 text-xs hover:underline font-semibold">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar Torneo */}
      {deletingTournament && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="h-7 w-7 shrink-0" />
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">¿Eliminar Torneo?</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Estás a punto de eliminar el torneo <strong className="text-zinc-900 dark:text-white">"{deletingTournament.title}"</strong> de la base de datos.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeletingTournament(null)} className="rounded-xl">
                Cancelar
              </Button>
              <Button onClick={handleDeleteTournament} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-zinc-500">Cargando módulo de torneos...</div>}>
      <TournamentsContent />
    </Suspense>
  );
}

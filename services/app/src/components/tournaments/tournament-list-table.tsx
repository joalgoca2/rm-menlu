"use client";

import React from "react";
import {
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Play,
  Layers,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationControl } from "@/components/ui/pagination-control";
import type { Tournament } from "@/types";

interface TournamentListTableProps {
  tournaments: Tournament[];
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (tournament: Tournament) => void;
  onOpenDeleteModal: (tournament: Tournament) => void;
  onOpenCategoriesModal: (tournament: Tournament) => void;
  onStartExecution: (tournament: Tournament) => void;
}

export function TournamentListTable({
  tournaments,
  isLoading,
  search,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onOpenCategoriesModal,
  onStartExecution,
}: TournamentListTableProps) {
  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2.5 w-full sm:w-96 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre de torneo o lugar..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-400 font-medium"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4 font-semibold text-xs">Nombre del Torneo</th>
                <th className="p-4 font-semibold text-xs">Lugar / Ubicación</th>
                <th className="p-4 font-semibold text-xs">Fecha Programada</th>
                <th className="p-4 font-semibold text-xs">Estado</th>
                <th className="p-4 font-semibold text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 text-xs font-medium">
                    Cargando torneos...
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500 text-xs font-medium space-y-2">
                    <p>No hay torneos registrados en el alcance actual.</p>
                    <Button
                      size="sm"
                      onClick={onOpenCreateModal}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                    >
                      Crear Primer Torneo
                    </Button>
                  </td>
                </tr>
              ) : (
                tournaments.map((tournament) => {
                  const dateStr = typeof tournament.tournamentDate === "string"
                    ? tournament.tournamentDate.split("T")[0]
                    : new Date(tournament.tournamentDate).toISOString().split("T")[0];

                  return (
                    <tr
                      key={tournament.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-zinc-900 dark:text-white text-sm">{tournament.title}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-xs">{tournament.description || "Sin descripción"}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                          {tournament.location || "Dojo Principal"}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            tournament.status === "FINISHED"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : tournament.status === "IN_PROGRESS"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          {tournament.status === "FINISHED"
                            ? "FINALIZADO"
                            : tournament.status === "IN_PROGRESS"
                            ? "EN EJECUCIÓN"
                            : "BORRADOR"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenCategoriesModal(tournament)}
                            className="rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          >
                            <Layers className="h-3.5 w-3.5 mr-1" /> Categorías
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => onStartExecution(tournament)}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs"
                          >
                            <Play className="h-3.5 w-3.5 mr-1 fill-white" /> Ejecutar
                          </Button>
                          <button
                            onClick={() => onOpenEditModal(tournament)}
                            className="p-1.5 text-zinc-400 hover:text-amber-500 rounded-lg transition-colors"
                            title="Editar torneo"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenDeleteModal(tournament)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors"
                            title="Eliminar torneo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Obligatoria */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}

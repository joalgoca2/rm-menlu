"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/types";

interface TournamentFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentToEdit?: Tournament | null;
  onSubmit: (data: {
    title: string;
    tournamentDate: string;
    location?: string;
    description?: string;
  }) => Promise<void>;
}

export function TournamentFormDialog({
  isOpen,
  onClose,
  tournamentToEdit,
  onSubmit,
}: TournamentFormDialogProps) {
  const [title, setTitle] = useState("");
  const [tournamentDate, setTournamentDate] = useState("2026-11-20");
  const [location, setLocation] = useState("Dojo Central - Tatami Principal");
  const [description, setDescription] = useState("Campeonato oficial del dojo.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tournamentToEdit) {
      setTitle(tournamentToEdit.title);
      const dateStr = typeof (tournamentToEdit.tournamentDate as unknown) === "string"
        ? String(tournamentToEdit.tournamentDate).split("T")[0]
        : new Date(tournamentToEdit.tournamentDate).toISOString().split("T")[0];
      setTournamentDate(dateStr);
      setLocation(tournamentToEdit.location || "Dojo Central - Tatami Principal");
      setDescription(tournamentToEdit.description || "Campeonato oficial del dojo.");
    } else {
      setTitle("");
      setTournamentDate("2026-11-20");
      setLocation("Dojo Central - Tatami Principal");
      setDescription("Campeonato oficial del dojo.");
    }
  }, [tournamentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      tournamentDate,
      location: location.trim(),
      description: description.trim(),
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
            {tournamentToEdit ? "Editar Torneo" : "Crear Nuevo Torneo"}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 font-semibold block">Nombre del Torneo</label>
            <input
              type="text"
              placeholder="ej. Campeonato de Otoño 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold block">Lugar / Ubicación / Tatami</label>
            <input
              type="text"
              placeholder="ej. Dojo Central - Tatami Principal"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold block">Fecha Programada</label>
            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold block">Descripción / Reglamento</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-semibold">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              {isSubmitting ? "Guardando..." : tournamentToEdit ? "Guardar Cambios" : "Crear Torneo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

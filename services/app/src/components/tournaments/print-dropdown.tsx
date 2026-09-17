"use client";

import React, { useState, useEffect, useRef } from "react";
import { Printer, Award, ChevronDown, Users, FileText } from "lucide-react";
import { printCredentialsView } from "./print-credentials-button";
import type { TournamentParticipant } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PrintDropdownProps {
  tournamentId: string;
  tournamentTitle: string;
  tournamentDate?: Date | string;
  tournamentLocation?: string | null;
  tournamentCity?: string | null;
  participants: TournamentParticipant[];
  onPrintDiplomas?: (type: "PARTICIPATION" | "PODIUM") => void;
}

export function PrintDropdown({
  tournamentId,
  tournamentTitle,
  tournamentDate,
  tournamentLocation,
  tournamentCity,
  participants,
  onPrintDiplomas,
}: PrintDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePrintAllCredentials = () => {
    setIsOpen(false);
    if (participants.length === 0) {
      toast.error("No hay participantes registrados para imprimir credenciales.");
      return;
    }
    printCredentialsView({
      tournamentTitle,
      tournamentDate,
      location: tournamentLocation,
      city: tournamentCity,
      participants,
    });
  };

  const handlePrintParticipantList = () => {
    setIsOpen(false);
    if (participants.length === 0) {
      toast.error("No hay participantes registrados.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite ventanas emergentes.");
      return;
    }

    const rowsHtml = participants
      .map(
        (p, idx) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${p.firstName} ${p.lastName || ""}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;">${p.dojoName || "Dojo Principal"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;">${p.category?.name || "General"}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;">${p.actualWeightKg || p.weightKg || "N/A"} kg</td>
          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">${p.isCheckedIn ? "PRESENTE" : "PENDIENTE"}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Participantes - ${tournamentTitle}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; color: #09090b; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { font-size: 12px; color: #71717a; margin-top: 0; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 8px; background: #f4f4f5; border-bottom: 2px solid #e4e4e7; font-size: 11px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>${tournamentTitle}</h1>
          <p>Lista Oficial de Competidores (${participants.length} registrados)</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre del Competidor</th>
                <th>Dojo / Escuela</th>
                <th>Categoría</th>
                <th>Peso</th>
                <th>Estado Presencial</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 px-4 rounded-xl font-bold text-xs shadow-xs",
          "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800",
          "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80",
          "transition-all flex items-center justify-center gap-2 cursor-pointer"
        )}
        title="Opciones de Impresión"
        type="button"
      >
        <Printer className="h-4 w-4 text-amber-500 shrink-0" />
        <span>Imprimir</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-64 rounded-2xl",
            "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
            "text-zinc-900 dark:text-white p-1.5 shadow-xl z-[100] backdrop-blur-xl",
            "animate-in fade-in slide-in-from-top-1 duration-100"
          )}
        >
          <div className="flex flex-col space-y-1">
            {/* Option 1: Print Credentials (6 per page) */}
            <button
              onClick={handlePrintAllCredentials}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Imprimir Credenciales (6 x Pág)</span>
            </button>

            {/* Option 2: Print Diplomas */}
            {onPrintDiplomas && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onPrintDiplomas("PARTICIPATION");
                }}
                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Imprimir Diplomas</span>
              </button>
            )}

            {/* Option 3: Print Table List */}
            <button
              onClick={handlePrintParticipantList}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
              <span>Imprimir Lista de Participantes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

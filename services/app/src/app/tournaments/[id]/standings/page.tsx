"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Printer,
  Calendar,
  MapPin,
  Globe,
  Swords,
  ChevronLeft,
  Users,
  History,
} from "lucide-react";
import {
  getTournamentByIdAction,
  getTournamentParticipantsAction,
} from "@/actions/tournaments";
import type {
  Tournament,
  TournamentParticipant,
  TournamentCategory,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

export default function PublicTournamentStandingsPage() {
  const params = useParams();
  const id = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [categories, setCategories] = useState<TournamentCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchStandingsData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        getTournamentByIdAction(id),
        getTournamentParticipantsAction(id),
      ]);

      if (tRes.success && tRes.data) {
        setTournament(tRes.data);
        setCategories(tRes.data.categories || []);
      }
      if (pRes.success && pRes.data) {
        setParticipants(pRes.data);
      }
    } catch {
      toast.error("Error al cargar resultados del torneo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStandingsData();
  }, [fetchStandingsData]);

  const filteredParticipants = participants.filter((p) => {
    if (selectedCategoryId === "ALL") return true;
    return p.categoryId === selectedCategoryId;
  });

  const formatDateStr = (dateVal?: Date | string | null) => {
    if (!dateVal) return "";
    const str = typeof dateVal === "string" ? dateVal : dateVal.toISOString();
    return str.split("T")[0];
  };

  const startDateStr = formatDateStr(tournament?.tournamentDate);
  const endDateStr = formatDateStr(tournament?.endDate);
  const dateDisplay =
    endDateStr && endDateStr !== startDateStr
      ? `${startDateStr} — ${endDateStr}`
      : startDateStr || "Fecha por confirmar";

  const locationDisplay =
    [tournament?.location, tournament?.city, tournament?.country]
      .filter(Boolean)
      .join(", ") || "Sede Principal del Dojo";

  const cityCountry = [tournament?.city, tournament?.country]
    .filter(Boolean)
    .join(", ");

  const handlePrintStandings = () => {
    if (!tournament) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor permite las ventanas emergentes para imprimir.");
      return;
    }

    const activeCategoryName =
      selectedCategoryId === "ALL"
        ? "Todas las Categorías"
        : categories.find((c) => c.id === selectedCategoryId)?.name || "Categoría";

    const rowsHtml = filteredParticipants
      .map((p, idx) => {
        const pos = idx + 1;
        const awardText =
          p.awardRank === "GOLD" || pos === 1
            ? "🥇 Medalla de Oro"
            : p.awardRank === "SILVER" || pos === 2
            ? "🥈 Medalla de Plata"
            : p.awardRank === "BRONZE" || pos === 3
            ? "🥉 Medalla de Bronce"
            : "🏅 Participante";

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: 900;">${pos}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">
              <div>${p.firstName} ${p.lastName || ""}</div>
              <div style="font-size: 10px; color: #71717a; font-family: monospace;">${p.beltName || "Cinturón Blanco"}</div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${p.dojoName || "Menlu Dojo"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7;">${p.category?.name || "General"}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: center; font-weight: bold;">${awardText}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e4e4e7; text-align: center;">${p.isCheckedIn ? "Presente" : "Pendiente"}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resultados - ${tournament.title}</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 25px; color: #09090b; background: white; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e4e4e7; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { font-size: 20px; margin: 0; font-weight: 900; color: #09090b; }
            p { font-size: 12px; color: #52525b; margin: 4px 0 0 0; }
            .meta { font-size: 11px; color: #71717a; margin-bottom: 20px; font-family: monospace; background: #f4f4f5; padding: 10px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 10px; background: #f4f4f5; border-bottom: 2px solid #d4d4d8; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #52525b; }
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${tournament.title}</h1>
              <p>Tabla Oficial de Posiciones y Clasificación en Vivo</p>
            </div>
            <div style="font-size: 12px; font-weight: 900; color: #d97706;">MENLU 门路</div>
          </div>

          <div class="meta">
            <span>Filtro: <strong>${activeCategoryName}</strong></span> | 
            <span>Fecha: <strong>${dateDisplay}</strong></span> | 
            <span>Sede: <strong>${locationDisplay}</strong></span> | 
            <span>Competidores: <strong>${filteredParticipants.length}</strong></span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center;">POS</th>
                <th>COMPETIDOR / JUGADOR</th>
                <th>DOJO / ESCUELA</th>
                <th>CATEGORÍA</th>
                <th style="text-align: center;">RECONOCIMIENTO</th>
                <th style="text-align: center;">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-400">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase">
          Cargando tabla de clasificación en vivo...
        </p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
        <Trophy className="h-12 w-12 text-zinc-400 mb-3" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Torneo no encontrado
        </h2>
        <p className="text-xs mt-1 text-zinc-500">
          El enlace al torneo no existe o el evento ha sido modificado.
        </p>
        <Link
          href="/"
          className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs shadow-xs"
        >
          Ir a Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-white transition-colors duration-300 flex flex-col justify-between">
      {/* Background glow highlights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 dark:bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Hero Header Section */}
      <header className="relative border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Top Bar: Navigation Back & Light/Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group"
            >
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">
                CERRAR CLASIFICACIÓN
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Tournament Header Meta Box */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Brand Logo or Fallback Badge */}
                {tournament.brand?.logoUrl ? (
                  <div className="h-20 w-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-1.5 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tournament.brand.logoUrl}
                      alt={tournament.brand.name || tournament.title}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
                    <Swords className="h-8 w-8 text-zinc-950" />
                  </div>
                )}

                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-none text-zinc-900 dark:text-white">
                    {tournament.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-xs">
                    {cityCountry && (
                      <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {cityCountry}
                      </span>
                    )}
                    {cityCountry && (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    )}
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-bold uppercase tracking-wider">
                        {dateDisplay}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Google Maps Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {tournament.location && (
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-100 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span>{locationDisplay}</span>
                  </div>
                )}

                {tournament.googleMapsUrl && (
                  <a
                    href={tournament.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs font-bold"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Ver en Google Maps</span>
                  </a>
                )}
              </div>
            </div>

            {/* Right Summary Stats Box (Chesscoach Style) */}
            <div className="bg-white border-zinc-200 dark:bg-zinc-900/90 dark:border-zinc-800 p-4 rounded-3xl border flex items-center gap-6 shadow-xl dark:shadow-2xl shrink-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="text-center px-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Categorías
                </p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">
                  {categories.length}
                </p>
              </div>

              <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

              <div className="text-center px-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Estado
                </p>
                {tournament.status === "FINISHED" ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-extrabold uppercase">
                    ✓ FINALIZADO
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-extrabold uppercase animate-pulse">
                    ⚡ EN VIVO
                  </Badge>
                )}
              </div>

              <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

              <div className="text-center px-2">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                  Exportar
                </p>
                <Button
                  onClick={handlePrintStandings}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-800 hover:bg-amber-500/10 hover:text-amber-500 h-8 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Imprimir PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Section Heading & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              Tabla de Clasificación
            </h2>
          </div>

          {categories.length > 0 && (
            <div className="bg-white border-zinc-200 dark:bg-zinc-900/60 dark:border-zinc-800 border p-1 rounded-2xl flex items-center gap-1 overflow-x-auto max-w-full">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryId === "ALL"
                    ? "bg-amber-500 text-zinc-950 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Todas las Categorías ({participants.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategoryId === cat.id
                      ? "bg-amber-500 text-zinc-950 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Standings Table Card */}
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden backdrop-blur-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4 w-16 text-center">POS</th>
                  <th className="p-4">COMPETIDOR / JUGADOR</th>
                  <th className="p-4">DOJO / ESCUELA</th>
                  <th className="p-4">CATEGORÍA</th>
                  <th className="p-4 text-center">RECONOCIMIENTO</th>
                  <th className="p-4 text-center">ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-12 text-center text-zinc-400 font-medium"
                    >
                      No se encontraron competidores en la categoría seleccionada.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p, idx) => {
                    const pos = idx + 1;
                    const isGold = p.awardRank === "GOLD" || pos === 1;
                    const isSilver = p.awardRank === "SILVER" || pos === 2;
                    const isBronze = p.awardRank === "BRONZE" || pos === 3;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                      >
                        <td className="p-4 text-center">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto text-xs font-black transition-transform group-hover:scale-110 ${
                              isGold
                                ? "bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                                : isSilver
                                ? "bg-zinc-300 text-zinc-950 shadow-[0_0_15px_rgba(203,213,225,0.5)]"
                                : isBronze
                                ? "bg-amber-700 text-white shadow-[0_0_15px_rgba(180,83,9,0.5)]"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {pos}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span
                              className={`font-bold transition-colors ${
                                pos <= 3
                                  ? "text-zinc-900 dark:text-white text-sm"
                                  : "text-zinc-700 dark:text-zinc-300 text-xs"
                              }`}
                            >
                              {p.firstName} {p.lastName || ""}
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                              {p.beltName || "Cinturón Blanco"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-400">
                          {p.dojoName || "Menlu Dojo"}
                        </td>
                        <td className="p-4 font-semibold text-zinc-600 dark:text-zinc-400">
                          {p.category?.name || "General"}
                        </td>
                        <td className="p-4 text-center">
                          {isGold ? (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[10px] font-extrabold">
                              🥇 Medalla de Oro
                            </Badge>
                          ) : isSilver ? (
                            <Badge className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 text-[10px] font-extrabold">
                              🥈 Medalla de Plata
                            </Badge>
                          ) : isBronze ? (
                            <Badge className="bg-amber-800/20 text-amber-800 dark:text-amber-400 border-amber-800/40 text-[10px] font-extrabold">
                              🥉 Medalla de Bronce
                            </Badge>
                          ) : (
                            <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold">
                              🏅 Participante
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {p.isCheckedIn ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              Presente
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar inside Card */}
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <History className="h-3.5 w-3.5 text-amber-500" />
              Resultados Sincronizados en Tiempo Real
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-zinc-600 dark:text-zinc-400">ORO</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">PLATA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-700" />
                <span className="text-zinc-600 dark:text-zinc-400">BRONCE</span>
              </div>
            </div>
          </div>
        </Card>
      </main>

      {/* Standalone Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase text-[11px]">
            Menlu 门路 • Plataforma de Gestión de Torneos y Artes Marciales
          </p>
          <p className="text-[10px] text-zinc-400 font-mono">
            Sistema de Clasificación Oficial y Resultados en Vivo
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { updateTournamentAction } from "@/actions/tournaments";
import type { Tournament } from "@/types";
import {
  Settings,
  Save,
  Calendar,
  MapPin,
  Globe,
  FileText,
  Activity,
  Loader2,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface TournamentSettingsTabProps {
  tournament: Tournament;
  onRefresh: () => void;
}

export function TournamentSettingsTab({
  tournament,
  onRefresh,
}: TournamentSettingsTabProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states initialized with current tournament values
  const [title, setTitle] = useState(tournament.title || "");
  const [tournamentDate, setTournamentDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [feeAmount, setFeeAmount] = useState<number | "">(tournament.feeAmount || 0);
  const [currency, setCurrency] = useState(tournament.currency || "MXN");
  const [location, setLocation] = useState(tournament.location || "");
  const [city, setCity] = useState(tournament.city || "");
  const [country, setCountry] = useState(tournament.country || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(tournament.googleMapsUrl || "");
  const [description, setDescription] = useState(tournament.description || "");

  const formatForInput = (dateVal?: Date | string | null) => {
    if (!dateVal) return "";
    const str = typeof dateVal === "string" ? dateVal : dateVal.toISOString();
    return str.split("T")[0];
  };

  useEffect(() => {
    if (tournament) {
      setTitle(tournament.title || "");
      setTournamentDate(formatForInput(tournament.tournamentDate));
      setEndDate(formatForInput(tournament.endDate));
      setFeeAmount(tournament.feeAmount || 0);
      setCurrency(tournament.currency || "MXN");
      setLocation(tournament.location || "");
      setCity(tournament.city || "");
      setCountry(tournament.country || "");
      setGoogleMapsUrl(tournament.googleMapsUrl || "");
      setDescription(tournament.description || "");
    }
  }, [tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !tournamentDate) {
      toast.error(
        t("tournamentsPage.requiredFields", "Título y fecha de inicio son requeridos.")
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateTournamentAction(
        tournament.id,
        title,
        tournamentDate,
        description,
        location,
        city,
        country,
        googleMapsUrl,
        endDate,
        typeof feeAmount === "number" ? feeAmount : 0,
        currency
      );

      if (res.success) {
        toast.success(
          t("tournamentsPage.tournamentUpdated", "Datos del torneo actualizados correctamente.")
        );
        onRefresh();
      } else {
        toast.error(res.error || "Error al actualizar torneo.");
      }
    } catch {
      toast.error("Error inesperado en servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <Settings className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {t("tournamentsPage.editGeneralTitle", "Configuración General y Ubicación")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Actualiza el nombre, fechas del evento, sede, ciudad y mapa del torneo.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Title */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {t("tournamentsPage.titleLabel", "Nombre del Torneo")} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Campeonato Anual de Artes Marciales 2026"
              className={
                "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                "focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              }
              required
            />
          </div>

          {/* Row 2: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                {t("tournamentsPage.startDateLabel", "Fecha de Inicio")} *
              </label>
              <input
                type="date"
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                {t("tournamentsPage.endDateLabel", "Fecha Fin (Opcional)")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                }
              />
            </div>
          </div>

          {/* Row 2.5: Costo y Moneda del Torneo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                {t("tournamentsPage.feeAmountLabel", "Costo / Cuota de Inscripción del Torneo")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={feeAmount}
                onChange={(e) =>
                  setFeeAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="0.00"
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t("tournamentsPage.currencyLabel", "Moneda")}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                }
              >
                <option value="MXN">MXN ($ - Peso Mexicano)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="COP">COP ($ - Peso Colombiano)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="BRL">BRL (R$ - Real Brasileño)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Venue, City, Country */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                {t("tournamentsPage.locationLabel", "Sede / Instalaciones")}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Gimnasio Nuevo León"
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t("tournamentsPage.cityLabel", "Ciudad")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Monterrey"
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                {t("tournamentsPage.countryLabel", "País")}
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. México"
                className={
                  "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                  "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                  "focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                }
              />
            </div>
          </div>

          {/* Row 4: Google Maps URL */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-sky-500" />
              {t("tournamentsPage.googleMapsUrlLabel", "Enlace Google Maps (URL)")}
            </label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className={
                "w-full h-10 px-3.5 text-xs border border-zinc-200 dark:border-zinc-700 " +
                "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                "focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              }
            />
          </div>

          {/* Row 5: Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              {t("tournamentsPage.descriptionLabel", "Descripción del Torneo")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Escribe detalles adicionales sobre la competencia..."
              className={
                "w-full p-3 text-xs border border-zinc-200 dark:border-zinc-700 " +
                "rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white " +
                "focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium resize-none"
              }
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold " +
                "rounded-xl text-xs px-6 h-10 cursor-pointer shadow-xs"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

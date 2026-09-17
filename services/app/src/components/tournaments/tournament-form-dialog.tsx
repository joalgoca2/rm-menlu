"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, Calendar, MapPin, Globe, DollarSign } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import type { Tournament } from "@/types";

interface TournamentFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  editingTournament?: Tournament | null;
  tournamentToEdit?: Tournament | null;
  onSubmit: (data: {
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
  }) => Promise<void>;
}

export function TournamentFormDialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  editingTournament,
  tournamentToEdit,
  onSubmit,
}: TournamentFormDialogProps) {
  const { t } = useTranslation();
  const isDialogOpen = open !== undefined ? open : Boolean(isOpen);
  const targetTournament = editingTournament || tournamentToEdit;

  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const formatForDateTimeLocal = (
    dateVal: Date | string | null | undefined
  ): string => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getDefaultStartDate = () => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return formatForDateTimeLocal(d);
  };

  const [title, setTitle] = useState("");
  const [tournamentDate, setTournamentDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState("");
  const [feeAmount, setFeeAmount] = useState<number | "">(0);
  const [currency, setCurrency] = useState("MXN");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetTournament) {
      setTitle(targetTournament.title || "");
      setTournamentDate(formatForDateTimeLocal(targetTournament.tournamentDate));
      setEndDate(formatForDateTimeLocal(targetTournament.endDate));
      setFeeAmount(targetTournament.feeAmount || 0);
      setCurrency(targetTournament.currency || "MXN");
      setLocation(targetTournament.location || "");
      setCity(targetTournament.city || "");
      setCountry(targetTournament.country || "");
      setGoogleMapsUrl(targetTournament.googleMapsUrl || "");
      setDescription(targetTournament.description || "");
    } else {
      setTitle("");
      setTournamentDate(getDefaultStartDate());
      setEndDate("");
      setFeeAmount(0);
      setCurrency("MXN");
      setLocation("");
      setCity("");
      setCountry("");
      setGoogleMapsUrl("");
      setDescription("");
    }
  }, [targetTournament, isDialogOpen]);

  if (!isDialogOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tournamentDate) return;

    setIsSubmitting(true);
    await onSubmit({
      title: title.trim(),
      tournamentDate,
      endDate: endDate || undefined,
      feeAmount: typeof feeAmount === "number" ? feeAmount : 0,
      currency: currency.trim() || "MXN",
      location: location.trim() || undefined,
      city: city.trim() || undefined,
      country: country.trim() || undefined,
      googleMapsUrl: googleMapsUrl.trim() || undefined,
      description: description.trim() || undefined,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={
          "bg-white dark:bg-zinc-900 border border-zinc-200 " +
          "dark:border-zinc-800 rounded-3xl p-6 max-w-xl w-full " +
          "shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar sidebar-scroll"
        }
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h3 className="font-extrabold text-base text-zinc-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            {targetTournament
              ? t("tournamentsPage.editModalTitle", "Editar Torneo")
              : t("tournamentsPage.createModalTitle", "Crear Nuevo Torneo")}
          </h3>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nombre del Torneo */}
          <div>
            <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold block mb-1 uppercase tracking-wider">
              {t("tournamentsPage.tournamentNameLabel", "Nombre del Torneo")} *
            </label>
            <input
              type="text"
              required
              placeholder={t(
                "tournamentsPage.tournamentNamePlaceholder",
                "ej. Campeonato de Otoño 2026"
              )}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={
                "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                "text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              }
            />
          </div>

          {/* Row 2: Fecha Inicio & Fecha Fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold " +
                  "block mb-1 uppercase tracking-wider flex items-center gap-1.5"
                }
              >
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                {t("tournamentsPage.startDateLabel", "Fecha y Hora de Inicio")} *
              </label>
              <input
                type="datetime-local"
                required
                value={tournamentDate}
                onChange={(e) => setTournamentDate(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500"
                }
              />
            </div>

            <div>
              <label
                className={
                  "text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold " +
                  "block mb-1 uppercase tracking-wider flex items-center gap-1.5"
                }
              >
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                {t("tournamentsPage.endDateLabel", "Fecha Fin (Opcional)")}
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500"
                }
              />
            </div>
          </div>

          {/* Row 2.5: Costo de Inscripción y Moneda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                className={
                  "text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold " +
                  "block mb-1 uppercase tracking-wider flex items-center gap-1.5"
                }
              >
                <DollarSign className="h-3.5 w-3.5 text-amber-500" />
                {t("tournamentsPage.feeAmountLabel", "Costo / Cuota de Inscripción")}
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
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                }
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold block mb-1 uppercase tracking-wider">
                {t("tournamentsPage.currencyLabel", "Moneda")}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500 font-bold"
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

          {/* Row 3: Lugar / Sede | Ciudad | País */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                className={
                  "text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold " +
                  "block mb-1 uppercase tracking-wider flex items-center gap-1.5"
                }
              >
                <MapPin className="h-3.5 w-3.5 text-amber-500" />
                {t("tournamentsPage.venueLabel", "Lugar / Sede")}
              </label>
              <input
                type="text"
                placeholder={t(
                  "tournamentsPage.venuePlaceholder",
                  "Ej. Club de Ajedrez / Dojo Central"
                )}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500"
                }
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold block mb-1 uppercase tracking-wider">
                {t("tournamentsPage.cityLabel", "Ciudad")}
              </label>
              <input
                type="text"
                placeholder={t("tournamentsPage.cityPlaceholder", "Ej. Madrid")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500"
                }
              />
            </div>

            <div>
              <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold block mb-1 uppercase tracking-wider">
                {t("tournamentsPage.countryLabel", "País")}
              </label>
              <input
                type="text"
                placeholder={t("tournamentsPage.countryPlaceholder", "Ej. España")}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={
                  "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                  "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                  "text-zinc-900 dark:text-white focus:outline-none " +
                  "focus:ring-2 focus:ring-amber-500"
                }
              />
            </div>
          </div>

          {/* Row 4: Ubicación en Google Maps (URL) */}
          <div>
            <label
              className={
                "text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold " +
                "block mb-1 uppercase tracking-wider flex items-center gap-1.5"
              }
            >
              <Globe className="h-3.5 w-3.5 text-indigo-500" />
              {t(
                "tournamentsPage.googleMapsUrlLabel",
                "Ubicación en Google Maps (URL)"
              )}
            </label>
            <input
              type="url"
              placeholder={t(
                "tournamentsPage.googleMapsUrlPlaceholder",
                "https://maps.google.com/..."
              )}
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className={
                "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                "text-zinc-900 dark:text-white focus:outline-none " +
                "focus:ring-2 focus:ring-amber-500"
              }
            />
          </div>

          {/* Row 5: Descripción / Reglamento */}
          <div>
            <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-extrabold block mb-1 uppercase tracking-wider">
              {t("tournamentsPage.descriptionLabel", "Descripción / Reglamento")}
            </label>
            <textarea
              rows={3}
              placeholder={t(
                "tournamentsPage.descriptionPlaceholder",
                "ej. Reglamento oficial del dojo y observaciones..."
              )}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={
                "w-full px-3.5 py-2.5 text-xs border border-zinc-200 " +
                "dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-800 " +
                "text-zinc-900 dark:text-white focus:outline-none " +
                "focus:ring-2 focus:ring-amber-500"
              }
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={
                "bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl " +
                "text-xs font-bold cursor-pointer shadow-xs"
              }
            >
              {isSubmitting
                ? t("tournamentsPage.saving", "Guardando...")
                : targetTournament
                ? t("tournamentsPage.saveChangesBtn", "Guardar Cambios")
                : t("tournamentsPage.createModalBtn", "Crear Torneo")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

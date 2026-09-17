"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  CheckCircle2,
  Loader2,
  DollarSign,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { checkInParticipantAction } from "@/actions/tournaments";
import { useTranslation } from "@/components/providers/i18n-provider";
import { TournamentQRScanner } from "./tournament-qr-scanner";
import type { TournamentParticipant } from "@/types";

interface TournamentCheckinExpressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: TournamentParticipant[];
  onSuccessCheckin: () => void;
}

export function TournamentCheckinExpressModal({
  open,
  onOpenChange,
  tournamentId,
  participants,
  onSuccessCheckin,
}: TournamentCheckinExpressModalProps) {
  const { t } = useTranslation();
  const [selectedParticipant, setSelectedParticipant] =
    useState<TournamentParticipant | null>(null);
  const [recordedWeight, setRecordedWeight] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedParticipant(null);
      setRecordedWeight("");
    }
  }, [open]);

  useEffect(() => {
    if (selectedParticipant) {
      const initialWeight =
        selectedParticipant.actualWeightKg !== null &&
        selectedParticipant.actualWeightKg !== undefined
          ? selectedParticipant.actualWeightKg.toString()
          : selectedParticipant.weightKg !== null &&
            selectedParticipant.weightKg !== undefined
          ? selectedParticipant.weightKg.toString()
          : "";
      setRecordedWeight(initialWeight);
    }
  }, [selectedParticipant]);

  const handleScanDecoded = (decodedPayload: string) => {
    let targetId = decodedPayload.trim();
    if (decodedPayload.includes(":")) {
      const parts = decodedPayload.split(":");
      targetId = parts[parts.length - 1];
    }

    const searchLower = targetId.toLowerCase();
    const found = participants.find(
      (p) =>
        p.id === targetId ||
        p.id.endsWith(targetId) ||
        `${p.firstName} ${p.lastName || ""}`.toLowerCase().includes(searchLower)
    );

    if (found) {
      toast.success(
        `${t("tournamentsPage.competitorDetected", "Competidor detectado")}: ${
          found.firstName
        } ${found.lastName || ""}`
      );
      setSelectedParticipant(found);
    } else {
      toast.error(
        t(
          "tournamentsPage.competitorNotFoundQR",
          "Competidor no encontrado con el código QR escaneado."
        )
      );
    }
  };

  const handleConfirmAndNext = async () => {
    if (!selectedParticipant) return;

    setSubmitting(true);
    try {
      const numericWeight = parseFloat(recordedWeight);
      const weightVal =
        !isNaN(numericWeight) && numericWeight > 0 ? numericWeight : undefined;

      const res = await checkInParticipantAction(
        selectedParticipant.id,
        weightVal,
        true
      );

      if (res.success) {
        toast.success(
          t(
            "tournamentsPage.checkinSuccess",
            "Pesaje y asistencia confirmados. Listo para el siguiente competidor."
          )
        );
        onSuccessCheckin();
        // Reset to scanner mode for next athlete
        setSelectedParticipant(null);
        setRecordedWeight("");
      } else {
        toast.error(
          res.error ||
            t("tournamentsPage.checkinError", "Error al registrar asistencia.")
        );
      }
    } catch {
      toast.error(
        t(
          "tournamentsPage.unexpectedServerError",
          "Error inesperado en servidor."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isPaid =
    selectedParticipant &&
    (selectedParticipant.paymentStatus === "SUCCESS" ||
      (selectedParticipant.feeAmount || 0) === 0);

  const numericWeight = parseFloat(recordedWeight);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                {selectedParticipant ? (
                  <Scale className="w-5 h-5" />
                ) : (
                  <QrCode className="w-5 h-5" />
                )}
              </div>
              <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white">
                {selectedParticipant
                  ? t(
                      "tournamentsPage.scaleVerificationTitle",
                      "Verificación en Báscula"
                    )
                  : t(
                      "tournamentsPage.scaleStationTitle",
                      "Estación de Báscula y Escáner QR"
                    )}
              </DialogTitle>
            </div>
            {selectedParticipant?.isCheckedIn && (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] uppercase font-extrabold">
                <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                {t("tournamentsPage.alreadyVerified", "Ya Verificado")}
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedParticipant
              ? t(
                  "tournamentsPage.scaleVerificationDesc",
                  "Confirma el peso oficial del atleta y marca su asistencia presencial."
                )
              : t(
                  "tournamentsPage.scaleStationDesc",
                  "Escanea el código QR del gafete o ingresa la clave del competidor en la mesa de báscula."
                )}
          </DialogDescription>
        </DialogHeader>

        {/* MODE A: SCANNER ACTIVE */}
        {!selectedParticipant && (
          <div className="space-y-4 my-2">
            <TournamentQRScanner
              tournamentId={tournamentId}
              onScanSuccess={handleScanDecoded}
              paused={Boolean(selectedParticipant)}
            />
          </div>
        )}

        {/* MODE B: ATHLETE FOUND & WEIGHT ENTRY */}
        {selectedParticipant && (
          <div className="space-y-4 my-3">
            {/* Athlete Profile Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                    {selectedParticipant.firstName}{" "}
                    {selectedParticipant.lastName || ""}
                    {selectedParticipant.age !== undefined &&
                      selectedParticipant.age !== null && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-normal ml-2">
                          ({selectedParticipant.age}{" "}
                          {t("common.years", "años")})
                        </span>
                      )}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    🏫{" "}
                    {selectedParticipant.dojoName ||
                      t(
                        "tournamentsPage.independentCompetitor",
                        "Competidor Independiente"
                      )}
                  </p>
                </div>

                {(selectedParticipant.beltName ||
                  (selectedParticipant as unknown as { beltColor?: string })
                    .beltColor) && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 uppercase">
                    🥋{" "}
                    {selectedParticipant.beltName ||
                      (
                        selectedParticipant as unknown as {
                          beltColor?: string;
                        }
                      ).beltColor}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200 dark:border-zinc-700/60">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t("tournamentsPage.categoryLabel", "Categoría:")}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {selectedParticipant.category?.name ||
                    t("tournamentsPage.generalCategory", "General")}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {t("tournamentsPage.paymentStatusLabel", "Estado de Pago:")}
                </span>
                {isPaid ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                    {t("tournamentsPage.paidFull", "Pagado (Completo)")}
                  </span>
                ) : (
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />{" "}
                    {t("tournamentsPage.paymentPending", "Pago Pendiente")}
                  </span>
                )}
              </div>
            </div>

            {/* Weigh-In Entry Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>
                  {t(
                    "tournamentsPage.officialScaleWeightLabel",
                    "Peso Oficial registrado en Báscula (kg):"
                  )}
                </span>
                {selectedParticipant.weightKg && (
                  <span className="text-[11px] font-normal text-zinc-500">
                    {t("tournamentsPage.enrolledWithWeight", "Inscrito con")}:{" "}
                    {selectedParticipant.weightKg} kg
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej. 62.5"
                  value={recordedWeight}
                  onChange={(e) => setRecordedWeight(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-base font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <span className="text-sm font-extrabold text-zinc-500 shrink-0">
                  kg
                </span>
              </div>

              {!isNaN(numericWeight) && numericWeight > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  {t(
                    "tournamentsPage.weightReadyConfirmation",
                    "Peso listo para confirmación"
                  )}
                  : {numericWeight} kg
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {selectedParticipant ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedParticipant(null);
                  setRecordedWeight("");
                }}
                className="w-full sm:w-auto rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                {t("tournamentsPage.scanAnotherBtn", "Escanear Otro")}
              </Button>

              <Button
                onClick={handleConfirmAndNext}
                disabled={submitting}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                )}
                {t(
                  "tournamentsPage.confirmAndScanNextBtn",
                  "Confirmar y Escanear Siguiente"
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto rounded-xl text-xs font-bold border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              {t("tournamentsPage.closeStationBtn", "Cerrar Estación")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

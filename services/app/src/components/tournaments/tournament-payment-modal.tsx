"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateParticipantPaymentStatusAction } from "@/actions/tournaments";

interface TournamentPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  competitorName: string;
  tournamentTitle: string;
  feeAmount: number;
  onSuccess?: () => void;
}

export function TournamentPaymentModal({
  open,
  onOpenChange,
  participantId,
  competitorName,
  tournamentTitle,
  feeAmount,
  onSuccess,
}: TournamentPaymentModalProps) {
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [notes, setNotes] = useState<string>("");
  const [amount, setAmount] = useState<number | "">(feeAmount || 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (competitorName) {
      setNotes(`Cuota de torneo ${tournamentTitle}: ${competitorName}`.trim());
      setPaymentMethod("CASH");
      setAmount(feeAmount || 0);
    }
  }, [competitorName, tournamentTitle, feeAmount]);

  if (!open) return null;

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    const numericAmount = typeof amount === "number" ? amount : 0;
    try {
      const res = await updateParticipantPaymentStatusAction(
        participantId,
        "PAID",
        paymentMethod,
        notes.trim() || undefined,
        numericAmount
      );

      if (res.success) {
        toast.success(
          t(
            "studentPayments.paymentRecordedSuccess",
            `Pago de $${numericAmount} registrado para ${competitorName}.`
          )
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(
          res.error ||
            t("studentPayments.paymentRecordError", "Error al registrar el pago.")
        );
      }
    } catch {
      toast.error(
        t("studentPayments.paymentRecordError", "Error al registrar el pago.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
            <DollarSign className="w-5 h-5 text-amber-500" />
            {t(
              "tournamentsPage.quickPaymentTitle",
              "Pago Rápido de Cuota de Torneo"
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              "tournamentsPage.quickPaymentDesc",
              "Registra el pago e ingresa la transacción al balance financiero de la marca."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400">
              Competidor / Payer:
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">
              {competitorName}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Torneo: {tournamentTitle}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t("studentPayments.amountLabel", "Monto ($)")}
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs text-zinc-400 font-bold">
                $
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="pl-7 font-bold text-emerald-600 dark:text-emerald-400 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t("studentPayments.methodLabel", "Forma de Pago")}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                onClick={() => setPaymentMethod("CASH")}
                className={`h-9 text-xs font-bold rounded-xl gap-1.5 cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                {t("studentPayments.methodCash", "Efectivo")}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "TRANSFER" ? "default" : "outline"}
                onClick={() => setPaymentMethod("TRANSFER")}
                className={`h-9 text-xs font-bold rounded-xl gap-1.5 cursor-pointer ${
                  paymentMethod === "TRANSFER"
                    ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                {t("studentPayments.methodTransfer", "Transferencia")}
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "CARD" ? "default" : "outline"}
                onClick={() => setPaymentMethod("CARD")}
                className={`h-9 text-xs font-bold rounded-xl gap-1.5 cursor-pointer ${
                  paymentMethod === "CARD"
                    ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                {t("studentPayments.methodCard", "Tarjeta")}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t("studentPayments.notesLabel", "Notas / Referencia (Opcional)")}
            </Label>
            <Input
              placeholder={t(
                "studentPayments.notesPlaceholder",
                "Ej. Pagó en recepción de dojo"
              )}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs font-semibold rounded-xl cursor-pointer"
          >
            {t("rubrics.cancelButton", "Cancelar")}
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs gap-1.5 cursor-pointer shadow-xs"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("studentPayments.confirmPayment", "Pagar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

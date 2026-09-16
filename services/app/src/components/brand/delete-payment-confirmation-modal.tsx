"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";
import { deleteBrandCustomerPaymentAction } from "@/actions/brand-portal";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { BrandCustomerPayment } from "@/types";

interface DeletePaymentConfirmationModalProps {
  payment: BrandCustomerPayment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeletePaymentConfirmationModal({
  payment,
  isOpen,
  onOpenChange,
  onSuccess,
}: DeletePaymentConfirmationModalProps) {
  const { t } = useTranslation();
  const [confirmInput, setConfirmInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  if (!payment) return null;

  const targetId = payment.id;
  const isMatch = confirmInput.trim() === targetId;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(targetId);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setConfirmInput("");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!isMatch || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await deleteBrandCustomerPaymentAction(targetId);
      if (res.success) {
        toast.success(
          t(
            "brandAdminPayments.deleteSuccess",
            "Pago eliminado permanentemente del historial."
          )
        );
        setConfirmInput("");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(
          res.error ||
            t(
              "brandAdminPayments.deleteError",
              "Error al eliminar el pago."
            )
        );
      }
    } catch {
      toast.error(
        t(
          "brandAdminPayments.deleteError",
          "Error al procesar la eliminación."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerDisplayName = payment.student
    ? `${payment.student.firstName || ""} ${payment.student.lastName || ""}`.trim()
    : payment.customerName || "Cliente";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-black text-zinc-900 dark:text-white">
            {t(
              "brandAdminPayments.deleteModalTitle",
              "Confirmación de Eliminación"
            )}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              "brandAdminPayments.deleteModalDesc",
              "Esta acción es irreversible. El registro de pago y su comprobante financiero serán removidos permanentemente."
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Payment Summary Box */}
        <div className="my-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 text-xs space-y-2">
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">
              {t("brandAdminPayments.customerLabel", "Cliente / Alumno:")}
            </span>
            <span className="font-bold text-zinc-900 dark:text-white">
              {customerDisplayName}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">
              {t("brandAdminPayments.conceptLabel", "Concepto:")}
            </span>
            <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
              {payment.concept}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">
              {t("brandAdminPayments.amountLabel", "Monto:")}
            </span>
            <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
              ${payment.amount} {payment.currency}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span className="font-medium">
              {t("brandAdminPayments.dateLabel", "Fecha:")}
            </span>
            <span>
              <FormattedDate date={payment.createdAt} format="datetime" />
            </span>
          </div>
        </div>

        {/* Verification ID Input Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="confirm-payment-id-input"
              className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400"
            >
              {t(
                "brandAdminPayments.typeIdInstruction",
                "Escribe el ID del pago para habilitar borrado:"
              )}
            </label>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title={t("brandAdminPayments.copyId", "Copiar ID")}
            >
              {hasCopied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>
                {hasCopied
                  ? t("brandAdminPayments.idCopied", "¡Copiado!")
                  : t("brandAdminPayments.copyId", "Copiar ID")}
              </span>
            </button>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-1.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all select-all">
            {targetId}
          </div>

          <Input
            id="confirm-payment-id-input"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={targetId}
            disabled={isSubmitting}
            className={`font-mono text-xs rounded-xl h-10 ${
              isMatch
                ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30 dark:bg-rose-950/30"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold cursor-pointer w-full sm:w-auto"
          >
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            type="button"
            disabled={!isMatch || isSubmitting}
            onClick={handleDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>
              {t(
                "brandAdminPayments.deletePermanentBtn",
                "Eliminar Pago Permanentemente"
              )}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

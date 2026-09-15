"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";
import { recordStudentManualPaymentAction } from "@/actions/students";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Building,
  FileText,
  Loader2,
  User,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterStudentPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "EFECTIVO", labelKey: "studentPayments.methodCash", defaultLabel: "Efectivo", icon: Banknote, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
  { id: "TRANSFERENCIA", labelKey: "studentPayments.methodTransfer", defaultLabel: "Transferencia", icon: Building, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
  { id: "TARJETA", labelKey: "studentPayments.methodCard", defaultLabel: "Tarjeta", icon: CreditCard, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  { id: "OTRO", labelKey: "studentPayments.methodOther", defaultLabel: "Otro", icon: FileText, color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/30" },
] as const;

const PRESET_CONCEPTS = [
  { key: "studentPayments.presetMonthly", defaultLabel: "Colegiatura Mensual" },
  { key: "studentPayments.presetAnnual", defaultLabel: "Inscripción Anual" },
  { key: "studentPayments.presetExam", defaultLabel: "Examen de Cinta" },
  { key: "studentPayments.presetUniform", defaultLabel: "Equipo / Uniforme" },
];

export function RegisterStudentPaymentModal({
  isOpen,
  onOpenChange,
  student,
  onSuccess,
}: RegisterStudentPaymentModalProps) {
  const { t } = useTranslation();
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState<string>("500");
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "OTRO">("EFECTIVO");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize default concept with translation
  React.useEffect(() => {
    if (isOpen) {
      setConcept(t("studentPayments.presetMonthly", "Colegiatura Mensual"));
    }
  }, [isOpen, t]);

  if (!student) return null;

  const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Alumno";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error(t("studentPayments.invalidAmount", "Ingresa un monto válido mayor a 0."));
      return;
    }

    if (!concept.trim()) {
      toast.error(t("studentPayments.invalidConcept", "Ingresa un concepto de pago."));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordStudentManualPaymentAction({
        studentId: student.id,
        concept: concept.trim(),
        amount: numericAmount,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(
          t("studentPayments.paymentRecordedSuccess", `Pago de $${res.data.amount} registrado para ${studentName}.`)
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || t("studentPayments.paymentRecordError", "Error al registrar el pago."));
      }
    } catch (_err) {
      toast.error(t("studentPayments.paymentRecordError", "Error al registrar el pago."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-zinc-900 dark:text-white">
                {t("studentPayments.modalTitle", "Registrar Pago")}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <User className="h-3 w-3 text-amber-500" />
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{studentName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Presets de Concepto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t("studentPayments.conceptLabel", "Concepto del Cobro")}
              </Label>
              <Input
                id="payment-concept-input"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={t("studentPayments.conceptPlaceholder", "Ej. Colegiatura Septiembre")}
                className="rounded-xl text-xs font-semibold"
                required
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_CONCEPTS.map((preset) => {
                  const labelText = t(preset.key, preset.defaultLabel);
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setConcept(labelText)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer",
                        concept === labelText
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300"
                          : "bg-zinc-100 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                      )}
                    >
                      {labelText}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monto & Método de Pago */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("studentPayments.amountLabel", "Monto ($)")}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-zinc-400">$</span>
                  <Input
                    id="payment-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7 rounded-xl text-xs font-bold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("studentPayments.methodLabel", "Forma de Pago")}
                </Label>
                <select
                  id="payment-method-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full h-9 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 text-zinc-900 dark:text-zinc-100 cursor-pointer outline-none"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>
                      {t(method.labelKey, method.defaultLabel)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Método Visual Pills */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {PAYMENT_METHODS.map((m) => {
                const IconComp = m.icon;
                const isSelected = paymentMethod === m.id;
                const labelText = t(m.labelKey, m.defaultLabel);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer",
                      isSelected
                        ? m.color + " shadow-xs ring-1 ring-amber-500/30"
                        : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                    )}
                  >
                    <IconComp className="h-4 w-4 mb-1" />
                    <span>{labelText}</span>
                  </button>
                );
              })}
            </div>

            {/* Notas Opcionales */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {t("studentPayments.notesLabel", "Notas / Referencia (Opcional)")}
              </Label>
              <Textarea
                id="payment-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("studentPayments.notesPlaceholder", "Ej. Pagó folio #1204 en recepción")}
                className="rounded-xl text-xs resize-none h-16"
              />
            </div>
          </div>

          {/* Sticky Footer Submit & Cancel Buttons */}
          <div className="p-4 px-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex items-center justify-end gap-2 shrink-0">
            <Button
              id="cancel-student-payment-btn"
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold px-4 cursor-pointer"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              id="submit-student-payment-btn"
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md gap-1.5 px-5 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>{t("studentPayments.confirmPayment", "Pagar")}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

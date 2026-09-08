"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, DollarSign, Calendar, CheckCircle2, Plus, CreditCard, Banknote, Landmark, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBrandPaymentsHistoryAction,
  addManualBrandPaymentAction,
} from "@/actions/brand";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";

interface BrandSubscriptionItem {
  planName: string;
  status: string;
  billingCycle: string;
  price: number;
  discount: number;
  finalPrice: number;
  startDate: Date | string;
  endDate: Date | string;
}

interface BrandPaymentHistoryItem {
  id: string;
  amount: number;
  discountApplied: number;
  paymentDate: string;
  status: string;
  gatewayProvider: string | null;
  notes?: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

interface BrandItem {
  id: string;
  name: string;
  subscription?: BrandSubscriptionItem | null;
}

interface BrandPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: BrandItem;
  onSuccess?: () => void;
}

export function BrandPaymentsDialog({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: BrandPaymentsDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [subscription, setSubscription] = useState<BrandSubscriptionItem | null>(
    brand.subscription || null
  );
  const [payments, setPayments] = useState<BrandPaymentHistoryItem[]>([]);

  // Manual payment form state
  const [amount, setAmount] = useState<number>(brand.subscription?.finalPrice || 0);
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [status, setStatus] = useState<string>("SUCCESS");
  const [gatewayProvider, setGatewayProvider] = useState<string>("EFECTIVO");
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [billingPeriodStart, setBillingPeriodStart] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");

  const fetchHistory = useCallback(async () => {
    if (!brand.id) return;
    setLoading(true);
    try {
      const res = await getBrandPaymentsHistoryAction(brand.id);
      if (res.success && res.data) {
        setSubscription(res.data.subscription || brand.subscription || null);
        setPayments(res.data.payments || []);
      }
    } catch (_err) {
      toast.error(t("brandPaymentsDialog.loadError", "Error al cargar historial de pagos."));
    } finally {
      setLoading(false);
    }
  }, [brand.id, brand.subscription, t]);

  useEffect(() => {
    if (open) {
      fetchHistory();
      setShowAddForm(false);
    }
  }, [open, fetchHistory]);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await addManualBrandPaymentAction({
        brandId: brand.id,
        amount,
        discountApplied,
        status,
        gatewayProvider,
        paymentDate,
        billingPeriodStart,
        billingPeriodEnd,
        notes,
      });

      if (res.success) {
        toast.success(t("brandPaymentsDialog.successToast", "Pago manual registrado exitosamente."));
        setShowAddForm(false);
        fetchHistory();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error ?? t("brandPaymentsDialog.saveError", "No se pudo registrar el pago."));
      }
    } catch (_err) {
      toast.error(t("brandPaymentsDialog.saveError", "No se pudo registrar el pago."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodBadge = (provider: string | null) => {
    const p = (provider || "EFECTIVO").toUpperCase();
    switch (p) {
      case "NEQUI":
        return (
          <Badge className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <Smartphone className="w-3 h-3" />
            <span>NEQUI</span>
          </Badge>
        );
      case "EFECTIVO":
      case "CASH":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <Banknote className="w-3 h-3" />
            <span>EFECTIVO</span>
          </Badge>
        );
      case "TRANSFERENCIA":
      case "WIRE":
      case "SPEI":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <Landmark className="w-3 h-3" />
            <span>TRANSFERENCIA</span>
          </Badge>
        );
      case "CLIP":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <CreditCard className="w-3 h-3" />
            <span>CLIP</span>
          </Badge>
        );
      case "STRIPE":
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <CreditCard className="w-3 h-3" />
            <span>STRIPE</span>
          </Badge>
        );
      case "MERCADOPAGO":
        return (
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <CreditCard className="w-3 h-3" />
            <span>MERCADOPAGO</span>
          </Badge>
        );
      case "PSE":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-extrabold text-[9px] gap-1 rounded-lg">
            <Landmark className="w-3 h-3" />
            <span>PSE</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[9px] font-bold uppercase">
            {p}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  {t("brandPaymentsDialog.title", "Historial Financiero & Pagos")}
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-zinc-500">
                  {t("brandPaymentsDialog.subtitle", "Auditoría de cobros y suscripción para {name}").replace("{name}", brand.name)}
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-4 h-9 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {showAddForm
                  ? t("brandPaymentsDialog.viewHistoryBtn", "Ver Historial")
                  : t("brandPaymentsDialog.registerPaymentBtn", "Registrar Pago")}
              </span>
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Subscription Summary Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                {t("brandPaymentsDialog.activePlanLabel", "PLAN ACTIVO")}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 rounded-full font-extrabold text-[10px] uppercase px-3 py-0.5">
                {subscription?.planName
                  ? subscription.planName.toUpperCase()
                  : t("brandPaymentsDialog.freePlan", "FREE / BASE")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                  {t("brandPaymentsDialog.billingCycleLabel", "CICLO DE FACTURA")}
                </span>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  {subscription?.billingCycle === "YEARLY"
                    ? t("brandPaymentsDialog.yearlyPrice", "Anual (${price}/año)").replace(
                        "{price}",
                        String(subscription?.price ?? 49)
                      )
                    : t("brandPaymentsDialog.monthlyPrice", "Mensual (${price}/mes)").replace(
                        "{price}",
                        String(subscription?.price ?? 0)
                      )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                  {t("brandPaymentsDialog.expirationLabel", "VENCIMIENTO")}
                </span>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-white font-mono">
                  {subscription?.endDate
                    ? new Date(subscription.endDate).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : t("brandPaymentsDialog.noExpiration", "Suscripción activa sin vencimiento")}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{t("brandPaymentsDialog.activeOperating", "Suscripción activa y operando")}</span>
            </div>
          </div>

          {/* Form to add a manual payment */}
          {showAddForm ? (
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                {t("brandPaymentsDialog.addFormTitle", "Registrar Cobro / Transacción Manual")}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.amountLabel", "Monto Neto Recibido ({currency})", {
                      currency: `$${brand?.currency || "USD"}`,
                    })}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.discountLabel", "Descuento Aplicado ({currency})", {
                      currency: `$${brand?.currency || "USD"}`,
                    })}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={discountApplied}
                    onChange={(e) => setDiscountApplied(parseFloat(e.target.value) || 0)}
                    className="rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Payment Method / Channel Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.methodLabel", "Método / Medio de Pago / Pasarela")}
                  </Label>
                  <select
                    value={gatewayProvider}
                    onChange={(e) => setGatewayProvider(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl h-10 text-xs font-bold px-3"
                  >
                    <option value="EFECTIVO">💵 {t("brandPaymentsDialog.methodCash", "Efectivo (Cash)")}</option>
                    <option value="TRANSFERENCIA">🏛️ {t("brandPaymentsDialog.methodTransfer", "Transferencia (Wire / SPEI)")}</option>
                    <option value="NEQUI">📱 {t("brandPaymentsDialog.methodNequi", "Nequi (Colombia)")}</option>
                    <option value="CLIP">💳 {t("brandPaymentsDialog.methodClip", "Clip (Hosted)")}</option>
                    <option value="STRIPE">💳 {t("brandPaymentsDialog.methodStripe", "Stripe (Global)")}</option>
                    <option value="MERCADOPAGO">🌐 {t("brandPaymentsDialog.methodMercadoPago", "MercadoPago (LATAM)")}</option>
                    <option value="PSE">🏦 {t("brandPaymentsDialog.methodPse", "PSE (Débito Bancario)")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.statusLabel", "Estado de la Transacción")}
                  </Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl h-10 text-xs font-bold px-3"
                  >
                    <option value="SUCCESS">{t("brandPaymentsDialog.statusSuccess", "Exitoso (SUCCESS)")}</option>
                    <option value="PENDING">{t("brandPaymentsDialog.statusPending", "Pendiente (PENDING)")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.paymentDateLabel", "Fecha del Pago")}
                  </Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="rounded-xl font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {t("brandPaymentsDialog.periodStartLabel", "Inicio Periodo Cubierto")}
                  </Label>
                  <Input
                    type="date"
                    value={billingPeriodStart}
                    onChange={(e) => setBillingPeriodStart(e.target.value)}
                    className="rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {t("brandPaymentsDialog.periodEndLabel", "Fin Periodo Cubierto")}
                </Label>
                <Input
                  type="date"
                  value={billingPeriodEnd}
                  onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  {t("brandPaymentsDialog.notesLabel", "Notas / Folio / Referencia de Pago")}
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("brandPaymentsDialog.notesPlaceholder", "Ej: Pago realizado vía Nequi / SPEI ref #94032")}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl font-bold text-xs"
                >
                  {t("common.cancel", "Cancelar")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("brandPaymentsDialog.savePaymentBtn", "Guardar Pago")
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Payments Table */
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500">
                {t("brandPaymentsDialog.historySectionTitle", "HISTORIAL DE TRANSACCIONES REGISTRADAS")}
              </h4>

              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-xs font-semibold text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  {t("brandPaymentsDialog.emptyHistory", "No hay transacciones registradas para esta marca.")}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-bold">{t("brandPaymentsDialog.colDate", "FECHA")}</TableHead>
                      <TableHead className="text-xs font-bold">{t("brandPaymentsDialog.colAmount", "MONTO")}</TableHead>
                      <TableHead className="text-xs font-bold">{t("brandPaymentsDialog.colMethod", "MÉTODO / PASARELA")}</TableHead>
                      <TableHead className="text-xs font-bold">{t("brandPaymentsDialog.colStatus", "ESTADO")}</TableHead>
                      <TableHead className="text-xs font-bold">{t("brandPaymentsDialog.colNotes", "NOTAS")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-mono">
                          {new Date(p.paymentDate).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${p.amount} {p.currency || brand?.currency || "USD"}
                        </TableCell>
                        <TableCell>
                          {getMethodBadge(p.gatewayProvider)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5",
                              p.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 truncate max-w-[180px]">
                          {p.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

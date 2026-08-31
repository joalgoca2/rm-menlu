"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { executeCustomerCheckoutAction } from "@/actions/brand-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormattedDate } from "@/components/ui/formatted-date";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Loader2,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import type { BrandPlanConfig, BrandCustomerPayment } from "@/types";

interface CustomerMemberPaymentsClientProps {
  data: {
    plans: BrandPlanConfig[];
    gateways: { provider: string; isActive: boolean }[];
    history: BrandCustomerPayment[];
    currency: string;
  };
  userSession: {
    name?: string | null;
    email?: string | null;
    brandId?: string | null;
  };
}

export function CustomerMemberPaymentsClient({
  data,
  userSession,
}: CustomerMemberPaymentsClientProps) {
  const { t } = useTranslation();
  const [plans] = useState<BrandPlanConfig[]>(data.plans);
  const [gateways] = useState(data.gateways);
  const [history, setHistory] = useState<BrandCustomerPayment[]>(data.history);

  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<BrandPlanConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [customerName, setCustomerName] = useState(userSession.name || "");
  const [customerEmail, setCustomerEmail] = useState(userSession.email || "");
  const [selectedGateway, setSelectedGateway] = useState<string>(
    gateways[0]?.provider || "STRIPE"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenCheckout = (plan: BrandPlanConfig) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !customerName.trim() || !customerEmail.trim()) {
      toast.error(t("brandPortal.fillAllFields", "Por favor completa todos los campos."));
      return;
    }

    setIsProcessing(true);
    const amount =
      billingCycle === "YEARLY" ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const cycleText = billingCycle === "YEARLY" ? "Anual" : "Mensual";
    const concept = `${selectedPlan.name} (${cycleText})`;

    try {
      const res = await executeCustomerCheckoutAction({
        brandId: userSession.brandId || "brand-general",
        brandPlanId: selectedPlan.id,
        customerName,
        customerEmail,
        concept,
        amount,
        currency: selectedPlan.currency,
        gatewayProvider: selectedGateway,
      });

      if (res.success && res.data) {
        setHistory([res.data, ...history]);
        setIsModalOpen(false);
        toast.success(
          t("brandPortal.checkoutSuccessToast", "¡Pago procesado y registrado exitosamente!")
        );
      } else {
        toast.error(res.error || t("brandPortal.checkoutErrorToast", "Error al procesar el pago."));
      }
    } catch (_err) {
      toast.error(t("brandPortal.checkoutErrorToast", "Error de red al procesar el pago."));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <CreditCard className="h-3.5 w-3.5" />
            <span>{t("myPayments.badge", "Área de Pagos & Membresías de Cliente")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            {t("myPayments.title", "Mis Membresías & Pagos")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("myPayments.subtitle", "Consulta los paquetes de tu marca, realiza pagos seguros y revisa tu historial de cobros.")}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "MONTHLY"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-black"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {t("billing.monthlyBilling", "Mensual")}
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "YEARLY"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-black"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <span>{t("billing.yearlyBilling", "Anual")}</span>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded-lg font-black">
              -20%
            </Badge>
          </button>
        </div>
      </div>

      {/* Brand Plans Available Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <span>{t("myPayments.plansCatalogTitle", "Membresías Disponibles")}</span>
          </h3>
        </div>

        {plans.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold">
            {t("myPayments.noPlansMessage", "Tu marca aún no ha publicado membresías en catálogo.")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => {
              const price = billingCycle === "YEARLY" ? p.priceYearly : p.priceMonthly;
              return (
                <div
                  key={p.id}
                  className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between hover:border-indigo-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {p.currency}
                      </Badge>
                    </div>

                    {p.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                        ${price}
                      </span>
                      <span className="text-xs text-zinc-400 font-semibold">
                        {p.currency} / {billingCycle === "YEARLY" ? "año" : "mes"}
                      </span>
                    </div>

                    <Button
                      id={`pay-plan-btn-${p.id}`}
                      onClick={() => handleOpenCheckout(p)}
                      className="w-full rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2"
                    >
                      <span>{t("myPayments.payNowBtn", "Pagar Membresía")}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-emerald-500" />
          <span>{t("myPayments.historyTitle", "Historial de Mis Pagos")}</span>
        </h3>

        {history.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-500 text-xs font-semibold">
            {t("myPayments.noHistoryMessage", "Aún no cuentas con pagos registrados en tu historial.")}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 uppercase tracking-wider font-mono text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">{t("brandAdminPayments.colConcept", "Concepto")}</th>
                    <th className="px-6 py-3.5 font-bold">{t("brandAdminPayments.colAmount", "Monto")}</th>
                    <th className="px-6 py-3.5 font-bold">{t("brandAdminPayments.colGateway", "Pasarela")}</th>
                    <th className="px-6 py-3.5 font-bold">{t("brandAdminPayments.colStatus", "Estado")}</th>
                    <th className="px-6 py-3.5 font-bold text-right">{t("brandAdminPayments.colDate", "Fecha")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {history.map((h) => {
                    const isSuccess = h.status === "SUCCESS";
                    const isFailed = h.status === "FAILED" || h.status === "REJECTED";

                    return (
                      <tr key={h.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                          {h.concept}
                          <span className="block font-mono text-[10px] text-zinc-400 font-normal">
                            Ref: {h.transactionRef}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-black text-zinc-900 dark:text-zinc-100">
                          ${h.amount} {h.currency}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-[11px] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                            {h.gatewayProvider}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Exitoso</span>
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 text-[11px]">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Rechazado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 text-[11px]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right font-medium text-zinc-500">
                          <FormattedDate date={h.createdAt} format="PPP" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Gateway Checkout Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <span>Procesar Pago de Membresía</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Selecciona una pasarela habilitada por tu marca para completar la transacción.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <form onSubmit={handleExecutePayment} className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedPlan.name}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Ciclo: {billingCycle === "YEARLY" ? "Anual" : "Mensual"}
                  </p>
                </div>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  ${billingCycle === "YEARLY" ? selectedPlan.priceYearly : selectedPlan.priceMonthly} {selectedPlan.currency}
                </span>
              </div>

              <div className="space-y-1">
                <Label htmlFor="custName" className="text-xs font-semibold">Tu Nombre Completo</Label>
                <Input
                  id="custName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="custEmail" className="text-xs font-semibold">Correo Electrónico</Label>
                <Input
                  id="custEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gatewaySelect" className="text-xs font-semibold">
                  Pasarela de Pago de la Marca
                </Label>
                {gateways.length > 0 ? (
                  <select
                    id="gatewaySelect"
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full h-9 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                  >
                    {gateways.map((g) => (
                      <option key={g.provider} value={g.provider}>
                        {g.provider} (Pasarela Activa de la Marca)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                    Atención: Tu marca utiliza la pasarela por defecto (STRIPE / MOCK).
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  id="confirm-member-checkout-btn"
                  disabled={isProcessing}
                  className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Pagar Ahora (${billingCycle === "YEARLY" ? selectedPlan.priceYearly : selectedPlan.priceMonthly} {selectedPlan.currency})</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { executeCustomerCheckoutAction } from "@/actions/brand-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditCard, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BrandPlanConfig } from "@/types";

interface CustomerCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string;
  plan: BrandPlanConfig | null;
  currency: string;
  activeGateways: { gatewayType: string; publicKey: string }[];
}

export function CustomerCheckoutModal({
  isOpen,
  onClose,
  brandId,
  plan,
  currency,
  activeGateways,
}: CustomerCheckoutModalProps) {
  const { t } = useTranslation();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedGateway, setSelectedGateway] = useState<string>(
    activeGateways[0]?.gatewayType || "MOCK"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const amount = plan ? plan.priceMonthly : 0;
  const concept = plan
    ? `Membresía ${plan.name}`
    : t("brandPortal.defaultConcept", "Pago de servicio");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      toast.error(t("brandPortal.fillAllFields", "Por favor completa todos los campos."));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await executeCustomerCheckoutAction({
        brandId,
        brandPlanId: plan?.id,
        customerName,
        customerEmail,
        concept,
        amount,
        currency,
        gatewayProvider: selectedGateway,
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success(
          t("brandPortal.checkoutSuccessToast", "¡Pago procesado exitosamente!")
        );
      } else {
        toast.error(res.error || t("brandPortal.checkoutErrorToast", "Error al pagar."));
      }
    } catch (_err) {
      toast.error(t("brandPortal.checkoutErrorToast", "Error de red al procesar pago."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setCustomerName("");
    setCustomerEmail("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-3xl dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            <span>{plan ? plan.name : t("brandPortal.checkoutTitle", "Procesar Pago")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("brandPortal.checkoutSubtitle", "Ingresa tus datos para completar tu pago de forma segura.")}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t("brandPortal.paymentSuccessHeading", "¡Pago Completado!")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              {t(
                "brandPortal.paymentSuccessMessage",
                "Hemos registrado tu pago exitosamente. Recibirás el comprobante por correo electrónico."
              )}
            </p>
            <Button
              onClick={handleClose}
              id="close-checkout-success-btn"
              className="rounded-xl w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {t("common.close", "Cerrar")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{concept}</p>
                <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                  ${amount} {currency}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>{t("brandPortal.secureCheckout", "Pago Seguro")}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="customerName" className="text-xs font-semibold">
                {t("brandPortal.fullName", "Nombre completo")}
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ej. Ana Martínez"
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="customerEmail" className="text-xs font-semibold">
                {t("brandPortal.emailAddress", "Correo electrónico")}
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="ana@ejemplo.com"
                required
                className="rounded-xl"
              />
            </div>

            {activeGateways.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {t("brandPortal.selectGateway", "Pasarela de pago")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {activeGateways.map((g) => (
                    <button
                      key={g.gatewayType}
                      type="button"
                      onClick={() => setSelectedGateway(g.gatewayType)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedGateway === g.gatewayType
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {g.gatewayType}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="rounded-xl"
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                id="pay-customer-submit-btn"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>{t("brandPortal.processing", "Procesando...")}</span>
                  </>
                ) : (
                  <span>
                    {t("brandPortal.payNow", "Pagar Ahora")} ${amount} {currency}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

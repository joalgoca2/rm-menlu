"use client";

import React, { useState } from "react";
import type { PaymentGatewayType } from "@/types";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { CreditCard, ShieldCheck, Zap, Loader2, ArrowRight } from "lucide-react";

interface GatewayOption {
  provider: PaymentGatewayType;
  name: string;
}

interface PaymentGatewaySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: PaymentGatewayType) => void;
  availableGateways: GatewayOption[];
  planName: string;
  amount: number;
  loading?: boolean;
}

export function PaymentGatewaySelectModal({
  isOpen,
  onClose,
  onSelect,
  availableGateways,
  planName,
  amount,
  loading = false,
}: PaymentGatewaySelectModalProps) {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<PaymentGatewayType>(
    availableGateways[0]?.provider || "CLIP"
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(selectedProvider);
  };

  const getGatewayIcon = (provider: PaymentGatewayType) => {
    switch (provider) {
      case "MOCK":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "CLIP":
        return <CreditCard className="w-5 h-5 text-orange-500" />;
      case "STRIPE":
        return <CreditCard className="w-5 h-5 text-indigo-500" />;
      case "MERCADOPAGO":
        return <CreditCard className="w-5 h-5 text-sky-500" />;
      case "PSE":
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getGatewayBadge = (provider: PaymentGatewayType) => {
    if (provider === "MOCK") {
      return (
        <span className="text-[10px] font-extrabold uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
          Pruebas Locales Sandbox
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
        Pasarela Oficial
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg p-6 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {t("billing.selectGatewayTitle", "Selecciona tu Método de Pago")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Suscripción al <strong>Plan {planName}</strong> (${amount} MXN/mes)
            </p>
          </div>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {availableGateways.map((gw) => {
            const isSelected = selectedProvider === gw.provider;
            return (
              <div
                key={gw.provider}
                onClick={() => setSelectedProvider(gw.provider)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-2 ring-emerald-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    {getGatewayIcon(gw.provider)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>{gw.name}</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      {gw.provider === "MOCK"
                        ? "Procesamiento inmediato para testing local sin tarjeta real."
                        : "Procesamiento seguro con la pasarela oficial."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getGatewayBadge(gw.provider)}
                  <input
                    type="radio"
                    name="gateway-option"
                    checked={isSelected}
                    onChange={() => setSelectedProvider(gw.provider)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Note */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] text-zinc-500">
            Transacción 100% cifrada con SSL/TLS. No almacenamos datos de tarjeta en local.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl h-10 px-4"
          >
            {t("common.cancel", "Cancelar")}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 gap-2 shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{t("billing.proceedToCheckout", "Continuar al Pago")}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

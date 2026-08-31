"use client";

import React from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import type { BrandPlanConfig } from "@/types";

interface BrandPlanCardProps {
  plan: BrandPlanConfig;
  currency: string;
  onSelectPlan: (plan: BrandPlanConfig) => void;
}

export function BrandPlanCard({ plan, currency, onSelectPlan }: BrandPlanCardProps) {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col justify-between p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {plan.name}
            </h3>
            {plan.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {plan.description}
              </p>
            )}
          </div>
          <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="my-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
              ${plan.priceMonthly}
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {currency} / {t("brandPortal.month", "mes")}
            </span>
          </div>
          {plan.priceYearly > 0 && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              ${plan.priceYearly} {currency} {t("brandPortal.yearlyOption", "/ año")}
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>{t("brandPortal.featureAccess", "Acceso a instalaciones & servicios")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>{t("brandPortal.featureReceipt", "Comprobante digital de pago inmediato")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span>{t("brandPortal.featureSupport", "Atención y soporte directo de la marca")}</span>
          </div>
        </div>
      </div>

      <Button
        id={`select-brand-plan-${plan.id}`}
        onClick={() => onSelectPlan(plan)}
        className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 shadow-lg shadow-indigo-600/20 transition-all"
      >
        {t("brandPortal.subscribeNow", "Inscribirse / Pagar")}
      </Button>
    </div>
  );
}

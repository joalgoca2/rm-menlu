"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";

export function BrandPaymentsHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
          <CreditCard className="h-3.5 w-3.5" />
          <span>{t("brandAdminPayments.badge", "Cobranza & Membresías de Marca")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          {t("brandAdminPayments.title", "Seguimiento de Cobros a Clientes")}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {t(
            "brandAdminPayments.description",
            "Monitorea los ingresos recibidos por tus membresías, administra tarifas y audita transacciones."
          )}
        </p>
      </div>
    </div>
  );
}

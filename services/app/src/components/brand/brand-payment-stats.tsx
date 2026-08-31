"use client";

import React from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { DollarSign, CheckCircle2, Clock, CreditCard } from "lucide-react";
import type { BrandPaymentStats as StatsType } from "@/types";

interface BrandPaymentStatsProps {
  stats: StatsType;
}

export function BrandPaymentStats({ stats }: BrandPaymentStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Revenue Card */}
      <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("brandAdminPayments.totalIncome", "Ingresos Totales Recibidos")}
          </p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            ${stats.totalRevenue.toLocaleString()} {stats.currency}
          </h3>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <DollarSign className="h-6 w-6" />
        </div>
      </div>

      {/* Successful Payments Card */}
      <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("brandAdminPayments.successfulPayments", "Cobros Exitosos")}
          </p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {stats.successfulTransactions}
          </h3>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
      </div>

      {/* Pending Transactions Card */}
      <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("brandAdminPayments.pendingPayments", "Pagos Pendientes")}
          </p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {stats.pendingTransactions}
          </h3>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <Clock className="h-6 w-6" />
        </div>
      </div>

      {/* Active Gateways Card */}
      <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("brandAdminPayments.activeGateways", "Pasarelas Conectadas")}
          </p>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
            {stats.activeGatewaysCount}
          </h3>
        </div>
        <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
          <CreditCard className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

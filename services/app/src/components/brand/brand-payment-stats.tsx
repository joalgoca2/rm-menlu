"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";
import { DollarSign, CheckCircle2, Clock, CreditCard, Calendar, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandPaymentExtractModal } from "@/components/brand/brand-payment-extract-modal";
import type { BrandPaymentStats as StatsType, PaginatedResult, BrandCustomerPayment } from "@/types";

interface BrandPaymentStatsProps {
  stats: StatsType;
  brandName?: string;
  paymentsData?: PaginatedResult<BrandCustomerPayment>;
}

export function BrandPaymentStats({ stats, brandName, paymentsData }: BrandPaymentStatsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || stats.period || "ALL";
  const [isExtractModalOpen, setIsExtractModalOpen] = useState(false);

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPeriod && newPeriod !== "ALL") {
      params.set("period", newPeriod);
    } else {
      params.delete("period");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const getPeriodLabelText = (pKey: string) => {
    switch (pKey) {
      case "MONTH":
        return t("brandAdminPayments.periodMonth", "Este Mes");
      case "QUARTER":
        return t("brandAdminPayments.periodQuarter", "Trimestre Actual");
      case "YEAR":
        return t("brandAdminPayments.periodYear", "Año en Curso");
      default:
        return t("brandAdminPayments.periodAll", "Histórico Completo");
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Period Filter & Export Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {t("brandAdminPayments.periodLabel", "Período:")}
          </span>
          <select
            id="payment-stats-period-select"
            value={currentPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-zinc-900 dark:text-zinc-100 cursor-pointer outline-none"
          >
            <option value="MONTH">{t("brandAdminPayments.periodMonth", "Este Mes")}</option>
            <option value="QUARTER">{t("brandAdminPayments.periodQuarter", "Trimestre Actual")}</option>
            <option value="YEAR">{t("brandAdminPayments.periodYear", "Año en Curso")}</option>
            <option value="ALL">{t("brandAdminPayments.periodAll", "Histórico Completo")}</option>
          </select>
        </div>

        {paymentsData && (
          <Button
            id="open-financial-extract-modal-btn"
            variant="outline"
            onClick={() => setIsExtractModalOpen(true)}
            className="rounded-xl text-xs font-bold gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{t("brandAdminPayments.exportReport", "Exportar Extracto")}</span>
          </Button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("brandAdminPayments.totalIncome", "Ingresos Totales Recibidos")}
            </p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              ${stats.totalRevenue.toLocaleString("en-US")} {stats.currency}
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

      {/* Financial Extract Modal */}
      {paymentsData && (
        <BrandPaymentExtractModal
          isOpen={isExtractModalOpen}
          onOpenChange={setIsExtractModalOpen}
          brandName={brandName}
          stats={stats}
          paymentsData={paymentsData}
          periodLabel={getPeriodLabelText(currentPeriod)}
        />
      )}
    </div>
  );
}

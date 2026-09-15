"use client";

import React from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Printer,
  FileSpreadsheet,
  Building2,
  Calendar,
} from "lucide-react";
import { FormattedDate } from "@/components/ui/formatted-date";
import type { PaginatedResult, BrandCustomerPayment, BrandPaymentStats } from "@/types";

import { printFinancialExtract } from "@/lib/print-utils";

interface BrandPaymentExtractModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  brandName?: string;
  stats: BrandPaymentStats;
  paymentsData: PaginatedResult<BrandCustomerPayment>;
  periodLabel: string;
}

export function BrandPaymentExtractModal({
  isOpen,
  onOpenChange,
  brandName = "Academia Menlu",
  stats,
  paymentsData,
  periodLabel,
}: BrandPaymentExtractModalProps) {
  const { t } = useTranslation();

  const handlePrint = () => {
    printFinancialExtract({
      brandName,
      stats,
      paymentsData,
      periodLabel,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-3xl p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:w-full">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 shrink-0 print:border-b-2 print:border-black">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 print:hidden">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white">
                    {t("brandAdminPayments.extractTitle", "Extracto Financiero & Reporte de Cobranza")}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{brandName}</span>
                  <span>•</span>
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-mono font-semibold">{periodLabel}</span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden w-full sm:w-auto justify-end">
              <Button
                id="print-financial-extract-btn"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-md"
              >
                <Printer className="h-4 w-4" />
                <span>{t("brandAdminPayments.printExtract", "Imprimir / Guardar PDF")}</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Report Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 print:p-0 print:overflow-visible">
          {/* Summary KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 print:border-zinc-300">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("brandAdminPayments.totalIncome", "Ingresos Totales")}
              </span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                ${stats.totalRevenue.toLocaleString("en-US")} {stats.currency}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 print:border-zinc-300">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("brandAdminPayments.successfulPayments", "Cobros Exitosos")}
              </span>
              <p className="text-xl font-black text-zinc-900 dark:text-white font-mono mt-1">
                {stats.successfulTransactions}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 print:border-zinc-300">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("brandAdminPayments.pendingPayments", "Pagos Pendientes")}
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {stats.pendingTransactions}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 print:border-zinc-300">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                {t("brandAdminPayments.activeGateways", "Pasarelas Conectadas")}
              </span>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
                {stats.activeGatewaysCount}
              </p>
            </div>
          </div>

          {/* Transactions Audit Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
              Detalle de Cobros Registrados en Período ({paymentsData.items.length})
            </h4>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden print:border-zinc-300">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-800/60 print:bg-zinc-200">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Alumno / Cliente</TableHead>
                    <TableHead className="text-xs font-bold">Concepto</TableHead>
                    <TableHead className="text-xs font-bold">Monto</TableHead>
                    <TableHead className="text-xs font-bold">Método</TableHead>
                    <TableHead className="text-xs font-bold">Estado</TableHead>
                    <TableHead className="text-xs font-bold text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsData.items.length > 0 ? (
                    paymentsData.items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="py-2 text-xs font-semibold">
                          {p.student
                            ? `${p.student.firstName || ""} ${p.student.lastName || ""}`.trim()
                            : p.customerName || "Cliente anónimo"}
                        </TableCell>
                        <TableCell className="py-2 text-xs">{p.concept}</TableCell>
                        <TableCell className="py-2 text-xs font-mono font-bold">
                          ${p.amount} {p.currency}
                        </TableCell>
                        <TableCell className="py-2 text-xs font-semibold">{p.gatewayProvider}</TableCell>
                        <TableCell className="py-2 text-xs">
                          <span
                            className={
                              p.status === "SUCCESS"
                                ? "text-emerald-600 font-bold"
                                : p.status === "PENDING"
                                ? "text-amber-600 font-bold"
                                : "text-rose-600 font-bold"
                            }
                          >
                            {p.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-xs text-right font-mono text-zinc-500">
                          <FormattedDate date={p.createdAt} format="datetime" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-zinc-400">
                        No hay registros para este período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/90 flex justify-between items-center shrink-0 print:hidden">
          <span className="text-[11px] text-zinc-400">
            Documento generado por Menlu Platform • {new Date().toLocaleDateString()}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs font-bold"
          >
            {t("common.cancel", "Cerrar")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

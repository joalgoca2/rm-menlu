"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getBrandPaginatedPaymentsAction } from "@/actions/brand";
import { PaginationControl } from "@/components/ui/pagination-control";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Calendar, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/providers/i18n-provider";

interface PaymentItem {
  id: string;
  amount: number;
  discountApplied: number;
  paymentDate: string;
  status: string;
  gatewayProvider: string | null;
  trackingId: string | null;
  rawGatewayStatus: string | null;
  notes: string | null;
  billingPeriodStart: string;
  billingPeriodEnd: string;
}

interface BrandPaymentsHistoryTableProps {
  brandId: string;
}

export function BrandPaymentsHistoryTable({ brandId }: BrandPaymentsHistoryTableProps) {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(
    async (page: number) => {
      if (!brandId) return;
      setIsLoading(true);
      try {
        const res = await getBrandPaginatedPaymentsAction({
          brandId,
          page,
          limit: 8,
        });

        if (res.success && res.data) {
          setPayments(res.data.payments);
          setTotalPages(res.data.totalPages);
          setTotalRecords(res.data.total);
          setCurrentPage(res.data.page);
        } else {
          toast.error(res.error ?? t("paymentHistory.errorLoading", "No se pudieron cargar las transacciones."));
        }
      } catch (_err) {
        toast.error(t("paymentHistory.errorFetch", "Error al obtener el historial de pagos."));
      } finally {
        setIsLoading(false);
      }
    },
    [brandId, t]
  );

  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage, fetchPayments]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getStatusBadge = (status: string, rawStatus?: string | null) => {
    const displayStatus = rawStatus || status;
    switch (displayStatus.toUpperCase()) {
      case "SUCCESS":
      case "COMPLETED":
      case "APPROVED":
      case "CHARGED":
      case "PAID":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold gap-1 rounded-lg">
            <CheckCircle2 className="h-3 w-3" />
            <span>{displayStatus}</span>
          </Badge>
        );
      case "PENDING":
      case "PROCESSING":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold gap-1 rounded-lg">
            <Clock className="h-3 w-3" />
            <span>{displayStatus}</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold gap-1 rounded-lg">
            <XCircle className="h-3 w-3" />
            <span>{displayStatus}</span>
          </Badge>
        );
    }
  };

  const getProviderBadge = (provider?: string | null) => {
    const prov = (provider || "MOCK").toUpperCase();
    let badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (prov === "CLIP") badgeColor = "bg-orange-500/10 text-orange-600 border-orange-500/20";
    if (prov === "STRIPE") badgeColor = "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
    if (prov === "MERCADOPAGO") badgeColor = "bg-sky-500/10 text-sky-600 border-sky-500/20";
    if (prov === "PSE") badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20";

    return (
      <Badge variant="outline" className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${badgeColor}`}>
        {prov}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/50 backdrop-blur overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              {t("paymentHistory.title", "Historial de Cobros y Transacciones Realizadas")}
            </h3>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("paymentHistory.totalRecords", `Total: ${totalRecords} registro(s)`).replace("{count}", String(totalRecords))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 uppercase tracking-wider font-extrabold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">{t("paymentHistory.colDate", "Fecha")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colProvider", "Pasarela")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colTrackingId", "ID Seguimiento")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colNativeStatus", "Estatus Nativo")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colAmount", "Monto ($USD)")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colBillingPeriod", "Período Facturado")}</th>
                <th className="py-3 px-4">{t("paymentHistory.colNotes", "Notas / Concepto")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-28 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-20 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-zinc-400 opacity-60" />
                      <p className="font-semibold text-xs">{t("paymentHistory.emptyRecords", "No se registran transacciones para esta empresa aún.")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                      <FormattedDate date={payment.paymentDate} format="PPP" />
                    </td>
                    <td className="py-3 px-4">
                      {getProviderBadge(payment.gatewayProvider)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      {payment.trackingId || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(payment.status, payment.rawGatewayStatus)}
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span>
                          <FormattedDate date={payment.billingPeriodStart} format="dd/MM/yy" /> -{" "}
                          <FormattedDate date={payment.billingPeriodEnd} format="dd/MM/yy" />
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 italic">
                      {payment.notes || t("paymentHistory.defaultNote", "Cobro automático de suscripción al plan vía pasarela")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mandatory Always-Visible Pagination Control */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-center bg-zinc-50/50 dark:bg-zinc-900/30">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentTransactionItem } from "@/actions/payment-engine";
import { Search, Filter, ExternalLink, Receipt, Eye, Building2, Calendar, DollarSign, Shield, Link2 } from "lucide-react";

interface PaymentTransactionsTableProps {
  transactions: PaymentTransactionItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
}

export function PaymentTransactionsTable({
  transactions,
  total: _total,
  currentPage,
  totalPages,
  isLoading,
}: PaymentTransactionsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedTxForModal, setSelectedTxForModal] = useState<PaymentTransactionItem | null>(null);

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentProvider = searchParams.get("provider") || "ALL";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "SUCCESS":
        return (
          <Badge variant="success" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusCompleted", "Completado")}
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusPending", "Pendiente")}
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusFailed", "Fallido")}
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="secondary" className="text-[10px] font-bold">
            {t("paymentEngineDetails.txStatusRefunded", "Reembolsado")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "CLIP":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
            Clip
          </span>
        );
      case "STRIPE":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
            Stripe
          </span>
        );
      case "MERCADOPAGO":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
            MercadoPago
          </span>
        );
      case "PSE":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
            PSE
          </span>
        );
      case "MOCK":
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
            Mock
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md dark:bg-zinc-800 dark:text-zinc-400">
            {provider}
          </span>
        );
    }
  };

  const isExternalUrl = (url: string | null) => {
    if (!url) return false;
    return url.startsWith("http://") || url.startsWith("https://") ? !url.includes("/dashboard/settings") && !url.includes("localhost:3000/dashboard/") : false;
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder={t(
              "paymentEngineDetails.txSearchPlaceholder",
              "Buscar por ID externo o cliente..."
            )}
            defaultValue={currentSearch}
            onChange={(e) => updateParam("search", e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Select
              value={currentStatus}
              onValueChange={(val) => updateParam("status", val)}
            >
              <SelectTrigger className="h-9 text-xs w-[140px] rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <SelectValue
                  placeholder={t(
                    "paymentEngineDetails.txFilterAllStatuses",
                    "Todos los Estatus"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("paymentEngineDetails.txFilterAllStatuses", "Todos los Estatus")}
                </SelectItem>
                <SelectItem value="COMPLETED">
                  {t("paymentEngineDetails.txStatusCompleted", "Completado")}
                </SelectItem>
                <SelectItem value="PENDING">
                  {t("paymentEngineDetails.txStatusPending", "Pendiente")}
                </SelectItem>
                <SelectItem value="FAILED">
                  {t("paymentEngineDetails.txStatusFailed", "Fallido")}
                </SelectItem>
                <SelectItem value="REFUNDED">
                  {t("paymentEngineDetails.txStatusRefunded", "Reembolsado")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={currentProvider}
            onValueChange={(val) => updateParam("provider", val)}
          >
            <SelectTrigger className="h-9 text-xs w-[150px] rounded-xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <SelectValue
                placeholder={t(
                  "paymentEngineDetails.txFilterAllProviders",
                  "Todos los Proveedores"
                )}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t(
                  "paymentEngineDetails.txFilterAllProviders",
                  "Todos los Proveedores"
                )}
              </SelectItem>
              <SelectItem value="CLIP">Clip</SelectItem>
              <SelectItem value="STRIPE">Stripe</SelectItem>
              <SelectItem value="MERCADOPAGO">MercadoPago</SelectItem>
              <SelectItem value="PSE">PSE</SelectItem>
              <SelectItem value="MOCK">Mock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4">{t("paymentEngineDetails.txColId", "ID Transacción")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColBrand", "Marca / Origen")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColProvider", "Pasarela")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColAmount", "Monto")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColStatus", "Estado")}</th>
                <th className="p-4">{t("paymentEngineDetails.txColDate", "Fecha (UTC)")}</th>
                <th className="p-4 text-right">{t("paymentEngineDetails.colActions", "Acciones")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400 italic">
                    {t("common.loading", "Cargando...")}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                      <span className="italic">
                        {t(
                          "paymentEngineDetails.txEmpty",
                          "No hay transacciones registradas en el historial."
                        )}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-zinc-900 dark:text-white">
                      {tx.externalId || tx.id}
                    </td>
                    <td className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">
                      {tx.brandName || "Plataforma SaaS"}
                    </td>
                    <td className="p-4">{getProviderBadge(tx.gatewayType)}</td>
                    <td className="p-4 font-extrabold text-zinc-900 dark:text-white">
                      ${tx.amount.toLocaleString()} {tx.currency}
                    </td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString([], {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTxForModal(tx)}
                          className="h-7 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg gap-1 px-2.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{t("paymentEngineDetails.viewDetailsBtn", "Ver Detalle")}</span>
                        </Button>

                        {isExternalUrl(tx.checkoutUrl) && (
                          <a
                            href={tx.checkoutUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            <span>{t("paymentEngineDetails.viewCheckout", "Ver Checkout")}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mandatory Pagination Control Component */}
        <div className="px-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Transaction Audit Preview Modal */}
      <Dialog
        open={Boolean(selectedTxForModal)}
        onOpenChange={(open) => !open && setSelectedTxForModal(null)}
      >
        <DialogContent className="sm:max-w-[550px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-3xl shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  {t("paymentEngineDetails.auditModalTitle", "Auditoría de Transacción")}
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-zinc-500">
                  {t("paymentEngineDetails.auditModalSubtitle", "Detalle del registro de cobro y pasarela de pago")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedTxForModal && (
            <div className="p-6 space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                    {t("paymentEngineDetails.auditAmount", "Monto Total")}
                  </span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ${selectedTxForModal.amount.toLocaleString()} {selectedTxForModal.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 pt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">
                    {t("paymentEngineDetails.auditStatus", "Estado")}
                  </span>
                  <div>{getStatusBadge(selectedTxForModal.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    {t("paymentEngineDetails.auditTxId", "ID Transacción / Referencia")}
                  </span>
                  <p className="font-mono font-bold text-zinc-900 dark:text-white truncate">
                    {selectedTxForModal.externalId || selectedTxForModal.id}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-500" />
                    {t("paymentEngineDetails.auditBrand", "Marca / Origen")}
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-white truncate">
                    {selectedTxForModal.brandName || "Plataforma SaaS"}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-500" />
                    {t("paymentEngineDetails.auditGateway", "Pasarela")}
                  </span>
                  <div>{getProviderBadge(selectedTxForModal.gatewayType)}</div>
                </div>

                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    {t("paymentEngineDetails.auditDate", "Fecha de Registro (UTC)")}
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-white font-medium text-[11px]">
                    {new Date(selectedTxForModal.createdAt).toUTCString()}
                  </p>
                </div>
              </div>

              {selectedTxForModal.checkoutUrl && (
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-emerald-500" />
                    {t("paymentEngineDetails.auditCheckoutUrl", "URL de Checkout Registrada")}
                  </span>
                  <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-all select-all">
                    {selectedTxForModal.checkoutUrl}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                {isExternalUrl(selectedTxForModal.checkoutUrl) && (
                  <a
                    href={selectedTxForModal.checkoutUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all"
                  >
                    <span>{t("paymentEngineDetails.openExternalCheckout", "Abrir Pasarela Externa")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTxForModal(null)}
                  className="rounded-xl font-bold text-xs"
                >
                  {t("common.close", "Cerrar")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

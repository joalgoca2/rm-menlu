"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";
import { PaginationControl } from "@/components/ui/pagination-control";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, CreditCard, User, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { PaginatedResult, BrandCustomerPayment } from "@/types";

interface BrandTransactionsTableProps {
  data: PaginatedResult<BrandCustomerPayment>;
}

export function BrandTransactionsTable({ data }: BrandTransactionsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";

  const updateQueryParams = (key: string, value: string) => {
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
    switch (status.toUpperCase()) {
      case "SUCCESS":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1 rounded-lg">
            <CheckCircle2 className="h-3 w-3" />
            <span>Exitoso</span>
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1 rounded-lg">
            <Clock className="h-3 w-3" />
            <span>Pendiente</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800 gap-1 rounded-lg">
            <AlertCircle className="h-3 w-3" />
            <span>Fallido</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            id="search-transactions-input"
            placeholder={t("brandAdminPayments.searchPlaceholder", "Buscar por cliente o concepto...")}
            defaultValue={currentSearch}
            onChange={(e) => updateQueryParams("search", e.target.value)}
            className="pl-9 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="filter-status-select" className="text-xs font-medium text-zinc-500">
            {t("brandAdminPayments.statusFilterLabel", "Estado:")}
          </label>
          <select
            id="filter-status-select"
            value={currentStatus}
            onChange={(e) => updateQueryParams("status", e.target.value)}
            className="text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">{t("brandAdminPayments.statusAll", "Todos los estados")}</option>
            <option value="SUCCESS">{t("brandAdminPayments.statusSuccess", "Exitoso")}</option>
            <option value="PENDING">{t("brandAdminPayments.statusPending", "Pendiente")}</option>
            <option value="FAILED">{t("brandAdminPayments.statusFailed", "Fallido")}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableRow>
              <TableHead className="text-xs font-bold">{t("brandAdminPayments.colCustomer", "Cliente")}</TableHead>
              <TableHead className="text-xs font-bold">{t("brandAdminPayments.colConcept", "Concepto")}</TableHead>
              <TableHead className="text-xs font-bold">{t("brandAdminPayments.colAmount", "Monto")}</TableHead>
              <TableHead className="text-xs font-bold">{t("brandAdminPayments.colGateway", "Pasarela")}</TableHead>
              <TableHead className="text-xs font-bold">{t("brandAdminPayments.colStatus", "Estado")}</TableHead>
              <TableHead className="text-xs font-bold text-right">{t("brandAdminPayments.colDate", "Fecha")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length > 0 ? (
              data.items.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {payment.customerName || "Cliente anónimo"}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {payment.customerEmail || "Sin email"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {payment.concept}
                  </TableCell>
                  <TableCell className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                    ${payment.amount} {payment.currency}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <CreditCard className="h-3 w-3 text-indigo-500" />
                      <span>{payment.gatewayProvider}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell className="text-xs text-right text-zinc-500 dark:text-zinc-400">
                    <FormattedDate date={payment.createdAt} format="datetime" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">
                  {t("brandAdminPayments.noTransactionsFound", "No se encontraron transacciones de cobro.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mandatory Always-Visible PaginationControl */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <PaginationControl
            currentPage={data.page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

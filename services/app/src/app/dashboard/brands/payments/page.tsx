import React from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBrandAdminPaymentsAction, getPublicBrandPortalAction } from "@/actions/brand-portal";
import { BrandPaymentStats } from "@/components/brand/brand-payment-stats";
import { BrandTransactionsTable } from "@/components/brand/brand-transactions-table";
import { BrandPlanManager } from "@/components/brand/brand-plan-manager";
import { CreditCard, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Cobros de Marca & Membresías | Dashboard",
  description: "Gestión de cobros a clientes finales, membresías y pasarelas de la marca.",
};

interface BrandPaymentsDashboardPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function BrandPaymentsDashboardPage({
  searchParams,
}: BrandPaymentsDashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const sParams = await searchParams;
  const page = sParams.page ? parseInt(sParams.page, 10) : 1;
  const limit = sParams.limit ? parseInt(sParams.limit, 10) : 10;
  const search = sParams.search || "";
  const status = sParams.status || "ALL";

  const res = await getBrandAdminPaymentsAction({
    page,
    limit,
    search,
    status,
  });

  if (!res.success || !res.data) {
    return (
      <div className="p-12 text-center rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 max-w-lg mx-auto mt-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-100">
          Acceso Restringido o Error
        </h2>
        <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
          {res.error || "No se pudo cargar la información de la marca."}
        </p>
      </div>
    );
  }

  const { payments, stats } = res.data;

  // Also fetch Brand Portal Data for plans & slug control
  const brandRes = await getPublicBrandPortalAction(payments.items[0]?.brandId || "brand-general");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Cobranza & Membresías de Marca</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Seguimiento de Cobros a Clientes
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Monitorea los ingresos recibidos por tus membresías, administra tarifas y audita
            transacciones.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <BrandPaymentStats stats={stats} />

      {/* Brand Plans & Portal Public Link Manager */}
      {brandRes.success && brandRes.data && (
        <BrandPlanManager brand={brandRes.data} />
      )}

      {/* Transactions Table with mandatory PaginationControl */}
      <div className="space-y-3 pt-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Historial Transaccional de Cobros
        </h3>
        <BrandTransactionsTable data={payments} />
      </div>
    </div>
  );
}

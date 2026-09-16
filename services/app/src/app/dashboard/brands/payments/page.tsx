import React from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getBrandAdminPaymentsAction, getPublicBrandPortalAction } from "@/actions/brand-portal";
import { BrandPaymentsHeader } from "@/components/brand/brand-payments-header";
import { BrandPaymentStats } from "@/components/brand/brand-payment-stats";
import { BrandTransactionsTable } from "@/components/brand/brand-transactions-table";
import { BrandPlanManager } from "@/components/brand/brand-plan-manager";
import { ShieldAlert } from "lucide-react";

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
    period?: "MONTH" | "QUARTER" | "YEAR" | "ALL";
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
  const period = sParams.period || "ALL";

  const res = await getBrandAdminPaymentsAction({
    page,
    limit,
    search,
    status,
    period,
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

  const { payments, stats, brandId } = res.data;

  // Also fetch Brand Portal Data for plans & brand name
  const targetBrandId = brandId || payments.items[0]?.brandId;
  const brandRes = targetBrandId
    ? await getPublicBrandPortalAction(targetBrandId)
    : { success: false, data: null };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <BrandPaymentsHeader />

      {/* KPI Stats Cards & Export Toolbar */}
      <BrandPaymentStats
        stats={stats}
        brandName={brandRes.data?.name}
        paymentsData={payments}
      />

      {/* Brand Plans & Portal Public Link Manager */}
      {brandRes.success && brandRes.data && (
        <BrandPlanManager brand={brandRes.data} />
      )}

      {/* Transactions Table with mandatory PaginationControl */}
      <BrandTransactionsTable data={payments} />
    </div>
  );
}

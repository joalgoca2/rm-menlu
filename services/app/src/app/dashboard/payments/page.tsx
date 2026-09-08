import React from "react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCustomerMemberDataAction } from "@/actions/brand-portal";
import { CustomerMemberPaymentsClient } from "@/components/payment/customer-member-payments-client";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Mis Membresías & Pagos | Dashboard",
  description: "Consulta tus membresías activas, realiza pagos de tu marca y revisa tu historial.",
};

export default async function CustomerMemberPaymentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const res = await getCustomerMemberDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="p-12 text-center rounded-3xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 max-w-lg mx-auto mt-12">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-rose-900 dark:text-rose-100">
          Error al cargar membresías
        </h2>
        <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
          {res.error || "No se pudieron obtener las membresías de la marca."}
        </p>
      </div>
    );
  }

  return <CustomerMemberPaymentsClient data={res.data} userSession={session.user} />;
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPaymentEngineMetricsAction,
  getPaymentTransactionsAction,
  getBrandPaymentConfigsListAction,
  getSaaSPlatformPaymentStatusAction,
  type PaymentEngineMetrics,
  type PaymentTransactionItem,
  type BrandPaymentConfigItem,
  type SaaSGatewayStatusItem,
} from "@/actions/payment-engine";
import { getBrandsList } from "@/actions/brand";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentTransactionsTable } from "@/components/payment/payment-transactions-table";
import { BrandPaymentConfigDialog } from "@/components/payment/brand-payment-config-dialog";
import { BrandPaymentConfigsContainer } from "@/components/payment/brand-payment-configs-container";
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  Building2,
  RefreshCw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface BrandOption {
  id: string;
  name: string;
}

export default function PaymentEnginePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("transactions");
  const [metrics, setMetrics] = useState<PaymentEngineMetrics | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransactionItem[]>([]);
  const [saasStatus, setSaasStatus] = useState<SaaSGatewayStatusItem[]>([]);
  const [configs, setConfigs] = useState<BrandPaymentConfigItem[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingTx, setLoadingTx] = useState<boolean>(true);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState<boolean>(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>(
    undefined
  );

  const currentPage = Number(searchParams.get("page") || "1");
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "ALL";
  const currentProvider = searchParams.get("provider") || "ALL";

  const fetchMetricsData = useCallback(async () => {
    const res = await getPaymentEngineMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
  }, []);

  const fetchSaaSStatusData = useCallback(async () => {
    const res = await getSaaSPlatformPaymentStatusAction();
    if (res.success && res.data) {
      setSaasStatus(res.data);
    }
  }, []);

  const fetchTransactionsData = useCallback(async () => {
    setLoadingTx(true);
    const res = await getPaymentTransactionsAction({
      page: currentPage,
      search: currentSearch,
      status: currentStatus,
      provider: currentProvider,
    });
    setLoadingTx(false);
    if (res.success && res.data) {
      setTransactions(res.data.transactions);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
  }, [currentPage, currentSearch, currentStatus, currentProvider]);

  const [configsTotal, setConfigsTotal] = useState(0);
  const [configsTotalPages, setConfigsTotalPages] = useState(1);
  const [configsPage, setConfigsPage] = useState(1);
  const [configsSearch, setConfigsSearch] = useState("");

  const fetchConfigsData = useCallback(async (page = 1, search = "") => {
    const res = await getBrandPaymentConfigsListAction({
      page,
      limit: 9,
      search,
    });
    if (res.success && res.data) {
      setConfigs(res.data.configs);
      setConfigsTotal(res.data.total);
      setConfigsTotalPages(res.data.totalPages);
      setConfigsPage(page);
      setConfigsSearch(search);
    } else if (!res.success && res.error) {
      toast.error(res.error);
    }
  }, []);

  const fetchBrandsData = useCallback(async () => {
    const res = await getBrandsList();
    if (res.success && Array.isArray(res.data)) {
      setBrands(res.data.map((b) => ({ id: b.id, name: b.name })));
    }
  }, []);

  useEffect(() => {
    fetchMetricsData();
    fetchSaaSStatusData();
    fetchConfigsData();
    fetchBrandsData();
  }, [fetchMetricsData, fetchSaaSStatusData, fetchConfigsData, fetchBrandsData]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  const handleRefreshAll = () => {
    fetchMetricsData();
    fetchSaaSStatusData();
    fetchTransactionsData();
    fetchConfigsData();
    toast.success(
      t("paymentEngine.refreshed", "Datos del motor de pagos actualizados")
    );
  };

  const handleOpenConfigModal = (brandId?: string) => {
    setSelectedBrandId(brandId);
    setIsConfigDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>
              {t(
                "paymentEngineDetails.title",
                "Motor Polimórfico de Pagos & Membresías"
              )}
            </span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t(
              "paymentEngineDetails.subtitle",
              "Gestión de pasarelas del SaaS, llaves por marca cliente e historial de transacciones"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            className="text-xs font-semibold gap-2 rounded-xl h-10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("paymentEngineDetails.refreshBtn", "Actualizar Datos")}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("paymentEngineDetails.metricVolume", "Volumen Procesado")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              ${(metrics?.totalVolume ?? 0).toLocaleString()} MXN
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("paymentEngineDetails.metricVolumeSub", "Transacciones completadas")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("paymentEngineDetails.metricTotalTx", "Transacciones Totales")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {metrics?.totalTransactions ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("paymentEngineDetails.metricTotalTxSub", "Historial de checkout")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("paymentEngineDetails.metricSuccessTx", "Pagos Exitosos")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {metrics?.completedCount ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("paymentEngineDetails.metricPendingCount", "Pendientes:")}{" "}
              <span className="font-bold text-amber-500">
                {metrics?.pendingCount ?? 0}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t("paymentEngineDetails.activeGateways", "Pasarelas Clientes")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
              {metrics?.activeGatewaysCount ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("paymentEngineDetails.activeGatewaysSub", "Marcas inquilinas configuradas")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <TabsTrigger value="transactions" className="gap-2 text-xs font-bold">
            <Receipt className="h-4 w-4" />
            <span>{t("paymentEngineDetails.tabTransactions", "Transacciones")}</span>
          </TabsTrigger>

          <TabsTrigger value="saas" className="gap-2 text-xs font-bold">
            <Globe className="h-4 w-4" />
            <span>{t("paymentEngineDetails.tabSaas", "Pasarelas SaaS (.env)")}</span>
          </TabsTrigger>

          <TabsTrigger value="gateways" className="gap-2 text-xs font-bold">
            <Building2 className="h-4 w-4" />
            <span>{t("paymentEngineDetails.tabGateways", "Pasarelas Inquilinas")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Transactions Table */}
        <TabsContent value="transactions" className="mt-6">
          <PaymentTransactionsTable
            transactions={transactions}
            total={total}
            currentPage={currentPage}
            totalPages={totalPages}
            isLoading={loadingTx}
          />
        </TabsContent>

        {/* Tab 2: SaaS Platform Global Gateways (.env Status) */}
        <TabsContent value="saas" className="mt-6 space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
            <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                {t("paymentEngineDetails.saasBannerTitle", "Pasarela Global del SaaS (Cobro de Membresías del Sistema)")}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {t("paymentEngineDetails.saasBannerDesc", "Esta sección refleja el estado de las claves del sistema definidas directamente en las variables de entorno de tu servidor (.env y docker-compose.yml). El sistema utiliza estas credenciales para cobrar la suscripción de $10 MXN/mes a las marcas cliente.")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {saasStatus.map((s) => (
              <div
                key={s.provider}
                className="p-6 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-sm space-y-5 hover:shadow-md hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                    {s.provider}
                  </span>
                  {s.isConfigured ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {t("paymentEngineDetails.saasConfigured", "Configurado (.env)")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {t("paymentEngineDetails.saasNotConfigured", "Sin Configurar")}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>{t("paymentEngineDetails.saasPublicKeyLabel", "Clave Pública:")}</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-[11px]">
                      {s.publicKeyPreview === "NOT_CONFIGURED" || s.publicKeyPreview === "Sin configurar"
                        ? t("paymentEngineDetails.saasNotConfigured", "Sin configurar")
                        : s.publicKeyPreview === "SANDBOX_ENV" || s.publicKeyPreview === "Entorno Sandbox / Test"
                        ? t("paymentEngineDetails.saasSandboxEnv", "Entorno Sandbox / Test")
                        : s.publicKeyPreview}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-500">
                    <span>{t("paymentEngineDetails.saasSecretKeyLabel", "Secret Key:")}</span>
                    {s.secretKeySet ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {t("paymentEngineDetails.saasConfigured", "Configurado (.env)")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">
                        {t("paymentEngineDetails.saasUndefined", "No definida")}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-zinc-500">
                    <span>{t("paymentEngineDetails.saasWebhookSecretLabel", "Firma Webhook:")}</span>
                    {s.webhookSecretSet ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {t("paymentEngineDetails.saasRegistered", "Registrada")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">
                        {t("paymentEngineDetails.saasNotRegistered", "Sin firma")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Configured Gateways by Tenant Brands */}
        <TabsContent value="gateways" className="mt-6">
          <BrandPaymentConfigsContainer
            configs={configs}
            total={configsTotal}
            currentPage={configsPage}
            totalPages={configsTotalPages}
            currentSearch={configsSearch}
            onSearchSubmit={(query) => fetchConfigsData(1, query)}
            onPageChange={(page) => fetchConfigsData(page, configsSearch)}
            onOpenConfigModal={handleOpenConfigModal}
          />
        </TabsContent>
      </Tabs>

      {/* Brand Payment Config Modal for Tenant Brands */}
      <BrandPaymentConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        onSuccess={() => {
          fetchConfigsData();
          fetchMetricsData();
        }}
        brands={brands}
        initialBrandId={selectedBrandId}
        isSuperAdmin={true}
      />
    </div>
  );
}

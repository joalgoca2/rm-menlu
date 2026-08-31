"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  X,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  ShieldAlert,
  Loader2,
  Layers,
  Search,
  FolderKanban,
  FileSpreadsheet,
  Headphones,
  Zap,
  Server,
  Code2,
  Bell,
  Coins,
} from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { formatConvertedPrice } from "@/lib/currency";
import {
  getPlanConfigs,
  createPlanConfig,
  updatePlanConfig,
  deletePlanConfig,
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
} from "@/actions/billing";
import {
  getAvailableSaaSGatewaysAction,
  createBrandCheckoutSessionAction,
} from "@/actions/payment-engine";
import { PaymentGatewaySelectModal } from "@/components/payment/payment-gateway-select-modal";
import type { PaymentGatewayType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ExchangeRate, PlanConfig } from "@/types";

const CORE_PLANS = ["Free", "Pro", "Enterprise"];

function _BoolBadge({ value }: { value: boolean }) {
  const { t } = useTranslation();
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
      <Check className="h-3.5 w-3.5" />
      <span>{t("billing.enabled", "Habilitado")}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
      <X className="h-3.5 w-3.5" />
      <span>{t("billing.disabled", "Deshabilitado")}</span>
    </span>
  );
}

function PlanConfigCard({
  plan,
  onEdit,
  onDelete,
  onCheckout,
  showPayButton = false,
}: {
  plan: PlanConfig;
  onEdit: (plan: PlanConfig) => void;
  onDelete: (id: string) => void;
  onCheckout: (plan: PlanConfig) => void;
  showPayButton?: boolean;
}) {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const isCorePlan = CORE_PLANS.includes(plan.planName);

  const userTimezone = (session?.user as { timezone?: string } | undefined)?.timezone;
  const monthlyPriceInfo = formatConvertedPrice(
    plan.priceMonthly,
    locale,
    userTimezone
  );

  const getBadgeStyle = (name: string) => {
    if (name === "Enterprise") {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (name === "Pro") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  };

  const getBadgeLabel = (name: string) => {
    if (name === "Enterprise") return t("billing.enterpriseBadge", "Empresarial");
    if (name === "Pro") return t("billing.popularBadge", "Popular / Recomendado");
    if (name === "Free") return t("billing.freeBadge", "Plan Gratuito");
    return t("billing.customBadge", "Personalizado");
  };

  return (
    <Card
      className={
        "border border-zinc-200/80 dark:border-zinc-800/60 rounded-3xl " +
        "overflow-hidden flex flex-col justify-between hover:shadow-lg " +
        "transition-all duration-300 bg-white/90 dark:bg-zinc-900/60 backdrop-blur"
      }
    >
      <CardContent className="p-6 flex flex-col justify-between h-full space-y-6">
        <div>
          <div className="flex justify-between items-start mb-4">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg",
                getBadgeStyle(plan.planName)
              )}
            >
              {getBadgeLabel(plan.planName)}
            </Badge>
            <div className="text-right">
              <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                {monthlyPriceInfo.usdFormatted}
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-bold mt-0.5 font-mono">
                {monthlyPriceInfo.convertedFormatted
                  ? `(~${monthlyPriceInfo.convertedFormatted})`
                  : t("billing.monthlyPrice", "USD / mes")}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-black uppercase text-zinc-900 dark:text-white tracking-tight mb-4">
            {plan.planName}
          </h3>

          <div className="space-y-3.5 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t("billing.projectLimit", "Límite de Proyectos")}</span>
              </span>
              <span className="text-zinc-900 dark:text-white font-extrabold font-mono">
                {plan.maxProjects === 999999
                  ? t("billing.unlimited", "Ilimitados")
                  : `${plan.maxProjects} ${t("billing.projects", "Proyectos")}`}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{t("billing.csvImportExport", "CSV Import / Export")}</span>
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-bold rounded px-1.5 py-0.2",
                  plan.allowCSVImportExport
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                )}
              >
                {plan.allowCSVImportExport
                  ? t("billing.included", "Incluido")
                  : t("billing.notIncluded", "No")}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>{t("billing.liveSupport", "Soporte en Vivo")}</span>
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-bold rounded px-1.5 py-0.2",
                  plan.hasLiveSupport
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700"
                )}
              >
                {plan.hasLiveSupport
                  ? t("billing.included", "Incluido")
                  : t("billing.notIncluded", "No")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          {showPayButton && (
            <Button
              onClick={() => onCheckout(plan)}
              className="w-full rounded-xl font-bold gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{t("billing.payPlan", "Suscribirse / Pagar")}</span>
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit(plan)}
              className="flex-1 rounded-xl font-bold gap-1.5 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>{t("billing.editPlan", "Editar")}</span>
            </Button>
            {!isCorePlan && (
              <Button
                variant="outline"
                onClick={() => onDelete(plan.id)}
                className="rounded-xl font-bold gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{t("billing.deletePlan", "Eliminar")}</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormToggleRow({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-100/80 border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full " +
            "border-2 border-transparent transition-colors duration-200 ease-in-out",
          checked ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-800"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full " +
              "bg-white shadow transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function PlanManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const currentSearch = searchParams.get("search") ?? "";

  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Exchange Rates State
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [_ratesTotal, setRatesTotal] = useState(0);
  const [ratesTotalPages, setRatesTotalPages] = useState(1);
  const [isRatesLoading, setIsRatesLoading] = useState(true);

  // Exchange Rate Modal States
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [deletingRateId, setDeletingRateId] = useState<string | null>(null);

  // Exchange Rate Form States
  const [formRateCode, setFormRateCode] = useState("");
  const [formRateName, setFormRateName] = useState("");
  const [formRateSymbol, setFormRateSymbol] = useState("$");
  const [formRateValue, setFormRateValue] = useState(1.0);

  // Local input state for smooth typing before explicit search submit
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPriceMonthly, setFormPriceMonthly] = useState(0);
  const [formPriceYearly, setFormPriceYearly] = useState(0);
  const [formMaxProjects, setFormMaxProjects] = useState(3);
  const [formAllowCSV, setFormAllowCSV] = useState(false);
  const [formHasLiveSupport, setFormHasLiveSupport] = useState(false);

  // Helper to update URL search parameters
  const updateUrlParams = useCallback(
    (updates: { page?: number; search?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page <= 1) params.delete("page");
        else params.set("page", updates.page.toString());
      }

      if (updates.search !== undefined) {
        if (!updates.search.trim()) params.delete("search");
        else params.set("search", updates.search.trim());
      }

      const queryString = params.toString();
      const newPath = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(newPath);
    },
    [pathname, router, searchParams]
  );

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPlanConfigs({
        page: currentPage,
        limit: 10,
        search: currentSearch || undefined,
      });
      if (res.success && res.data) {
        setPlans(res.data.plans);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudieron cargar los planes."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error de servidor al consultar los planes."));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentSearch, t]);

  const fetchRates = useCallback(async () => {
    setIsRatesLoading(true);
    try {
      const res = await getExchangeRates({
        page: currentPage,
        limit: 10,
        search: currentSearch || undefined,
      });
      if (res.success && res.data) {
        setRates(res.data.rates);
        setRatesTotal(res.data.total);
        setRatesTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error ?? "No se pudieron cargar los tipos de cambio.");
      }
    } catch (_error: unknown) {
      toast.error("Error al cargar los tipos de cambio.");
    } finally {
      setIsRatesLoading(false);
    }
  }, [currentPage, currentSearch]);

  useEffect(() => {
    fetchPlans();
    fetchRates();
  }, [fetchPlans, fetchRates]);

  const handleOpenCreateRate = () => {
    setEditingRate(null);
    setFormRateCode("");
    setFormRateName("");
    setFormRateSymbol("$");
    setFormRateValue(1.0);
    setIsRateModalOpen(true);
  };

  const handleOpenEditRate = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setFormRateCode(rate.code);
    setFormRateName(rate.name);
    setFormRateSymbol(rate.symbol);
    setFormRateValue(rate.rateAgainstUsd);
    setIsRateModalOpen(true);
  };

  const handleCreateOrUpdateRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        code: formRateCode,
        name: formRateName,
        symbol: formRateSymbol,
        rateAgainstUsd: Number(formRateValue),
        isDefault: formRateCode.toUpperCase() === "USD",
      };

      let res;
      if (editingRate) {
        res = await updateExchangeRate(editingRate.id, payload);
      } else {
        res = await createExchangeRate(payload);
      }

      if (res.success) {
        toast.success(
          editingRate
            ? "¡Tipo de cambio actualizado!"
            : "¡Nueva divisa registrada!"
        );
        setIsRateModalOpen(false);
        fetchRates();
      } else {
        toast.error(res.error ?? "No se pudo guardar la divisa.");
      }
    } catch (_error: unknown) {
      toast.error("Error al guardar la divisa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRateConfirm = async () => {
    if (!deletingRateId) return;
    setIsSubmitting(true);
    try {
      const res = await deleteExchangeRate(deletingRateId);
      if (res.success) {
        toast.success("Divisa eliminada del catálogo.");
        setDeletingRateId(null);
        fetchRates();
      } else {
        toast.error(res.error ?? "No se pudo eliminar la divisa.");
      }
    } catch (_error: unknown) {
      toast.error("Error al eliminar la divisa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mock checkout redirection completion (Runs ONLY ONCE per redirect)
  useEffect(() => {
    const mockStatus = searchParams.get("mock_checkout");
    const planName = searchParams.get("plan");

    if (mockStatus === "success" && planName) {
      // 1. Immediately purge mock_checkout & plan from URL to break re-trigger loop
      const params = new URLSearchParams(searchParams.toString());
      params.delete("mock_checkout");
      params.delete("plan");
      const cleanPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(cleanPath);

      // 2. Fire mock webhook route once
      toast.loading("Procesando pago simulado...");
      fetch("/api/webhooks/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName,
          amount: 19.0,
          billingCycle: "MONTHLY",
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          toast.dismiss();
          if (data.success) {
            toast.success(
              `¡Pago simulado de ${planName} completado exitosamente!`
            );
            fetchPlans();
          } else {
            toast.error(data.error ?? "Error al procesar pago simulado.");
          }
        })
        .catch(() => {
          toast.dismiss();
          toast.error("Error al procesar pago de prueba.");
        });
    }
  }, [searchParams, pathname, router, fetchPlans]);

  const { data: session } = useSession();

  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState<boolean>(false);
  const [availableSaaSGateways, setAvailableSaaSGateways] = useState<
    { provider: PaymentGatewayType; name: string }[]
  >([]);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<PlanConfig | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  const executeCheckoutWithGateway = async (
    plan: PlanConfig,
    gateway: PaymentGatewayType
  ) => {
    try {
      setCheckoutLoading(true);
      toast.loading("Generando sesión de checkout...");

      const res = await createBrandCheckoutSessionAction({
        ownerId: session?.user?.id ?? "usr_admin_default",
        brandId: (session?.user as { brandId?: string })?.brandId || "brand-general",
        amount: plan.priceMonthly,
        currency: "MXN",
        description: `Suscripción al Plan ${plan.planName}`,
        customerEmail: session?.user?.email ?? "admin@remotemonkeys.ai",
        returnUrl: `${window.location.origin}/dashboard/billing?mock_checkout=success&plan=${encodeURIComponent(plan.planName)}`,
        cancelUrl: `${window.location.origin}/dashboard/billing?mock_checkout=cancel`,
        gatewayType: gateway,
        metadata: {
          planName: plan.planName,
          userId: session?.user?.id ?? "",
        },
      });

      toast.dismiss();
      setCheckoutLoading(false);
      setIsGatewayModalOpen(false);

      if (res.success && res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error(res.error ?? "Error al generar la sesión de checkout.");
      }
    } catch (_err: unknown) {
      toast.dismiss();
      setCheckoutLoading(false);
      toast.error("Error inesperado al conectar con la pasarela.");
    }
  };

  const handleCheckout = async (plan: PlanConfig) => {
    setSelectedCheckoutPlan(plan);
    const res = await getAvailableSaaSGatewaysAction();

    const gateways =
      res.success && res.data && res.data.length > 0
        ? res.data
        : [{ provider: "MOCK" as PaymentGatewayType, name: "Proveedor Simulado (Mock)" }];

    setAvailableSaaSGateways(gateways);

    if (gateways.length === 1) {
      executeCheckoutWithGateway(plan, gateways[0].provider);
    } else {
      setIsGatewayModalOpen(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ search: searchInput, page: 1 });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateUrlParams({ search: "", page: 1 });
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormName("");
    setFormPriceMonthly(0);
    setFormPriceYearly(0);
    setFormMaxProjects(3);
    setFormAllowCSV(false);
    setFormHasLiveSupport(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setFormName(plan.planName);
    setFormPriceMonthly(plan.priceMonthly);
    setFormPriceYearly(plan.priceYearly);
    setFormMaxProjects(plan.maxProjects);
    setFormAllowCSV(plan.allowCSVImportExport);
    setFormHasLiveSupport(plan.hasLiveSupport);
    setIsModalOpen(true);
  };

  const handleCreateOrUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        planName: formName,
        priceMonthly: Number(formPriceMonthly),
        priceYearly: Number(formPriceYearly),
        maxProjects: Number(formMaxProjects),
        allowCSVImportExport: formAllowCSV,
        hasLiveSupport: formHasLiveSupport,
      };

      let res;
      if (editingPlan) {
        res = await updatePlanConfig(editingPlan.id, payload);
      } else {
        res = await createPlanConfig(payload);
      }

      if (res.success) {
        toast.success(
          editingPlan
            ? t("toasts.planUpdated", "¡Plan actualizado exitosamente!")
            : t("toasts.planCreated", "¡Plan creado exitosamente!")
        );
        setIsModalOpen(false);
        fetchPlans();
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo guardar el plan."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error inesperado al guardar el plan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlanId) return;
    setIsSubmitting(true);
    try {
      const res = await deletePlanConfig(deletingPlanId);
      if (res.success) {
        toast.success(t("toasts.planDeleted", "Plan eliminado del catálogo."));
        setDeletingPlanId(null);
        fetchPlans();
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo eliminar el plan."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al eliminar el plan."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span>{t("billing.title", "Planes de Cobro y Precios")}</span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {t(
              "billing.subtitle",
              "Administra las tarifas, límites de proyectos y características de cada paquete"
            )}
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 rounded-2xl font-bold px-5 py-2.5">
          <Plus className="h-4 w-4" />
          <span>{t("billing.newPlan", "Nuevo Plan")}</span>
        </Button>
      </div>

      {/* Navigation Tabs */}
      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <TabsTrigger value="catalog" className="gap-2 text-xs font-bold">
            <CreditCard className="h-4 w-4" />
            <span>{t("billing.catalogTab", "Catálogo de Planes")}</span>
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-2 text-xs font-bold">
            <Coins className="h-4 w-4" />
            <span>{t("billing.ratesTab", "Tipos de Cambio")}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs font-bold">
            <Bell className="h-4 w-4" />
            <span>{t("billing.webhookEventsTab", "Notificaciones de Cobro")}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CATALOG, SEARCH & PAGINATION */}
        <TabsContent value="catalog" className="space-y-6">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("billing.totalPlans", "Total de Planes")}
                </CardTitle>
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">{total}</div>
                <p className="text-xs text-zinc-500 mt-1">
                  {t("billing.activePlansInCatalog", "Planes activos en catálogo")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("billing.basePlans", "Planes Base del Sistema")}
                </CardTitle>
                <ShieldAlert className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                  {plans.filter((p) => CORE_PLANS.includes(p.planName)).length}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {t("billing.basePlansDesc", "Free, Pro y Enterprise protegidos")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {t("billing.currency", "Moneda de Facturación")}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">USD ($)</div>
                <p className="text-xs text-zinc-500 mt-1">
                  {t("billing.currencyDesc", "USD ($) con conversión dinámica a divisa local")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Toolbar & Filter */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t("billing.filterPlaceholder", "Filtrar planes por nombre (ej. Pro, Enterprise...)")}
                className="pl-10 h-10 w-full rounded-xl"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button type="submit" variant="secondary" className="gap-2 h-10 px-5 rounded-xl font-bold flex-1 sm:flex-none">
                <Search className="h-4 w-4" />
                <span>{t("common.search", "Buscar")}</span>
              </Button>
              {(currentSearch || searchInput) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                  className="gap-1.5 h-10 px-4 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4" />
                  <span>{t("common.clear", "Limpiar")}</span>
                </Button>
              )}
            </div>
          </form>

          {/* Pricing Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={`card-skel-${i}`} className="h-72 w-full rounded-3xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center p-12 text-zinc-500 font-semibold italic bg-white/90 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
              {t("billing.noPlansFound", "No hay planes de cobro registrados.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanConfigCard
                  key={plan.id}
                  plan={plan}
                  onEdit={handleOpenEdit}
                  onDelete={(id) => setDeletingPlanId(id)}
                  onCheckout={handleCheckout}
                  showPayButton={false}
                />
              ))}
            </div>
          )}

          {/* Server-Side Synchronized Pagination Control */}
          <div className="p-4 rounded-xl border border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
            <PaginationControl
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(newPage) => updateUrlParams({ page: newPage })}
            />
          </div>
        </TabsContent>

        {/* TAB 2: CURRENCY & EXCHANGE RATES CRUD */}
        <TabsContent value="rates" className="space-y-6">
          <Card
            className={
              "border-zinc-200/80 dark:border-zinc-800/60 bg-white/90 " +
              "dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 shadow-md " +
              "overflow-hidden rounded-2xl p-6 space-y-6"
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {t("billing.ratesTitle", "Gestión de Monedas y Tipos de Cambio")}
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t(
                    "billing.ratesSubtitle",
                    "Configura la tasa de conversión numérica frente a la divisa base USD ($)"
                  )}
                </p>
              </div>
              <Button
                onClick={handleOpenCreateRate}
                className="gap-2 shrink-0 rounded-2xl font-bold px-4 py-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>{t("billing.newRate", "Nueva Divisa")}</span>
              </Button>
            </div>

            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("billing.colCode", "Código ISO")}</TableHead>
                    <TableHead>{t("billing.colName", "Nombre de la Moneda")}</TableHead>
                    <TableHead>{t("billing.colSymbol", "Símbolo")}</TableHead>
                    <TableHead>
                      {t("billing.colRate", "Tasa vs USD (1 USD = X)")}
                    </TableHead>
                    <TableHead>{t("billing.colDefault", "Moneda Base")}</TableHead>
                    <TableHead className="text-right">
                      {t("users.actionsCol", "Acciones")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isRatesLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`rate-skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : rates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                        No hay tipos de cambio registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-bold text-zinc-900 dark:text-white">
                          {r.code}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
                          {r.name}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {r.symbol}
                        </TableCell>
                        <TableCell className="font-mono font-extrabold text-zinc-900 dark:text-white">
                          1 USD = {r.rateAgainstUsd} {r.code}
                        </TableCell>
                        <TableCell>
                          {r.isDefault ? (
                            <Badge
                              className={
                                "bg-emerald-500/10 text-emerald-700 " +
                                "dark:text-emerald-300 border-emerald-500/20 text-[10px]"
                              }
                            >
                              Base (USD)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Secundaria
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                              onClick={() => handleOpenEditRate(r)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {r.code !== "USD" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                                onClick={() => setDeletingRateId(r.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="p-4 rounded-xl border border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={ratesTotalPages}
                  onPageChange={(p) => updateUrlParams({ page: p })}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: BILLING NOTIFICATIONS & INFRASTRUCTURE */}
        <TabsContent value="notifications" className="space-y-6">
          <Card
            className={
              "border-zinc-200/80 dark:border-zinc-800/60 bg-white/90 " +
              "dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 shadow-md " +
              "overflow-hidden rounded-2xl"
            }
          >
            <CardHeader>
              <CardTitle
                className={
                  "text-base font-bold text-zinc-900 dark:text-white flex " +
                  "items-center justify-between"
                }
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {t(
                      "billing.webhookBannerTitle",
                      "Infraestructura & Webhook Global de Cobros del SaaS"
                    )}
                  </span>
                </span>
                <Badge
                  className={
                    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 " +
                    "border-emerald-500/20 text-[10px]"
                  }
                >
                  {t("billing.globalSystemBadge", "Sistema Global")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div
                className={
                  "grid grid-cols-1 sm:grid-cols-2 gap-4 border-b " +
                  "border-zinc-200/80 dark:border-zinc-800/80 pb-4"
                }
              >
                <div>
                  <span
                    className={
                      "text-[10px] text-zinc-500 dark:text-zinc-400 " +
                      "uppercase font-bold block"
                    }
                  >
                    {t("billing.activeGatewayEngine", "Motor de Pasarela Activo")}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span
                      className={
                        "font-mono font-bold text-zinc-900 dark:text-white text-sm"
                      }
                    >
                      {t("billing.mockEngineTitle", "MockProvider (Modo Desarrollo / Agnóstico)")}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("billing.mockEngineDesc", "Configurado mediante PAYMENT_PROVIDER=mock en .env.")}
                  </p>
                </div>

                <div>
                  <span
                    className={
                      "text-[10px] text-zinc-500 dark:text-zinc-400 " +
                      "uppercase font-bold block"
                    }
                  >
                    {t("billing.outboundWebhookLabel", "Webhook de Notificación Saliente (N8N_BILLING_URL)")}
                  </span>
                  <div
                    className={
                      "p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl border " +
                      "border-zinc-200/80 dark:border-zinc-800/80 font-mono " +
                      "text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 truncate"
                    }
                  >
                    {t("billing.n8nEnvValue", "N8N_BILLING_URL (en .env)")}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("billing.n8nDesc", "Notifica automáticamente a n8n cuando ocurren pagos o altas de suscripciones.")}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span
                  className={
                    "text-[11px] font-bold text-zinc-700 dark:text-zinc-300 " +
                    "flex items-center gap-1.5"
                  }
                >
                  <Code2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {t("billing.jsonPayloadTitle", "Estructura JSON Saliente de Evento de Pago (payment.success)")}
                  </span>
                </span>
                <pre
                  className={
                    "p-3 bg-zinc-50 dark:bg-zinc-950 text-emerald-600 " +
                    "dark:text-emerald-400 rounded-xl text-[11px] font-mono " +
                    "overflow-x-auto border border-zinc-200/80 dark:border-zinc-800/80"
                  }
                >
{`{
  "event": "payment.success",
  "timestamp": "2026-08-12T12:00:00.000Z",
  "data": {
    "paymentId": "pay_123456",
    "subscriptionId": "sub_7890",
    "userId": "usr_abc123",
    "planName": "Pro",
    "amount": 19.00,
    "billingCycle": "MONTHLY",
    "paidAtUtc": "2026-08-12T12:00:00.000Z"
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingPlan
                ? `${t("billing.editModalTitle", "Editar Plan")}: ${editingPlan.planName}`
                : t("billing.createModalTitle", "Nuevo Plan de Precios")}
            </DialogTitle>
            <DialogDescription>
              {t("billing.modalSub", "Configura los valores de cobro, límites operativos y características")}
            </DialogDescription>
          </DialogHeader>

          {editingPlan && CORE_PLANS.includes(editingPlan.planName) && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-xl">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {t(
                  "billing.basePlanNotice",
                  "Este es un plan base del sistema. Puedes ajustar sus tarifas y límites, pero su nombre no se puede modificar ni eliminar."
                )}
              </span>
            </div>
          )}

          <form onSubmit={handleCreateOrUpdateSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name-input">{t("billing.planNameLabel", "Nombre del Plan")}</Label>
              <Input
                id="plan-name-input"
                value={formName}
                disabled={Boolean(editingPlan && CORE_PLANS.includes(editingPlan.planName))}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. Pro, Premium, Enterprise..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price-monthly">{t("billing.monthlyPriceLabel", "Precio Mensual (USD)")}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="price-monthly"
                    type="number"
                    min={0}
                    step={0.01}
                    className="pl-9"
                    value={formPriceMonthly}
                    onChange={(e) => setFormPriceMonthly(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-yearly">{t("billing.yearlyPriceLabel", "Precio Anual (USD)")}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="price-yearly"
                    type="number"
                    min={0}
                    step={0.01}
                    className="pl-9"
                    value={formPriceYearly}
                    onChange={(e) => setFormPriceYearly(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-projects">{t("billing.maxProjectsLabel", "Límite de Proyectos Permitidos")}</Label>
              <div className="relative">
                <FolderKanban className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  id="max-projects"
                  type="number"
                  min={1}
                  className="pl-9"
                  value={formMaxProjects}
                  onChange={(e) => setFormMaxProjects(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs uppercase tracking-wider text-zinc-400 block font-bold">
                {t("billing.featuresIncluded", "Características Incluidas")}
              </Label>

              <FormToggleRow
                label={t("billing.csvFeatureTitle", "Importación / Exportación CSV")}
                description={t("billing.csvFeatureDesc", "Habilita la descarga y subida de datos en formato CSV")}
                checked={formAllowCSV}
                onChange={setFormAllowCSV}
                icon={FileSpreadsheet}
              />

              <FormToggleRow
                label={t("billing.supportFeatureTitle", "Soporte Técnico en Vivo")}
                description={t("billing.supportFeatureDesc", "Acceso a atención prioritaria y asesoría directa")}
                checked={formHasLiveSupport}
                onChange={setFormHasLiveSupport}
                icon={Headphones}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("billing.saveChanges", "Guardar Cambios")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingPlanId)}
        onOpenChange={(open) => !open && setDeletingPlanId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("billing.confirmDeleteTitle", "¿Confirmar eliminación de plan?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "billing.confirmDeleteDesc",
                "Esta acción es irreversible y removerá el paquete de precios del catálogo."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-rose-600 hover:bg-rose-700 font-bold">
              {t("billing.confirmDeleteBtn", "Confirmar Eliminación")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit Exchange Rate Modal */}
      <Dialog open={isRateModalOpen} onOpenChange={setIsRateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingRate
                ? `${t("billing.editRateTitle", "Editar Divisa")}: ${editingRate.code}`
                : t("billing.createRateTitle", "Registrar Nueva Divisa")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "billing.ratesSubtitle",
                "Configura la tasa de conversión numérica frente a la divisa base USD ($)"
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdateRateSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rate-code">
                {t("billing.codeLabel", "Código ISO (ej. MXN, EUR, BRL)")}
              </Label>
              <Input
                id="rate-code"
                value={formRateCode}
                disabled={Boolean(editingRate && editingRate.code === "USD")}
                onChange={(e) => setFormRateCode(e.target.value.toUpperCase())}
                placeholder="Ej. MXN, EUR, BRL..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-name">
                {t("billing.nameLabel", "Nombre de la Moneda")}
              </Label>
              <Input
                id="rate-name"
                value={formRateName}
                onChange={(e) => setFormRateName(e.target.value)}
                placeholder="Ej. Peso Mexicano, Euro..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rate-symbol">
                  {t("billing.symbolLabel", "Símbolo (ej. $, €, R$)")}
                </Label>
                <Input
                  id="rate-symbol"
                  value={formRateSymbol}
                  onChange={(e) => setFormRateSymbol(e.target.value)}
                  placeholder="Ej. $, €, R$..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-value">
                  {t("billing.rateLabel", "Tipo de Cambio vs 1.00 USD")}
                </Label>
                <Input
                  id="rate-value"
                  type="number"
                  min={0.0001}
                  step={0.0001}
                  value={formRateValue}
                  onChange={(e) => setFormRateValue(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRateModalOpen(false)}
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("billing.saveChanges", "Guardar Cambios")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Rate Confirmation Dialog */}
      <AlertDialog
        open={Boolean(deletingRateId)}
        onOpenChange={(open) => !open && setDeletingRateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("billing.confirmDeleteRateTitle", "¿Confirmar eliminación de divisa?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "billing.confirmDeleteRateDesc",
                "Esta divisa ya no estará disponible para conversiones dinámicas."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRateConfirm}
              className="bg-rose-600 hover:bg-rose-700 font-bold"
            >
              {t("billing.confirmDeleteBtn", "Confirmar Eliminación")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SaaS Multi-Gateway Selection Modal */}
      {selectedCheckoutPlan && (
        <PaymentGatewaySelectModal
          isOpen={isGatewayModalOpen}
          onClose={() => setIsGatewayModalOpen(false)}
          onSelect={(gateway) =>
            executeCheckoutWithGateway(selectedCheckoutPlan, gateway)
          }
          availableGateways={availableSaaSGateways}
          planName={selectedCheckoutPlan.planName}
          amount={selectedCheckoutPlan.priceMonthly}
          loading={checkoutLoading}
        />
      )}
    </div>
  );
}

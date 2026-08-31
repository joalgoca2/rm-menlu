"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  User as UserIcon,
  Shield,
  Building2,
  Lock,
  Save,
  Info,
  Loader2,
  Globe,
  Clock,
  Key,
  Sparkles,
  CreditCard,
  History,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { ThemeStyleSelector } from "@/components/layout/theme-style-selector";
import { LanguageSelector } from "@/components/layout/language-selector";
import { SecurityPinForm } from "@/components/profile/security-pin-form";
import { BrandPaymentConfigDialog } from "@/components/payment/brand-payment-config-dialog";
import { BrandPaymentsHistoryTable } from "@/components/brand/brand-payments-history-table";
import { BrandPaymentGatewaysList } from "@/components/payment/brand-payment-gateways-list";
import { FormattedDate } from "@/components/ui/formatted-date";
import {
  getUserById,
  updateUserPreferences,
  changePassword,
} from "@/actions/auth";
import {
  FolderKanban,
  FileSpreadsheet,
  Headphones,
  Zap,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatConvertedPrice } from "@/lib/currency";
import { getBrandById, updateBrandSettings } from "@/actions/brand";
import {
  getPlanConfigs,
  getBrandActiveSubscriptionAction,
  switchBrandSubscriptionPlanAction,
  cancelScheduledBrandDowngradeAction,
} from "@/actions/billing";
import {
  getAvailableSaaSGatewaysAction,
  createBrandCheckoutSessionAction,
} from "@/actions/payment-engine";
import { PaymentGatewaySelectModal } from "@/components/payment/payment-gateway-select-modal";
import type { PaymentGatewayType, PlanConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: session, update: updateSession } = useSession();
  const sessionUser = session?.user;
  const userRoles = (sessionUser as { roles?: string[] } | undefined)?.roles ?? [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
  const isBrandAdmin = userRoles.includes("ADMIN") && !isSuperAdmin;

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // User Profile Form state
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userBio, setUserBio] = useState("");
  const [_userLocale, setUserLocale] = useState("es");
  const [userTimezone, setUserTimezone] = useState("UTC");

  // Security Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Brand / Organization Form state
  const [brandId, setBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [brandLocale, setBrandLocale] = useState("es");
  const [brandTimezone, setBrandTimezone] = useState("UTC");
  const [currentPlanName, setCurrentPlanName] = useState("Plan Gratuito / Base");
  const [scheduledPlanName, setScheduledPlanName] = useState<string | null>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  // SaaS Subscription Plans & Checkout state
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [availableSaaSGateways, setAvailableSaaSGateways] = useState<
    { provider: PaymentGatewayType; name: string }[]
  >([]);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<PlanConfig | null>(null);
  const [downgradeTargetPlan, setDowngradeTargetPlan] = useState<PlanConfig | null>(null);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);
  const [paymentsSubTab, setPaymentsSubTab] = useState<"plans" | "history" | "gateway">("plans");

  const handleConfirmDowngrade = async () => {
    if (!downgradeTargetPlan || !sessionUser?.id || !brandId) return;
    setIsDowngrading(true);
    try {
      const res = await switchBrandSubscriptionPlanAction({
        userId: sessionUser.id,
        brandId,
        newPlanName: downgradeTargetPlan.planName,
        billingCycle,
      });

      if (res.success) {
        toast.success(
          t(
            "billing.downgradeScheduledToast",
            `Cambio a ${downgradeTargetPlan.planName} programado exitosamente. Mantendrás tu plan ${currentPlanName} hasta su fecha de vencimiento.`
          )
            .replace("{target}", downgradeTargetPlan.planName)
            .replace("{current}", currentPlanName)
        );
        setDowngradeTargetPlan(null);
        loadData();
      } else {
        toast.error(res.error ?? t("billing.downgradeErrorToast", "No se pudo cambiar de plan."));
      }
    } catch (_err) {
      toast.error(t("billing.downgradeErrorToast", "Error al procesar el cambio de plan."));
    } finally {
      setIsDowngrading(false);
    }
  };

  const [isCancelingDowngrade, setIsCancelingDowngrade] = useState(false);

  const handleCancelScheduledDowngrade = async () => {
    if (!sessionUser?.id || !brandId) return;
    setIsCancelingDowngrade(true);
    try {
      const res = await cancelScheduledBrandDowngradeAction({
        userId: sessionUser.id,
        brandId,
      });

      if (res.success) {
        toast.success(
          t(
            "billing.cancelDowngradeToast",
            `Se ha cancelado la reducción programada. Continuarás en el plan ${currentPlanName}.`
          ).replace("{current}", currentPlanName)
        );
        loadData();
      } else {
        toast.error(res.error ?? t("billing.cancelDowngradeErrorToast", "No se pudo cancelar el cambio de plan."));
      }
    } catch (_err) {
      toast.error(t("billing.cancelDowngradeErrorToast", "Error al cancelar la reducción del plan."));
    } finally {
      setIsCancelingDowngrade(false);
    }
  };

  const fetchPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const res = await getPlanConfigs();
      if (res.success && res.data) {
        setPlans(res.data.plans);
      }
    } catch (_err) {
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "payments" && plans.length === 0) {
      fetchPlans();
    }
  }, [activeTab, plans.length, fetchPlans]);

  const executeCheckoutWithGateway = async (
    plan: PlanConfig,
    gateway: PaymentGatewayType
  ) => {
    try {
      setCheckoutLoading(true);
      toast.loading("Generando sesión de checkout...");

      const isYearly = billingCycle === "YEARLY";
      const targetAmount = isYearly ? plan.priceYearly : plan.priceMonthly;

      const res = await createBrandCheckoutSessionAction({
        ownerId: sessionUser?.id ?? "usr_admin_default",
        brandId: brandId || "brand-general",
        amount: targetAmount,
        currency: "MXN",
        description: `Suscripción ${isYearly ? "Anual" : "Mensual"} al Plan ${plan.planName}`,
        customerEmail: sessionUser?.email ?? "admin@empresa.com",
        returnUrl: `${window.location.origin}/dashboard/settings?mock_checkout=success&plan=${encodeURIComponent(
          plan.planName
        )}&cycle=${billingCycle}`,
        cancelUrl: `${window.location.origin}/dashboard/settings?mock_checkout=cancel`,
        gatewayType: gateway,
        metadata: {
          planName: plan.planName,
          billingCycle,
          userId: sessionUser?.id ?? "",
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

  // Pre-seed form state from session user when available
  useEffect(() => {
    if (sessionUser?.name && !userName) {
      setUserName(sessionUser.name);
    }
    if (sessionUser?.email && !userEmail) {
      setUserEmail(sessionUser.email);
    }
  }, [sessionUser?.name, sessionUser?.email, userName, userEmail]);

  const loadData = useCallback(async () => {
    if (!sessionUser?.id) return;
    setIsLoading(true);
    try {
      const userRes = await getUserById(sessionUser.id);
      if (userRes.success && userRes.data) {
        const u = userRes.data;
        setUserName(u.name ?? sessionUser?.name ?? "");
        setUserEmail(u.email ?? sessionUser?.email ?? "");
        setUserBio(u.bio ?? "");
        setUserLocale(u.locale ?? "es");
        setUserTimezone(u.timezone ?? "UTC");
        setBrandId(u.brandId ?? null);

        if (u.brandId) {
          const [brandRes, subRes] = await Promise.all([
            getBrandById(u.brandId),
            getBrandActiveSubscriptionAction(u.brandId),
          ]);
          if (brandRes.success && brandRes.data) {
            const b = brandRes.data;
            setBrandName(b.name);
            setBrandDescription(b.description ?? "");
            setBrandLocale(b.defaultLocale ?? "es");
            setBrandTimezone(b.timezone ?? "UTC");
          }
          if (subRes.success && subRes.data) {
            setCurrentPlanName(subRes.data.planName);
            setScheduledPlanName(subRes.data.scheduledPlanName ?? null);
            setSubscriptionEndDate(subRes.data.endDate ?? null);
          }
        }
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al cargar los datos del perfil."));
    } finally {
      setIsLoading(false);
    }
  }, [sessionUser?.id, sessionUser?.name, sessionUser?.email, t]);

  useEffect(() => {
    if (sessionUser?.id) {
      loadData();
    }
  }, [sessionUser?.id, loadData]);

  useEffect(() => {
    const mockStatus = searchParams.get("mock_checkout");
    const mockSessionId = searchParams.get("mock_session_id");
    const rawPlan = searchParams.get("plan");
    const targetPlan = rawPlan ? rawPlan.split("?")[0].split("&")[0].trim() : null;
    const targetCycle = searchParams.get("cycle") || "MONTHLY";

    if (mockStatus === "success" && targetPlan && brandId && sessionUser?.id) {
      const updatePlanOnSuccess = async () => {
        try {
          const res = await switchBrandSubscriptionPlanAction({
            userId: sessionUser.id,
            brandId,
            newPlanName: targetPlan,
            billingCycle: targetCycle,
            gatewayProvider: "MOCK",
            trackingId: mockSessionId || `mock_sess_${Date.now()}`,
            rawGatewayStatus: "APPROVED",
            notes: `Cobro automático de suscripción (${targetCycle}) al plan ${targetPlan} vía Pasarela Mock`,
          });

          if (res.success) {
            toast.success(
              t(
                "billing.paymentSuccessToast",
                `¡Pago procesado con éxito! Tu plan ha sido actualizado a ${targetPlan}.`
              ).replace("{plan}", targetPlan)
            );
            setCurrentPlanName(targetPlan);
            loadData();
          } else {
            toast.error(res.error ?? t("billing.downgradeErrorToast", "No se pudo activar la suscripción."));
          }
        } catch (_err) {
          toast.error(t("billing.downgradeErrorToast", "Error al actualizar la suscripción tras el pago."));
        } finally {
          router.replace("/dashboard/settings");
        }
      };

      updatePlanOnSuccess();
    } else if (mockStatus === "cancel") {
      toast.error(t("billing.paymentCancelToast", "El proceso de pago fue cancelado."));
      router.replace("/dashboard/settings");
    }
  }, [searchParams, brandId, sessionUser?.id, loadData, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser?.id) return;
    setIsSubmitting(true);
    try {
      const res = await updateUserPreferences(sessionUser.id, {
        name: userName,
        bio: userBio,
        timezone: userTimezone,
      });

      if (res.success) {
        toast.success(t("toasts.preferencesSaved", "¡Perfil actualizado exitosamente!"));
        await updateSession({
          timezone: userTimezone,
          name: userName,
          user: {
            timezone: userTimezone,
            name: userName,
          },
        });
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo actualizar el perfil."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al guardar el perfil."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser?.id) return;
    setIsSubmitting(true);
    try {
      const res = await changePassword(sessionUser.id, {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        toast.success(t("toasts.passwordChanged", "¡Contraseña actualizada exitosamente!"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo cambiar la contraseña."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al actualizar la contraseña."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) return;
    setIsSubmitting(true);
    try {
      const res = await updateBrandSettings(brandId, {
        name: brandName,
        description: brandDescription,
        defaultLocale: brandLocale,
        timezone: brandTimezone,
      });

      if (res.success) {
        toast.success(t("toasts.brandUpdated", "¡Datos de la empresa actualizados exitosamente!"));
      } else {
        toast.error(res.error ?? t("toasts.errorOccurred", "No se pudo actualizar la empresa."));
      }
    } catch (_error: unknown) {
      toast.error(t("toasts.errorOccurred", "Error al guardar datos de la empresa."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          <span>{t("settings.title", "Configuración del Perfil y Sistema")}</span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t(
            "settings.subtitle",
            "Gestiona tus datos personales, preferencias de seguridad y de tu organización"
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList
          className={`grid w-full ${
            isBrandAdmin ? "grid-cols-4 max-w-xl" : "grid-cols-2 max-w-xs"
          } bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800`}
        >
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="h-4 w-4" />
            <span>{t("settings.profileTab", "Perfil")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span>{t("settings.securityTab", "Seguridad")}</span>
          </TabsTrigger>
          {isBrandAdmin && (
            <>
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span>{t("settings.organizationTab", "Empresa")}</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span>{t("settings.paymentsTab", "Pagos")}</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <UserIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("settings.personalInfoTitle", "Información Personal")}</span>
              </CardTitle>
              <CardDescription>
                {t(
                  "settings.personalInfoSub",
                  "Actualiza tu nombre de usuario, biografía y preferencias regionales"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">{t("settings.fullName", "Nombre Completo")}</Label>
                      <Input
                        id="profile-name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder={t("settings.namePlaceholder", "Tu nombre completo")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-email">
                        {t("settings.emailReadonly", "Correo Electrónico (No modificable)")}
                      </Label>
                      <Input
                        id="profile-email"
                        value={userEmail}
                        disabled
                        className="opacity-70 bg-zinc-100 dark:bg-zinc-950 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-bio">{t("settings.bioLabel", "Biografía / Descripción")}</Label>
                    <Input
                      id="profile-bio"
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      placeholder={t("settings.bioPlaceholder", "Breve resumen de tu perfil profesional")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("settings.timezoneLabel", "Zona Horaria")}</Label>
                    <Select value={userTimezone} onValueChange={setUserTimezone}>
                      <SelectTrigger className="gap-2">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Tiempo Universal Coordenado)</SelectItem>
                        <SelectItem value="America/Mexico_City">
                          América / Ciudad de México (CST - UTC-6)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          América / Chicago (CST - UTC-6)
                        </SelectItem>
                        <SelectItem value="America/Bogota">
                          América / Bogotá (COT - UTC-5)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          América / Nueva York (EST - UTC-5)
                        </SelectItem>
                        <SelectItem value="America/Buenos_Aires">
                          América / Buenos Aires (ART - UTC-3)
                        </SelectItem>
                        <SelectItem value="America/Santiago">
                          América / Santiago (CLT - UTC-4)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          América / Los Ángeles (PST - UTC-8)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Button type="submit" disabled={isSubmitting} className="gap-2 font-bold">
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{t("settings.saveProfile", "Guardar Perfil")}</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Theme Style Selection Card */}
          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("settings.appearanceTitle", "Apariencia y Variante Estética del Sistema")}</span>
              </CardTitle>
              <CardDescription>
                {t(
                  "settings.appearanceSub",
                  "Alterna la línea visual entre el diseño Corporativo Clásico y el estilo Moderno tipo SaaS"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={
                  "flex flex-col sm:flex-row items-start sm:items-center " +
                  "justify-between gap-4 p-4 rounded-xl border border-zinc-200 " +
                  "dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40"
                }
              >
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {t("settings.defaultVisualTheme", "Estilo Visual Predeterminado")}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("settings.defaultVisualSub", "Valor inicial definido en")}{" "}
                    <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">
                      NEXT_PUBLIC_DEFAULT_THEME_STYLE
                    </code>
                  </p>
                </div>
                <ThemeStyleSelector />
              </div>

              <div
                className={
                  "flex flex-col sm:flex-row items-start sm:items-center " +
                  "justify-between gap-4 p-4 rounded-xl border border-zinc-200 " +
                  "dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 mt-4"
                }
              >
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {t("settings.systemLanguageTitle", "Idioma del Sistema")}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {t("settings.systemLanguageSub", "Persistido directamente en tu usuario de base de datos")}{" "}
                    (<code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[11px]">User.locale</code>)
                  </p>
                </div>
                <LanguageSelector compact={false} />
              </div>
            </CardContent>
          </Card>

          {/* Security Info Banner */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-2xl flex gap-4 items-start shadow-sm">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 shrink-0">
              <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t("settings.securityNoteTitle", "Nota sobre Seguridad")}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t(
                  "settings.securityNoteDesc",
                  "Para cambiar tu correo electrónico u otra credencial de identidad crítica, por favor contacta al equipo de soporte o solicita asistencia a un administrador."
                )}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Security */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("settings.changePasswordTitle", "Cambiar Contraseña")}</span>
              </CardTitle>
              <CardDescription>
                {t(
                  "settings.changePasswordSub",
                  "Asegura tu cuenta actualizando tu clave de acceso periódicamente"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pass">{t("settings.currentPassword", "Contraseña Actual")}</Label>
                  <Input
                    id="current-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder", "••••••••")}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">{t("settings.newPassword", "Nueva Contraseña")}</Label>
                    <Input
                      id="new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("auth.passwordPolicyPlaceholder", "Mínimo 8 caracteres")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">
                      {t("settings.confirmNewPassword", "Confirmar Nueva Contraseña")}
                    </Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auth.passwordPlaceholder", "••••••••")}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button type="submit" disabled={isSubmitting} className="gap-2 font-bold">
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    <span>{t("settings.updatePasswordBtn", "Actualizar Contraseña")}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <SecurityPinForm />

          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Key className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("settings.activeSessionTitle", "Sesión de Usuario Activa")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={
                  "flex items-center justify-between p-3 rounded-xl bg-zinc-100/80 " +
                  "border border-zinc-200 dark:bg-zinc-950/60 dark:border-zinc-800"
                }
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    {t("settings.currentBrowser", "Navegador Actual")}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    {t("settings.activeSessionToken", "Sesión activa con token NextAuth v5")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{t("settings.connected", "Conectado")}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Organization / Brand (Only for Brand Admin) */}
        {isBrandAdmin && (
          <TabsContent value="organization" className="mt-6 space-y-6">
            <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("settings.companyDataTitle", "Datos de la Empresa / Marca")}</span>
                </CardTitle>
                <CardDescription>
                  {t(
                    "settings.companyDataSub",
                    "Configura la identidad y parámetros regionales de tu organización"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <form onSubmit={handleBrandSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand-name-input">
                        {t("settings.companyName", "Nombre de la Empresa")}
                      </Label>
                      <Input
                        id="brand-name-input"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder={t("settings.companyNamePlaceholder", "Nombre comercial")}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand-desc-input">
                        {t("settings.companyDesc", "Descripción / Razón Social")}
                      </Label>
                      <Input
                        id="brand-desc-input"
                        value={brandDescription}
                        onChange={(e) => setBrandDescription(e.target.value)}
                        placeholder={t("settings.companyDescPlaceholder", "Descripción corporativa")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("settings.companyDefaultLanguage", "Idioma Predeterminado de la Empresa")}</Label>
                        <Select value={brandLocale} onValueChange={setBrandLocale}>
                          <SelectTrigger className="gap-2">
                            <Globe className="h-4 w-4 text-zinc-500" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="es">Español (es)</SelectItem>
                            <SelectItem value="en">English (en)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>{t("settings.companyTimezone", "Zona Horaria Corporativa")}</Label>
                        <Select value={brandTimezone} onValueChange={setBrandTimezone}>
                          <SelectTrigger className="gap-2">
                            <Clock className="h-4 w-4 text-zinc-500" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/Mexico_City">
                              América / Ciudad de México (CST)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Label>{t("settings.currentPlanLabel", "Plan Actual de la Empresa")}</Label>
                      <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                            {currentPlanName || t("settings.freePlan", "Plan Gratuito / Base")}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg">
                          {t("settings.activeStatus", "Activo")}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                      <Button type="submit" disabled={isSubmitting} className="gap-2 font-bold">
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span>{t("settings.saveCompany", "Guardar Datos de Empresa")}</span>
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 4: Payments / Suscripción y Pago del SaaS (Only for Brand Admin) */}
        {isBrandAdmin && (
          <TabsContent value="payments" className="mt-6 space-y-6">
            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <button
                type="button"
                onClick={() => setPaymentsSubTab("plans")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  paymentsSubTab === "plans"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <Sparkles className="h-4 w-4" />
                <span>{t("settings.tabPlansAndSubscription", "Planes y Suscripción")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentsSubTab("history")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  paymentsSubTab === "history"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <History className="h-4 w-4" />
                <span>{t("settings.tabPaymentHistory", "Historial de Pagos")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentsSubTab("gateway")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  paymentsSubTab === "gateway"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t("settings.tabPaymentGateway", "Pasarela de Pago")}</span>
              </button>
            </div>

            {/* Sub-tab 1: Plans */}
            {paymentsSubTab === "plans" && (
              <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                    <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {t("settings.saasSubscriptionTitle", "Suscripción y Pago del SaaS")}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {t(
                      "settings.saasSubscriptionSub",
                      "Selecciona el plan corporativo de la plataforma y procesa tu pago mediante nuestras pasarelas seguras."
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {scheduledPlanName && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 text-xs">
                          <p className="font-extrabold">
                            {t("billing.scheduledDowngradeTitle", `Cambio de Plan Programado a "${scheduledPlanName}"`).replace("{plan}", scheduledPlanName)}
                          </p>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            {t("billing.currentlyEnjoyingPlan", "Actualmente tu empresa disfruta del plan")} <strong>{currentPlanName}</strong>. {t("billing.reductionToPlan", "La reducción al plan")} <strong>{scheduledPlanName}</strong> {t("billing.willTakeEffectAtPeriodEnd", "entrará en vigor automáticamente al finalizar tu período de facturación actual")}
                            {subscriptionEndDate && (
                              <> el <strong><FormattedDate date={subscriptionEndDate} format="PPP" /></strong></>
                            )}.
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isCancelingDowngrade}
                        onClick={handleCancelScheduledDowngrade}
                        className="rounded-xl text-xs font-bold shrink-0 border-amber-500/30 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 gap-1.5"
                      >
                        {isCancelingDowngrade && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        <span>{t("billing.cancelReduction", "Cancelar Reducción")}</span>
                      </Button>
                    </div>
                  )}
                  {/* Selector Toggle de Ciclo de Facturación (Mensual / Anual) */}
                  <div className="flex items-center justify-center gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl w-fit mx-auto border border-zinc-200 dark:border-zinc-700/60 my-2">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("MONTHLY")}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        billingCycle === "MONTHLY"
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-black"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      {t("billing.monthlyBilling", "Facturación Mensual")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("YEARLY")}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        billingCycle === "YEARLY"
                          ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-black"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      <span>{t("billing.yearlyBilling", "Facturación Anual")}</span>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-lg font-black uppercase">
                        {t("billing.save20Percent", "Ahorra 20%")}
                      </Badge>
                    </button>
                  </div>

                  {isLoadingPlans ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-center p-8 text-zinc-500 font-semibold italic">
                      {t("billing.noPlansFound", "No hay planes de cobro activos en el catálogo.")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {plans.map((plan) => {
                        const isYearly = billingCycle === "YEARLY";
                        const displayedPrice = isYearly ? plan.priceYearly : plan.priceMonthly;
                        const priceInfo = formatConvertedPrice(
                          displayedPrice,
                          "es",
                          sessionUser?.timezone
                        );
                        const isCurrentActivePlan = currentPlanName === plan.planName;
                        const activePlanObj = plans.find((p) => p.planName === currentPlanName);
                        const currentActivePrice = activePlanObj
                          ? isYearly
                            ? activePlanObj.priceYearly
                            : activePlanObj.priceMonthly
                          : 0;
                        const isUpgrade = displayedPrice > currentActivePrice;

                        return (
                          <div
                            key={plan.id}
                            className={cn(
                              "border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col justify-between transition-all bg-white dark:bg-zinc-900/60 shadow-sm",
                              isCurrentActivePlan && "ring-2 ring-emerald-500 border-emerald-500"
                            )}
                          >
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                >
                                  {plan.planName}
                                </Badge>
                                <div className="text-right">
                                  <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">
                                    {priceInfo.usdFormatted}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 block font-mono font-bold">
                                    {isYearly
                                      ? t("billing.usdPerYear", "USD / año")
                                      : t("billing.usdPerMonth", "USD / mes")}
                                  </span>
                                </div>
                              </div>

                              <h4 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                                {plan.planName}
                              </h4>

                              <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-xs text-zinc-600 dark:text-zinc-400">
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>{t("billing.projectsLimit", "Límite de Proyectos")}</span>
                                  </span>
                                  <span className="font-bold text-zinc-900 dark:text-white font-mono">
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
                                      "text-[9px] font-bold rounded px-1.5",
                                      plan.allowCSVImportExport
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "bg-zinc-100 text-zinc-500 border-zinc-300"
                                    )}
                                  >
                                    {plan.allowCSVImportExport ? t("billing.included", "Incluido") : t("billing.no", "No")}
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
                                      "text-[9px] font-bold rounded px-1.5",
                                      plan.hasLiveSupport
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "bg-zinc-100 text-zinc-500 border-zinc-300"
                                    )}
                                  >
                                    {plan.hasLiveSupport ? t("billing.included", "Incluido") : t("billing.no", "No")}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="pt-6">
                              {isCurrentActivePlan ? (
                                <Button
                                  disabled
                                  className="w-full rounded-xl font-bold gap-1.5 text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                >
                                  <Check className="h-4 w-4 text-emerald-500" />
                                  <span>{t("billing.currentActivePlan", "Plan Actual Activo")}</span>
                                </Button>
                              ) : isUpgrade ? (
                                <Button
                                  onClick={() => handleCheckout(plan)}
                                  className="w-full rounded-xl font-bold gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  <span>{t("billing.upgradePlanBtn", "Mejorar Plan (Upgrade)")}</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  onClick={() => setDowngradeTargetPlan(plan)}
                                  className="w-full rounded-xl font-bold gap-1.5 text-xs border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                  <span>{t("billing.switchToThisPlanBtn", "Cambiar a este Plan")}</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sub-tab 2: History */}
            {paymentsSubTab === "history" && brandId && (
              <BrandPaymentsHistoryTable brandId={brandId} />
            )}

            {/* Sub-tab 3: Gateway */}
            {paymentsSubTab === "gateway" && brandId && (
              <BrandPaymentGatewaysList brandId={brandId} isSuperAdmin={isSuperAdmin} />
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Confirmación para Reducción o Cambio de Plan (Downgrade) */}
      <AlertDialog
        open={Boolean(downgradeTargetPlan)}
        onOpenChange={(open) => {
          if (!open) setDowngradeTargetPlan(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span>{t("billing.schedulePlanDowngradeTitle", "Programar Reducción de Plan")}</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-2">
              {t("billing.aboutToScheduleDowngrade", "Estás a punto de programar el cambio del plan de tu empresa de")}{" "}
              <strong className="text-zinc-900 dark:text-white">
                {currentPlanName}
              </strong>{" "}
              a{" "}
              <strong className="text-zinc-900 dark:text-white">
                {downgradeTargetPlan?.planName}
              </strong>
              . {t("billing.willKeepBenefitsUntilExpiration", "Mantendrás todos los beneficios del plan")} <strong>{currentPlanName}</strong> {t("billing.downgradeAutoEffectAfterExpiration", "hasta la fecha de vencimiento de tu período actual, momento en el cual el nuevo plan entrará en vigor de forma automática.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">
              {t("common.cancel", "Cancelar")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDowngrade}
              disabled={isDowngrading}
              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isDowngrading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{isDowngrading ? t("billing.scheduling", "Programando...") : t("billing.schedulePlanChangeBtn", "Programar Cambio de Plan")}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Selección de Pasarela SaaS para Checkout */}
      {isGatewayModalOpen && selectedCheckoutPlan && (
        <PaymentGatewaySelectModal
          isOpen={isGatewayModalOpen}
          onClose={() => setIsGatewayModalOpen(false)}
          availableGateways={availableSaaSGateways}
          planName={selectedCheckoutPlan.planName}
          amount={selectedCheckoutPlan.priceMonthly}
          onSelect={(gateway: PaymentGatewayType) => {
            executeCheckoutWithGateway(selectedCheckoutPlan, gateway);
          }}
          loading={checkoutLoading}
        />
      )}

      {/* Modal de Configuración Privada de la Marca (Motor preparado) */}
      {isBrandAdmin && brandId && (
        <BrandPaymentConfigDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          onSuccess={() => {
            toast.success("Credenciales de pasarela guardadas cifradas.");
            loadData();
          }}
          brands={[{ id: brandId, name: brandName || "Mi Empresa" }]}
          initialBrandId={brandId}
          isSuperAdmin={false}
        />
      )}
    </div>
  );
}

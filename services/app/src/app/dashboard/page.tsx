"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Globe,
  Calendar,
  Key,
  Loader2,
  Clock,
  Activity,
  Zap,
  Users,
  CreditCard,
  Terminal,
  ArrowRight,
  Monitor,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Settings,
} from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useBrand } from "@/context/brand-context";
import { getAdminMetrics, type AdminMetrics } from "@/actions/brand";
import { recordLoginAuditAction } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const { selectedBrandId } = useBrand();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const user = session?.user;
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN");

  const effectiveBrandId = isSuperAdmin
    ? selectedBrandId !== "ALL"
      ? selectedBrandId
      : undefined
    : user?.brandId ?? undefined;

  const isBrandAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPER_ADMIN");

  const fetchMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await getAdminMetrics({
        brandId: effectiveBrandId,
        userId: !isBrandAdmin ? user?.id : undefined,
      });
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (_err: unknown) {
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [effectiveBrandId, isBrandAdmin, user?.id]);

  useEffect(() => {
    if (user?.id) {
      recordLoginAuditAction(user.id).then(() => {
        fetchMetrics();
      });
    }
  }, [user?.id, fetchMetrics]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return null;

  const activePlanName = metrics?.brandSubscription?.planName ?? t("dashboard.noActivePlan", "Sin Plan Activo");

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t("dashboard.welcome", "Hola")},</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {user.name?.split(" ")[0] ?? user.email}
            </span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {isSuperAdmin
              ? t(
                  "dashboard.subtitleGlobal",
                  "Resumen global del sistema, gobierno de marcas y auditoría de seguridad"
                )
              : t(
                  "dashboard.subtitleBrand",
                  "Resumen de actividad y estado operativo de tu marca"
                )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {user.roles?.map((role) => (
            <Badge key={role} variant="success" className="font-bold px-3 py-1">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* CARD 1: Total Users (Admins) / Member Status (Users) */}
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isBrandAdmin
                ? t("dashboard.totalUsers", "Usuarios Totales")
                : t("dashboard.memberStatus", "Mi Estatus de Miembro")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : isBrandAdmin ? (
              <>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  {metrics?.totalUsers ?? 0}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("dashboard.usersInScope", "Cuentas en el alcance activo")}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ACTIVO
                  </span>
                  <Badge variant="success" className="text-[9px] uppercase font-bold px-1.5 py-0">
                    OK
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("dashboard.verifiedAccount", "Cuenta de usuario verificada")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: Subscription Card (Admins) / My Brand Card (Users) */}
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isSuperAdmin
                ? t("dashboard.activeSubscriptions", "Suscripciones Activas")
                : isBrandAdmin
                ? t("dashboard.mySubscriptionPlan", "Mi Plan de Suscripción")
                : t("dashboard.myAssignedBrand", "Mi Marca / Gimnasio")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              {isSuperAdmin ? <CreditCard className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-24" />
            ) : isSuperAdmin ? (
              <>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                  {metrics?.activeSubscriptions ?? 0}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("dashboard.plansActiveInSystem", "Planes globales contratados")}
                </p>
              </>
            ) : isBrandAdmin ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-zinc-900 dark:text-white truncate">
                    {activePlanName}
                  </span>
                  <Badge variant="success" className="text-[9px] uppercase font-bold px-1.5 py-0">
                    {metrics?.brandSubscription?.status ?? "ACTIVO"}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("dashboard.currentPlan", "Plan Actual")}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-black text-zinc-900 dark:text-white truncate">
                  {user.brandId ?? "General"}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {t("dashboard.assignedBrandSub", "Marca asignada a tu perfil")}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* CARD 3: Recent Logins Count */}
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {isBrandAdmin
                ? t("dashboard.recentLogins", "Inicios de Sesión")
                : t("dashboard.myPersonalLogins", "Mis Accesos")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-extrabold text-zinc-900 dark:text-white font-mono">
                {metrics?.loginsTotal ?? 0}
              </div>
            )}
            <p className="text-[11px] text-zinc-500 mt-1">
              {isBrandAdmin
                ? t("dashboard.totalAuditLogs", "Eventos de acceso auditados")
                : t("dashboard.myAuditLogs", "Inicios de sesión auditados")}
            </p>
          </CardContent>
        </Card>

        {/* CARD 4: System Status */}
        <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {t("dashboard.systemStatus", "Estado del Servicio")}
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {t("dashboard.operational", "Operativo 100%")}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              {t("dashboard.dbStatus", "Servicios activos en UTC")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Activity Monitor & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMN 1 & 2: Recent Activity Monitor */}
        <Card className="lg:col-span-2 border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("dashboard.activityMonitorTitle", "Monitor de Actividad & Inicios de Sesión")}</span>
              </span>
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  {t("dashboard.dbOnlineBadge", "Sistema En Línea")}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {isLoadingMetrics ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={`log-skel-${i}`} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : !metrics?.recentLogins || metrics.recentLogins.length === 0 ? (
              <div className="p-8 rounded-2xl bg-zinc-100 dark:bg-zinc-950/50 text-center text-zinc-500 text-xs font-semibold">
                {t("dashboard.noLoginsFound", "No hay registros de logins recientes auditados.")}
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.recentLogins.map((log) => {
                  const isMobile = log.device === "Móvil";
                  return (
                    <div
                      key={log.id}
                      className={
                        "p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/60 " +
                        "border border-zinc-200/60 dark:border-zinc-800/50 " +
                        "flex flex-col sm:flex-row justify-between items-start " +
                        "sm:items-center gap-3 hover:border-emerald-500/40 " +
                        "transition-all duration-200 shadow-2xs"
                      }
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {log.userName}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono bg-zinc-200 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
                            {log.ip ?? "127.0.0.1"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {isMobile ? (
                            <Smartphone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <Monitor className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          )}
                          <span>
                            {log.browser ?? "Navegador"} • {log.device ?? "Escritorio"}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            ({log.userEmail})
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <FormattedDate
                          date={log.createdAt}
                          format="full"
                          timezone={user.timezone}
                          className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLUMN 3: Regional & Quick Actions Details */}
        <div className="space-y-6">
          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t("dashboard.regionalTitle", "Configuración Regional")}</span>
                </span>
                {isBrandAdmin && (
                  <Link
                    href="/dashboard/settings"
                    className={
                      "p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 " +
                      "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 " +
                      "dark:hover:text-white transition-colors"
                    }
                    title={t("nav.settings", "Configuración")}
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">
                    {t("dashboard.currentLocalTime", "Hora Local Actual")}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-mono px-2 py-0.5"
                  >
                    {(user.locale ?? "es").toUpperCase()} • {user.timezone ?? "UTC"}
                  </Badge>
                </div>
                {currentTime ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <FormattedDate
                      date={currentTime}
                      format="time"
                      timezone={user.timezone}
                      className="text-2xl font-black font-mono text-zinc-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <Skeleton className="h-8 w-32" />
                )}
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{t("dashboard.userIdLabel", "ID de Usuario")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-900 dark:text-zinc-200 font-bold truncate max-w-[120px]">
                    {user.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{t("dashboard.brandTenantLabel", "Marca / Tenant")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-zinc-900 dark:text-zinc-200 font-bold truncate max-w-[120px]">
                    {user.brandId ?? t("dashboard.globalSaas", "Global SaaS")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/60 backdrop-blur shadow-lg rounded-3xl overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>{t("dashboard.quickActionsTitle", "Acciones Rápidas")}</span>
            </h3>

            <div className="space-y-2">
              {isBrandAdmin ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Link href="/dashboard/disciplines">
                      <span>🥋 Disciplinas & Cursos</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Link href="/dashboard/students">
                      <span>👥 Gestor de Alumnos</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Link href="/dashboard/gamification">
                      <span>🏋️ Retos Físicos & Gamificación</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                  >
                    <Link href="/dashboard/tournaments">
                      <span>🏆 Torneos Internos & Brackets</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  {isSuperAdmin && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-emerald-500/10"
                    >
                      <Link href="/dashboard/brands">
                        <span>{t("nav.brands", "Administrar Marcas / Dojos")}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-blue-500/10"
                  >
                    <Link href={isSuperAdmin ? "/dashboard/billing" : "/dashboard/settings"}>
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <span>
                          {isSuperAdmin
                            ? t("dashboard.viewCatalog", "Ver Catálogo de Planes")
                            : t("settings.organizationTab", "Datos de la Empresa")}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-between rounded-xl h-11 font-bold text-xs border-zinc-200 dark:border-zinc-800 hover:bg-indigo-500/10"
                >
                  <Link href="/dashboard/settings">
                    <span className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-indigo-500" />
                      <span>{t("dashboard.myProfileSecurity", "Mi Perfil & Seguridad")}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Link>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

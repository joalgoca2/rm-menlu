"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Webhook,
  LogOut,
  Layers,
  Sun,
  Moon,
  Laptop,
  Lock,
  Receipt,
  Swords,
  Trophy,
  Award,
  Dumbbell,
  Gamepad2,
  ChevronDown,
  ChevronRight,
  Settings,
  ClipboardCheck,
  UsersRound,
} from "lucide-react";
import { FEATURES } from "@/lib/config/features";
import { useBrand } from "@/context/brand-context";
import { useTranslation } from "@/components/providers/i18n-provider";
import { useSidebar } from "@/context/sidebar-context";
import { hasRouteAccess } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { GuidedTourToggle } from "@/components/ui/guided-tour-toggle";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  defaultTitle: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  userOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    key: "nav.dashboard",
    defaultTitle: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "nav.groups",
    defaultTitle: "Grupos / Clases",
    href: "/dashboard/groups",
    icon: UsersRound,
    adminOnly: true,
  },
  {
    key: "nav.students",
    defaultTitle: "Alumnos",
    href: "/dashboard/students",
    icon: Users,
    adminOnly: true,
  },
  {
    key: "nav.exams",
    defaultTitle: "Exámenes de Grado",
    href: "/dashboard/exams",
    icon: Award,
    adminOnly: true,
  },
  {
    key: "nav.tournaments",
    defaultTitle: "Torneos Internos",
    href: "/dashboard/tournaments",
    icon: Trophy,
    adminOnly: true,
  },
  {
    key: "nav.effortPath",
    defaultTitle: "El Camino del Esfuerzo",
    href: "/student/effort-path",
    icon: Gamepad2,
  },
  {
    key: "nav.myPayments",
    defaultTitle: "Mis Pagos & Membresías",
    href: "/dashboard/payments",
    icon: CreditCard,
    userOnly: true,
  },
];

const dojoSettingsNavItems: NavItem[] = [
  {
    key: "nav.disciplines",
    defaultTitle: "Disciplinas & Cintas",
    href: "/dashboard/disciplines",
    icon: Swords,
    adminOnly: true,
  },
  {
    key: "nav.gamification",
    defaultTitle: "Retos & Gamificación",
    href: "/dashboard/gamification",
    icon: Dumbbell,
    adminOnly: true,
  },
  {
    key: "nav.rubrics",
    defaultTitle: "Plantillas de Evaluación",
    href: "/dashboard/evaluations/templates",
    icon: ClipboardCheck,
    adminOnly: true,
  },
];

const adminNavItems: NavItem[] = [
  {
    key: "nav.brands",
    defaultTitle: "Marcas",
    href: "/dashboard/brands",
    icon: Building2,
    superAdminOnly: true,
  },
  {
    key: "nav.users",
    defaultTitle: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
    adminOnly: true,
  },
  {
    key: "nav.brandPayments",
    defaultTitle: "Cobros de Marca",
    href: "/dashboard/brands/payments",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    key: "nav.paymentEngine",
    defaultTitle: "Pasarelas de Pago",
    href: "/dashboard/payment-engine",
    icon: Receipt,
    adminOnly: true,
  },
  {
    key: "nav.billing",
    defaultTitle: "Planes de Cobro SaaS",
    href: "/dashboard/billing",
    icon: CreditCard,
    superAdminOnly: true,
  },
  {
    key: "nav.integrations",
    defaultTitle: "Integraciones & Webhooks",
    href: "/dashboard/admin/integrations",
    icon: Webhook,
    adminOnly: true,
  },
];

export function Sidebar({ userRoles }: { userRoles?: string[] }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDojoSettingsOpen, setIsDojoSettingsOpen] = useState(true);
  const isAdmin = userRoles?.includes("SUPER_ADMIN") || userRoles?.includes("ADMIN");
  const isSuperAdmin = userRoles?.includes("SUPER_ADMIN");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLinkClick = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const isExpanded = isMobileOpen || !isCollapsed;

  const isIntegrationsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_INTEGRATIONS !== "false";
  const isBillingEnabled =
    process.env.NEXT_PUBLIC_ENABLE_BILLING !== "false";

  const visibleAdminNavItems = adminNavItems.filter((item) => {
    if (!hasRouteAccess(item.href, userRoles ?? [])) {
      return false;
    }
    if (item.key === "nav.integrations") {
      return isIntegrationsEnabled;
    }
    if (item.key === "nav.billing") {
      return isBillingEnabled;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "bg-white/90 border-r border-zinc-200 text-zinc-900 " +
            "dark:bg-zinc-950/90 dark:border-zinc-800 dark:text-zinc-100 " +
            "backdrop-blur-xl transition-all duration-300 ease-in-out " +
            "flex flex-col z-50 md:z-20 fixed inset-y-0 left-0 md:relative",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          !isMobileOpen && isCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {/* Brand Header & Brand Switcher */}
        <div
          className={cn(
            "p-4 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col gap-3",
            !isExpanded ? "items-center" : ""
          )}
        >
          <BrandSwitcherHeader isExpanded={isExpanded} isSuperAdmin={isSuperAdmin} />
          {isExpanded && (
            <div className="flex justify-center pt-1">
              <GuidedTourToggle />
            </div>
          )}
        </div>

        {/* Navigation Body */}
        <nav className="flex-1 px-3 space-y-6 mt-6 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {isExpanded && (
              <div
                className={
                  "text-[10px] font-extrabold text-zinc-500 " +
                  "uppercase tracking-widest mb-3 px-3"
                }
              >
                {t("nav.mainMenu", "Menú Principal")}
              </div>
            )}
            {mainNavItems
              .filter((item) => !item.userOnly || !isAdmin)
              .map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isExpanded={isExpanded}
                  onClick={handleLinkClick}
                />
              ))}
          </div>

          {/* Dojo Settings Submenu */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
              {isExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsDojoSettingsOpen(!isDojoSettingsOpen)}
                  className={
                    "w-full flex items-center justify-between px-3 py-2 text-xs " +
                    "font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 " +
                    "dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                  }
                >
                  <span className="flex items-center gap-2">
                    <Settings size={14} className="text-amber-500" />
                    {t("nav.dojoSettings", "Configuración Dojo")}
                  </span>
                  {isDojoSettingsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2" />
              )}

              {(isDojoSettingsOpen || !isExpanded) &&
                dojoSettingsNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    isExpanded={isExpanded}
                    onClick={handleLinkClick}
                  />
                ))}
            </div>
          )}

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
              {isExpanded && (
                <div
                  className={
                    "text-[10px] font-extrabold text-zinc-500 " +
                    "uppercase tracking-widest mb-3 px-3"
                  }
                >
                  {t("nav.adminSection", "SaaS Admin")}
                </div>
              )}
              {visibleAdminNavItems.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  isExpanded={isExpanded}
                  onClick={handleLinkClick}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Theme Switcher Footer */}
        {mounted && (
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
            {isExpanded ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {t("nav.themeMode", "Modo")}
                </span>
                <div
                  className={
                    "flex bg-zinc-100 border border-zinc-200 " +
                    "dark:bg-zinc-900 dark:border-zinc-800 rounded-lg p-0.5"
                  }
                >
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "p-1.5 rounded-md transition-all cursor-pointer",
                      theme === "light"
                        ? "bg-white text-emerald-600 dark:bg-zinc-800 " +
                            "dark:text-emerald-400 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 " +
                            "dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                    title={t("nav.themeLight", "Claro")}
                  >
                    <Sun size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "p-1.5 rounded-md transition-all cursor-pointer",
                      theme === "dark"
                        ? "bg-white text-emerald-600 dark:bg-zinc-800 " +
                            "dark:text-emerald-400 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 " +
                            "dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                    title={t("nav.themeDark", "Oscuro")}
                  >
                    <Moon size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "p-1.5 rounded-md transition-all cursor-pointer",
                      theme === "system"
                        ? "bg-white text-emerald-600 dark:bg-zinc-800 " +
                            "dark:text-emerald-400 shadow-sm font-bold"
                        : "text-zinc-500 hover:text-zinc-900 " +
                            "dark:text-zinc-400 dark:hover:text-zinc-200"
                    )}
                    title={t("nav.themeSystem", "Sistema")}
                  >
                    <Laptop size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={
                    "p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 " +
                    "dark:hover:text-emerald-400 rounded-xl hover:bg-zinc-100 " +
                    "dark:hover:bg-zinc-900 transition-colors mx-auto cursor-pointer"
                  }
                  title={t("nav.themeMode", "Modo")}
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions (Lock App + Sign Out) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div
            className={cn(
              "grid gap-2",
              isExpanded ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {FEATURES.screenLock && (
              <Button
                variant="ghost"
                onClick={() => {
                  handleLinkClick();
                  window.dispatchEvent(new Event("lock-screen-trigger"));
                }}
                className={cn(
                  "w-full rounded-xl h-10 transition-all font-bold text-[11px] " +
                    "uppercase tracking-wider flex items-center justify-center gap-1.5 px-2 " +
                    "bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 " +
                    "hover:bg-amber-500/20 hover:text-amber-800 dark:hover:text-amber-300",
                  !isExpanded && "px-0"
                )}
                title={t("sidebar.lockApp", "Bloquear Pantalla")}
              >
                <Lock size={15} className="shrink-0" />
                {isExpanded && <span>{t("sidebar.lockShort", "BLOQUEAR")}</span>}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => {
                handleLinkClick();
                signOut({ callbackUrl: "/login" });
              }}
              className={cn(
                "w-full rounded-xl h-10 transition-all font-bold text-[11px] " +
                  "uppercase tracking-wider flex items-center justify-center gap-1.5 px-2 " +
                  "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 " +
                  "hover:bg-rose-500/20 hover:text-rose-800 dark:hover:text-rose-300",
                !isExpanded && "px-0",
                !FEATURES.screenLock && isExpanded && "col-span-2"
              )}
              title={t("nav.signOut", "Cerrar Sesión")}
            >
              <LogOut size={15} className="shrink-0" />
              {isExpanded && <span>{t("nav.signOutShort", "SALIR")}</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarNavLink({
  item,
  pathname,
  isExpanded,
  onClick,
}: {
  item: NavItem;
  pathname: string;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const title = t(item.key, item.defaultTitle);
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname?.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl " +
          "transition-all duration-200 border group",
        isActive
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 " +
              "dark:text-emerald-400 font-bold shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border-transparent " +
              "dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white",
        !isExpanded && "justify-center px-0"
      )}
      title={!isExpanded ? title : undefined}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-zinc-400 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        )}
      />
      {isExpanded && <span className="truncate">{title}</span>}
    </Link>
  );
}

function BrandSwitcherHeader({
  isExpanded,
  isSuperAdmin,
}: {
  isExpanded: boolean;
  isSuperAdmin?: boolean;
}) {
  const { selectedBrandId, setSelectedBrandId, brands, isGlobalMode } =
    useBrand();

  if (!isExpanded) {
    return (
      <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 shrink-0">
        <Layers className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full truncate">
      <div className="flex items-center gap-2">
        <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 shrink-0 text-amber-500">
          <Swords className="h-4 w-4" />
        </div>
        <div className="flex flex-col truncate">
          <span className="text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
            Menlu <span className="text-amber-500 font-normal text-xs">门路</span>
          </span>
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {isSuperAdmin ? "SaaS Platform" : "Brand Portal"}
          </span>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mt-2">
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className={cn(
              "w-full text-[11px] font-semibold rounded-lg px-2 py-1.5 border " +
                "transition-all cursor-pointer outline-none",
              isGlobalMode
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
            )}
          >
            <option value="ALL">🌐 Todas las Marcas (Global)</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                🏢 {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}


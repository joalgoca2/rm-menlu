"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LayoutDashboard, LogOut, Shield, Swords, Flame } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSelector } from "@/components/layout/language-selector";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const isDashboardOrAuth =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/brand");

  if (isDashboardOrAuth) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur transition-colors duration-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 font-extrabold border border-amber-500/40 shadow-xs">
            <Swords className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-zinc-900 dark:text-white tracking-tight text-base leading-none">
              Menlu <span className="text-amber-500 font-normal text-xs">门路</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Dojo Platform</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/student/effort-path" className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors">
            <Flame className="h-4 w-4" />
            <span>{t("nav.effortPath", "El Camino del Esfuerzo")}</span>
          </Link>

          <LanguageSelector compact />
          <ThemeToggle showColorSelector={Boolean(session?.user)} />

          {session?.user ? (
            <>
              <Button
                asChild
                size="sm"
                className="gap-2 text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t("nav.dashboard", "Dashboard")}</span>
                </Link>
              </Button>

              {session.user.roles?.includes("ADMIN") && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs rounded-xl border-amber-500/40 text-amber-600 dark:text-amber-400"
                >
                  <Link href="/dashboard/admin">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("nav.admin", "Admin")}</span>
                  </Link>
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-xl"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut", "Cerrar Sesión")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                size="sm"
                className="text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl shadow-xs"
              >
                <Link href="/login">
                  {t("nav.signIn", "Iniciar Sesión")}
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

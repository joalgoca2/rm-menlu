"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/providers/i18n-provider";

export function Footer() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.1";

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
    <footer
      className={
        "w-full border-t border-zinc-200 bg-white/60 py-6 text-xs text-zinc-600 " +
        "transition-colors duration-200 dark:border-zinc-800/80 " +
        "dark:bg-zinc-950/60 dark:text-zinc-400"
      }
    >
      <div
        className={
          "mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 " +
          "px-4 sm:flex-row sm:px-6"
        }
      >
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              Menlu <span className="text-amber-500 font-normal">门路</span> Dojo Platform &copy; {new Date().getFullYear()}
            </span>
          </div>
          <span className="pl-4 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
            {t("footer.version", "Versión")}: {appVersion} | Sistema B2B SaaS
          </span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-500">
          <Link
            href="/terms"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            {t("footer.terms", "Términos")}
          </Link>
          <Link
            href="/privacy"
            className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
          >
            {t("footer.privacy", "Privacidad")}
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span className="font-semibold text-amber-500/90">RemoteMonkeys AI Stack</span>
        </div>
      </div>
    </footer>
  );
}

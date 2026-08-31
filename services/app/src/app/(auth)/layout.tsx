import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Swords } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-zinc-100 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 transition-colors duration-200">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 font-extrabold text-lg border border-amber-500/40 shadow-md group-hover:scale-105 transition-transform">
            <Swords className="h-6 w-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              Menlu <span className="text-amber-500 font-normal text-base">门路</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">Gestión Inteligente & Gamificación</span>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

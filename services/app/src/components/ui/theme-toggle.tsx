"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette, Sparkles, Check } from "lucide-react";
import { useThemeStyle } from "@/components/theme-style-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  showColorSelector?: boolean;
}

export function ThemeToggle({ showColorSelector = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { themeStyle, setThemeStyle } = useThemeStyle();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-1">
      {/* Light / Dark Mode Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme mode"
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-all" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-400 transition-all" />
        )}
      </Button>

      {/* Dojo Color Style Selector Menu (Only for registered logged-in users) */}
      {showColorSelector && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-amber-500 rounded-lg relative"
              title="Seleccionar Tema de Color del Dojo"
            >
              <Palette className="h-4 w-4" />
              <span
                className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                  themeStyle === "gold"
                    ? "bg-amber-500"
                    : themeStyle === "modern"
                    ? "bg-purple-500"
                    : "bg-emerald-500"
                }`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-2xl border-zinc-200 dark:border-zinc-800 p-2"
          >
            <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Tema de Color del Dojo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setThemeStyle("gold")}
              className="flex items-center justify-between text-xs font-bold p-2.5 rounded-xl cursor-pointer hover:bg-amber-500/10"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border border-amber-500/50 shadow-xs" />
                <span>🟡 Dojo Dorado (Landing)</span>
              </div>
              {themeStyle === "gold" && <Check className="h-4 w-4 text-amber-500" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setThemeStyle("modern")}
              className="flex items-center justify-between text-xs font-bold p-2.5 rounded-xl cursor-pointer hover:bg-purple-500/10"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 border border-purple-500/50 shadow-xs" />
                <span>💜 Vibrante (Morado)</span>
              </div>
              {themeStyle === "modern" && <Check className="h-4 w-4 text-purple-500" />}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setThemeStyle("professional")}
              className="flex items-center justify-between text-xs font-bold p-2.5 rounded-xl cursor-pointer hover:bg-emerald-500/10"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border border-emerald-500/50 shadow-xs" />
                <span>🟢 Profesional (Esmeralda)</span>
              </div>
              {themeStyle === "professional" && (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

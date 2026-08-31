"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "pt", name: "Português", flag: "🇧🇷" },
  ];

  const activeLang = languages.find((l) => l.code === locale) ?? languages[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "default"}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          compact
            ? "h-9 w-9 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            : "gap-2 h-9 px-3 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
        title="Cambiar Idioma"
      >
        <Globe className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        {!compact && (
          <>
            <span>{activeLang.flag}</span>
            <span>{activeLang.name}</span>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={async () => {
                setIsOpen(false);
                if (locale !== lang.code) {
                  await setLocale(lang.code);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors",
                locale === lang.code
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              {locale === lang.code && (
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

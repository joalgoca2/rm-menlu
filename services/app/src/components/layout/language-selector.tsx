"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES } from "@/lib/date";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.value === locale) ?? SUPPORTED_LANGUAGES[0];

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
            ? "h-9 w-9 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400"
            : "gap-2 h-9 px-3 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
        title="Cambiar Idioma"
      >
        <Globe className="h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400" />
        {!compact && (
          <>
            <span>{activeLang.flag}</span>
            <span>{activeLang.label.split(" ")[0]}</span>
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={async () => {
                setIsOpen(false);
                if (locale !== lang.value) {
                  await setLocale(lang.value);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors",
                locale === lang.value
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label.split(" ")[0]}</span>
              </div>
              {locale === lang.value && (
                <Check className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

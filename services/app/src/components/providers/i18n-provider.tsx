"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import es from "@/locales/es.json";
import en from "@/locales/en.json";
import pt from "@/locales/pt.json";
import { updateUserLocale } from "@/actions/i18n";

type DictionaryMap = typeof es;

interface I18nContextType {
  locale: string;
  setLocale: (locale: string) => Promise<void>;
  t: (path: string, fallback?: string) => string;
}

const dictionaries: Record<string, DictionaryMap> = {
  es,
  en: en as unknown as DictionaryMap,
  pt: pt as unknown as DictionaryMap,
};

const I18nContext = createContext<I18nContextType>({
  locale: "es",
  setLocale: async () => {},
  t: (_path: string, fallback?: string) => fallback ?? _path,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update: updateSession } = useSession();
  const sessionUser = session?.user;
  const dbLocale = (sessionUser as { locale?: string } | undefined)?.locale;

  const [locale, setLocaleState] = useState<string>("es");

  useEffect(() => {
    // 1. Authenticated User: DB preference takes priority
    if (sessionUser?.id && dbLocale) {
      setLocaleState(dbLocale);
      try {
        localStorage.setItem("NEXT_LOCALE", dbLocale);
      } catch (_e) {}
      return;
    }

    // 2. Guest / Unauthenticated User: read from localStorage or Cookie
    try {
      const savedLocale = localStorage.getItem("NEXT_LOCALE");
      if (savedLocale && ["es", "en", "pt"].includes(savedLocale)) {
        setLocaleState(savedLocale);
      }
    } catch (_e) {}
  }, [sessionUser?.id, dbLocale]);

  const setLocale = async (newLocale: string) => {
    setLocaleState(newLocale);

    // Save in localStorage for unauthenticated guest browsing
    try {
      localStorage.setItem("NEXT_LOCALE", newLocale);
    } catch (_e) {}

    // Save cookie for edge proxy & middleware routing
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Persist directly in User.locale database entity if logged in
    if (sessionUser?.id) {
      await updateUserLocale(sessionUser.id, newLocale);
      await updateSession({ locale: newLocale });
    }
  };

  const t = (path: string, fallback?: string): string => {
    const activeDict = dictionaries[locale] ?? dictionaries.es;
    const parts = path.split(".");
    let current: unknown = activeDict;

    for (const part of parts) {
      if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return fallback ?? path;
      }
    }

    return typeof current === "string" ? current : fallback ?? path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}

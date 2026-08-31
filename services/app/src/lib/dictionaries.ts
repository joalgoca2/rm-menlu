import es from "@/locales/es.json";
import en from "@/locales/en.json";

export type Dictionary = typeof es;

const dictionaries: Record<string, Dictionary> = {
  es,
  en,
};

/**
 * Returns the static JSON dictionary for a given locale (es / en).
 */
export async function getDictionary(locale = "es"): Promise<Dictionary> {
  return dictionaries[locale] ?? dictionaries.es;
}

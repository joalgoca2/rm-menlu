"use client";

import React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { useGuidedTour } from "@/components/providers/guided-tour-provider";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GuidedTourToggle({ compact }: { compact?: boolean }) {
  const { isActive, toggleTour, currentTour } = useGuidedTour();
  const { t } = useTranslation();

  const hasTour = Boolean(currentTour);

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={toggleTour}
      disabled={!hasTour}
      className={cn(
        "font-medium gap-1.5 transition-all duration-200 shrink-0 rounded-xl",
        compact ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-xs",
        isActive
          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs shadow-amber-500/20 border-amber-500"
          : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900",
        !hasTour && "opacity-50 cursor-not-allowed"
      )}
      title={
        !hasTour
          ? t("guidedTour.noTourAvailable", "No hay guía disponible para esta vista")
          : isActive
          ? t("guidedTour.disableTooltip", "Detener la ayuda guiada por pasos")
          : t("guidedTour.enableTooltip", "Iniciar la ayuda guiada por pasos")
      }
    >
      {isActive ? (
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-slate-950 shrink-0" />
      ) : (
        <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      )}
      <span className="hidden sm:inline text-xs">
        {t("guidedTour.toggleLabel", "Ayuda Sensei")}
      </span>
      <span
        className={cn(
          "px-1 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase",
          isActive
            ? "bg-slate-950/20 text-slate-950"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
        )}
      >
        {isActive ? t("common.on", "ON") : t("common.off", "OFF")}
      </span>
    </Button>
  );
}

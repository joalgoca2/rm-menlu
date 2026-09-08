"use client";

import React from "react";
import { HelpCircle, Sparkles } from "lucide-react";
import { useGuidedTour } from "@/components/providers/guided-tour-provider";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";

export function GuidedTourToggle() {
  const { isGuidedTourEnabled, toggleGuidedTour } = useGuidedTour();
  const { t } = useTranslation();

  return (
    <Button
      variant={isGuidedTourEnabled ? "default" : "outline"}
      size="sm"
      onClick={toggleGuidedTour}
      className={`h-9 px-3 text-xs font-medium gap-1.5 transition-all duration-200 ${
        isGuidedTourEnabled
          ? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
          : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
      title={
        isGuidedTourEnabled
          ? t("guidedTour.disableTooltip", "Desactivar la ayuda guiada paso a paso")
          : t("guidedTour.enableTooltip", "Activar la ayuda guiada para Sensei")
      }
    >
      {isGuidedTourEnabled ? (
        <Sparkles className="w-4 h-4 animate-pulse text-slate-950" />
      ) : (
        <HelpCircle className="w-4 h-4 text-amber-500" />
      )}
      <span>{t("guidedTour.toggleLabel", "Ayuda Sensei")}</span>
      <span
        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
          isGuidedTourEnabled
            ? "bg-slate-950/20 text-slate-950"
            : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}
      >
        {isGuidedTourEnabled ? t("common.on", "ON") : t("common.off", "OFF")}
      </span>
    </Button>
  );
}

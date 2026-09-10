"use client";

import React from "react";
import { Sparkles, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { useGuidedTour } from "@/components/providers/guided-tour-provider";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GuidedTourOverlay() {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    stopTour,
    currentTour,
  } = useGuidedTour();
  const { t } = useTranslation();

  if (!isActive || !currentStep || !currentTour) {
    return null;
  }

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  const pageTitle = t(
    currentTour.pageTitleKey,
    currentTour.defaultPageTitle
  );
  const stepTitle = t(
    currentStep.titleKey,
    currentStep.defaultTitle
  );
  const stepDesc = t(
    currentStep.descKey,
    currentStep.defaultDesc
  );

  return (
    <div
      className={
        "fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] sm:w-96 " +
        "bg-zinc-950/95 border border-amber-500/40 dark:bg-zinc-950/95 " +
        "dark:border-amber-500/40 text-white rounded-2xl p-4 shadow-2xl " +
        "backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      }
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30 text-amber-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-amber-400 tracking-wide uppercase">
              {t("guidedTour.senseiTitle", "Ayuda Sensei")}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[170px]">
              {pageTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 font-mono font-bold"
          >
            {currentStepIndex + 1} / {totalSteps}
          </Badge>
          <button
            type="button"
            onClick={stopTour}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            title={t("common.close", "Cerrar")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-1.5 mb-4">
        <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
          <span>{stepTitle}</span>
        </h4>
        <p className="text-xs text-zinc-300 leading-relaxed font-normal">
          {stepDesc}
        </p>
      </div>

      {/* Step Indicators & Action Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
        {/* Dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? "w-4 bg-amber-500"
                  : "w-1.5 bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          {!isFirstStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              className="h-8 px-2.5 text-xs border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              {t("guidedTour.prev", "Anterior")}
            </Button>
          )}

          <Button
            size="sm"
            onClick={nextStep}
            className="h-8 px-3 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
          >
            {isLastStep ? (
              <>
                <span>{t("guidedTour.finish", "Entendido")}</span>
                <Check className="w-3.5 h-3.5 ml-1" />
              </>
            ) : (
              <>
                <span>{t("guidedTour.next", "Siguiente")}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

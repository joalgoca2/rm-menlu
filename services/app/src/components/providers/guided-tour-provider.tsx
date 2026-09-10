"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DASHBOARD_TOURS } from "@/lib/config/guided-tours";
import type { PageTour, TourStep } from "@/lib/config/guided-tours";
import { GuidedTourOverlay } from "@/components/ui/guided-tour-overlay";

interface GuidedTourContextType {
  isActive: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentTour: PageTour | null;
  currentStep: TourStep | null;
  isPageCompleted: boolean;
  startTour: () => void;
  stopTour: () => void;
  toggleTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const GuidedTourContext = createContext<GuidedTourContextType>({
  isActive: false,
  currentStepIndex: 0,
  totalSteps: 0,
  currentTour: null,
  currentStep: null,
  isPageCompleted: false,
  startTour: () => {},
  stopTour: () => {},
  toggleTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
});

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedPages, setCompletedPages] = useState<Record<string, boolean>>({});

  const currentTour: PageTour | null = DASHBOARD_TOURS[pathname] || null;
  const totalSteps = currentTour?.steps.length || 0;
  const currentStep: TourStep | null =
    currentTour && currentTour.steps[currentStepIndex]
      ? currentTour.steps[currentStepIndex]
      : null;
  const isPageCompleted = Boolean(completedPages[pathname]);

  // Load completed pages from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("MENLU_COMPLETED_TOURS");
      if (saved) {
        setCompletedPages(JSON.parse(saved));
      }
    } catch {
      // Fallback silently if localStorage parsing fails
    }
  }, []);

  // When pathname changes, stop any active tour from previous page
  useEffect(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, [pathname]);

  const startTour = () => {
    if (currentTour && currentTour.steps.length > 0) {
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  };

  const stopTour = () => {
    setIsActive(false);
  };

  const toggleTour = () => {
    if (isActive) {
      stopTour();
    } else {
      startTour();
    }
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed current page tour
      const updated = { ...completedPages, [pathname]: true };
      setCompletedPages(updated);
      try {
        localStorage.setItem("MENLU_COMPLETED_TOURS", JSON.stringify(updated));
      } catch {
        // Fallback silently
      }
      setIsActive(false);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <GuidedTourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        totalSteps,
        currentTour,
        currentStep,
        isPageCompleted,
        startTour,
        stopTour,
        toggleTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
      <GuidedTourOverlay />
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour() {
  return useContext(GuidedTourContext);
}

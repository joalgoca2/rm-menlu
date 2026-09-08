"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface GuidedTourContextType {
  isGuidedTourEnabled: boolean;
  toggleGuidedTour: () => void;
  setGuidedTourEnabled: (enabled: boolean) => void;
}

const GuidedTourContext = createContext<GuidedTourContextType>({
  isGuidedTourEnabled: false,
  toggleGuidedTour: () => {},
  setGuidedTourEnabled: () => {},
});

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
  const [isGuidedTourEnabled, setIsGuidedTourEnabled] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("MENLU_GUIDED_TOUR");
    if (saved === "true") {
      setIsGuidedTourEnabled(true);
    }
  }, []);

  const toggleGuidedTour = () => {
    setIsGuidedTourEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("MENLU_GUIDED_TOUR", String(next));
      return next;
    });
  };

  const setGuidedTourEnabled = (enabled: boolean) => {
    setIsGuidedTourEnabled(enabled);
    localStorage.setItem("MENLU_GUIDED_TOUR", String(enabled));
  };

  return (
    <GuidedTourContext.Provider
      value={{
        isGuidedTourEnabled,
        toggleGuidedTour,
        setGuidedTourEnabled,
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour() {
  return useContext(GuidedTourContext);
}

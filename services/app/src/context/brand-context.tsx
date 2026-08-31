"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getBrandsList } from "@/actions/brand";

interface BrandItem {
  id: string;
  name: string;
  currency?: string;
}

interface BrandContextType {
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  brands: BrandItem[];
  isGlobalMode: boolean;
  isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const BRAND_STORAGE_KEY = "selected_brand_id";

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [selectedBrandId, setSelectedBrandIdState] = useState<string>("ALL");
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted brand choice from localStorage
    const savedBrandId = localStorage.getItem(BRAND_STORAGE_KEY);
    if (savedBrandId) {
      setSelectedBrandIdState(savedBrandId);
    }

    // Fetch active brands list from server
    getBrandsList()
      .then((res) => {
        if (res.success && res.data) {
          setBrands(res.data);
        }
      })
      .catch((_err: unknown) => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setSelectedBrandId = (id: string) => {
    setSelectedBrandIdState(id);
    localStorage.setItem(BRAND_STORAGE_KEY, id);
  };

  const isGlobalMode = selectedBrandId === "ALL";

  return (
    <BrandContext.Provider
      value={{
        selectedBrandId,
        setSelectedBrandId,
        brands,
        isGlobalMode,
        isLoading,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}

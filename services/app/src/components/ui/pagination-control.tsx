"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationControlProps) {
  const { t } = useTranslation();
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i += 1) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, safeCurrentPage - 1);
      let end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      if (safeCurrentPage <= 3) {
        start = 2;
        end = 4;
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        start = safeTotalPages - 3;
        end = safeTotalPages - 1;
      }

      if (start > 2) {
        pages.push("...");
      }

      for (let i = start; i <= end; i += 1) {
        pages.push(i);
      }

      if (end < safeTotalPages - 1) {
        pages.push("...");
      }

      pages.push(safeTotalPages);
    }

    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-sm text-zinc-400 select-none",
        className
      )}
    >
      {/* Left info: Page count & Page Size Selector */}
      <div className="flex items-center gap-3 text-xs">
        <div>
          {t("pagination.page", "Página")}{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">
            {safeCurrentPage}
          </span>{" "}
          {t("pagination.of", "de")}{" "}
          <span className="font-semibold text-zinc-900 dark:text-white">
            {safeTotalPages}
          </span>
        </div>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium hidden xs:inline">Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg py-1 px-2 font-bold text-zinc-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} registros
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right controls: Prev / Numbered Buttons / Next */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label={t("pagination.previous", "Anterior")}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("pagination.previous", "Anterior")}
          </span>
        </Button>

        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={`page-${page}`}
              variant={safeCurrentPage === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0 font-bold"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ) : (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-zinc-600 select-none"
            >
              ...
            </span>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label={t("pagination.next", "Siguiente")}
        >
          <span className="hidden sm:inline">
            {t("pagination.next", "Siguiente")}
          </span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

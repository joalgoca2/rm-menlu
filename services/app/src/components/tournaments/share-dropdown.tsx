"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link2, QrCode, Share2, ChevronDown, Check, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareDropdownProps {
  tournamentId: string;
  tournamentTitle: string;
}

export function ShareDropdown({ tournamentId, tournamentTitle }: ShareDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedEnrollment, setCopiedEnrollment] = useState(false);
  const [copiedStandings, setCopiedStandings] = useState(false);
  const [activeModal, setActiveModal] = useState<"enrollment" | "standings" | null>(null);
  const [origin, setOrigin] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getEnrollmentUrl = () => {
    const base = origin || "http://localhost:3000";
    return `${base}/dashboard/tournaments/${tournamentId}`;
  };

  const getStandingsUrl = () => {
    const base = origin || "http://localhost:3000";
    return `${base}/tournaments/${tournamentId}/standings`;
  };

  const handleCopyEnrollment = async () => {
    try {
      await navigator.clipboard.writeText(getEnrollmentUrl());
      setCopiedEnrollment(true);
      toast.success("Enlace de convocatoria/inscripción copiado.");
      setTimeout(() => setCopiedEnrollment(false), 2000);
    } catch {
      toast.error("Error al copiar enlace.");
    }
  };

  const handleCopyStandings = async () => {
    try {
      await navigator.clipboard.writeText(getStandingsUrl());
      setCopiedStandings(true);
      toast.success("Enlace de resultados en vivo copiado.");
      setTimeout(() => setCopiedStandings(false), 2000);
    } catch {
      toast.error("Error al copiar enlace.");
    }
  };

  const currentQrUrl =
    activeModal === "enrollment" ? getEnrollmentUrl() : getStandingsUrl();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    currentQrUrl
  )}`;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-10 px-4 rounded-xl font-bold text-xs shadow-xs",
          "border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800",
          "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80",
          "transition-all flex items-center justify-center gap-2 cursor-pointer"
        )}
        title="Opciones para Compartir Torneo"
        type="button"
      >
        <Share2 className="h-4 w-4 text-amber-500 shrink-0" />
        <span>Compartir</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 mt-2 w-64 rounded-2xl",
            "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
            "text-zinc-900 dark:text-white p-1.5 shadow-xl z-[100] backdrop-blur-xl",
            "animate-in fade-in slide-in-from-top-1 duration-100"
          )}
        >
          <div className="flex flex-col space-y-1">
           
            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

            {/* Copiar enlace resultados */}
            <button
              onClick={() => {
                handleCopyStandings();
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Link2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Copiar Enlace Resultados</span>
              </div>
              {copiedStandings && <Check className="h-4 w-4 text-emerald-500" />}
            </button>

            {/* QR resultados */}
            <button
              onClick={() => {
                setActiveModal("standings");
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Ver QR de Resultados</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal QR */}
      <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-3xl sm:max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-base text-zinc-900 dark:text-white">
              {activeModal === "enrollment"
                ? "QR Portal de Inscripción"
                : "QR Tabla de Posiciones y Resultados en Vivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-zinc-200">
              <img
                src={qrImageUrl}
                alt="QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-xs leading-relaxed">
              {activeModal === "enrollment"
                ? `Escanea para acceder a la inscripción y detalles de ${tournamentTitle}.`
                : `Escanea para consultar emparejamientos y tabla de posiciones en tiempo real de ${tournamentTitle}.`}
            </p>

            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-xs font-bold cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(currentQrUrl);
                  toast.success("Enlace copiado al portapapeles.");
                }}
              >
                <Copy className="h-4 w-4 mr-1.5" /> Copiar Enlace
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                onClick={() => {
                  window.open(currentQrUrl, "_blank");
                }}
              >
                <Link2 className="h-4 w-4 mr-1.5 text-zinc-950" /> Abrir Enlace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

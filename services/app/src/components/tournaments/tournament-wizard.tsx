"use client";

import React, { useState } from "react";
import {
  Check,
  ClipboardList,
  Settings,
  Users,
  Play,
  Flag,
  RefreshCw,
  Calculator,
  Scale,
  Swords,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateTournamentStatusAction } from "@/actions/tournaments";
import { TournamentPreflightModal } from "./tournament-preflight-modal";
import type { Tournament, TournamentCategory, TournamentParticipant } from "@/types";

interface Step {
  id: string;
  tabKey: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: "pending" | "current" | "completed";
}

interface TournamentWizardProps {
  tournament: Tournament;
  participantsCount: number;
  categoriesCount: number;
  categories?: TournamentCategory[];
  participants?: TournamentParticipant[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
}

export function TournamentWizard({
  tournament,
  participantsCount,
  categoriesCount,
  categories = [],
  participants = [],
  activeTab,
  onTabChange,
  onRefresh,
}: TournamentWizardProps) {
  const currentStatus = tournament.status || "DRAFT";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingNextStatus, setPendingNextStatus] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recalculateDialogOpen, setRecalculateDialogOpen] = useState(false);
  const [preflightDialogOpen, setPreflightDialogOpen] = useState(false);

  const steps: Step[] = [
    {
      id: "REGISTRATION",
      tabKey: "participants",
      title: "Registro",
      description: "Inscribe a los participantes",
      icon: Users,
      status: participantsCount > 0 ? "completed" : "current",
    },
    {
      id: "CONFIGURATION",
      tabKey: "categories",
      title: "Configuración",
      description: "Define categorías y reglas",
      icon: Settings,
      status:
        categoriesCount > 0
          ? "completed"
          : participantsCount > 0
          ? "current"
          : "pending",
    },
    {
      id: "VALIDATION",
      tabKey: "status",
      title: "Validación",
      description: "Confirma el set-up final",
      icon: ClipboardList,
      status:
        currentStatus !== "DRAFT"
          ? "completed"
          : categoriesCount > 0
          ? "current"
          : "pending",
    },
    {
      id: "ATTENDANCE",
      tabKey: "checkin",
      title: "Asistencia",
      description: "Registro presencial y pesaje",
      icon: Scale,
      status:
        currentStatus === "IN_PROGRESS" || currentStatus === "FINISHED"
          ? "completed"
          : currentStatus === "WEIGH_IN" || currentStatus === "REGISTRATION"
          ? "current"
          : "pending",
    },
    {
      id: "EXECUTION",
      tabKey: "brackets",
      title: "Ejecución",
      description: "Inicia pareos y combates",
      icon: Swords,
      status:
        currentStatus === "FINISHED"
          ? "completed"
          : currentStatus === "IN_PROGRESS"
          ? "current"
          : "pending",
    },
  ];

  const handleStatusTransition = async (nextStatus: string) => {
    if (nextStatus === "WEIGH_IN") {
      setPreflightDialogOpen(true);
      return;
    }
    if (nextStatus === "FINISHED" || (nextStatus === "IN_PROGRESS" && currentStatus === "FINISHED")) {
      setPendingNextStatus(nextStatus);
      setConfirmDialogOpen(true);
      return;
    }
    await executeStatusChange(nextStatus);
  };

  const executeStatusChange = async (nextStatus: string) => {
    setConfirmDialogOpen(false);
    setIsSubmitting(true);
    try {
      const res = await updateTournamentStatusAction(tournament.id, nextStatus);
      if (res.success) {
        toast.success("Estatus del torneo actualizado exitosamente.");
        onRefresh();
      } else {
        toast.error(res.error || "Error al actualizar estado del torneo.");
      }
    } catch {
      toast.error("Error inesperado en servidor.");
    } finally {
      setIsSubmitting(false);
      setPendingNextStatus(null);
    }
  };

  const handleRecalculate = () => {
    setRecalculateDialogOpen(false);
    toast.success("Posiciones y llaves sincronizadas correctamente.");
    onRefresh();
  };

  return (
    <div
      className={
        "bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 " +
        "shadow-xs rounded-3xl p-5 md:p-6 space-y-6 backdrop-blur-xl"
      }
    >
      {/* Wizard Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-white flex flex-wrap items-center gap-2">
            Flujo de Orquestación
            <span
              className={
                "text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 " +
                "border border-amber-500/20 px-2 py-0.5 rounded-full uppercase " +
                "font-extrabold tracking-wider"
              }
            >
              Guía del Organizador
            </span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sigue los pasos o haz clic en cualquiera para navegar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
          {currentStatus === "DRAFT" && (
            <Button
              onClick={() => handleStatusTransition("REGISTRATION")}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <Users className="mr-1.5 h-4 w-4 shrink-0" /> Iniciar Convocatoria
            </Button>
          )}

          {currentStatus === "REGISTRATION" && (
            <Button
              onClick={() => handleStatusTransition("WEIGH_IN")}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <Scale className="mr-1.5 h-4 w-4 shrink-0" /> Iniciar Pesaje / Asistencia
            </Button>
          )}

          {currentStatus === "WEIGH_IN" && (
            <Button
              onClick={() => handleStatusTransition("IN_PROGRESS")}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <Swords className="mr-1.5 h-4 w-4 shrink-0" /> Iniciar Combates
            </Button>
          )}

          {currentStatus === "IN_PROGRESS" && (
            <Button
              onClick={() => handleStatusTransition("FINISHED")}
              disabled={isSubmitting}
              variant="outline"
              className="border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer w-full sm:w-auto"
            >
              <Flag className="mr-1.5 h-4 w-4 shrink-0" /> Finalizar Torneo
            </Button>
          )}

          {currentStatus === "FINISHED" && (
            <Button
              onClick={() => handleStatusTransition("IN_PROGRESS")}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer shadow-xs w-full sm:w-auto"
            >
              <RefreshCw className="mr-1.5 h-4 w-4 shrink-0" /> Reanudar Torneo
            </Button>
          )}

          <Button
            onClick={() => setRecalculateDialogOpen(true)}
            disabled={isSubmitting}
            variant="outline"
            className={
              "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 " +
              "hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-10 px-3.5 " +
              "text-xs font-bold cursor-pointer shrink-0 w-full sm:w-auto"
            }
            title="Recalcular puntos y posiciones"
          >
            <Calculator className="mr-1.5 h-4 w-4 text-amber-500 shrink-0" />
            Recalcular Posiciones
          </Button>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="relative pt-2">
        <div className="absolute top-7 left-10 right-10 h-0.5 bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
          {steps.map((step) => {
            const isActiveTab = activeTab === step.tabKey;

            return (
              <div
                key={step.id}
                onClick={() => onTabChange(step.tabKey)}
                className={
                  `relative flex flex-row md:flex-col items-center gap-3 md:gap-3 md:text-center ` +
                  `group cursor-pointer select-none transition-all p-2.5 rounded-2xl ` +
                  `${
                    isActiveTab
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                  }`
                }
                title={`Ir a ${step.title}`}
              >
                <div
                  className={
                    `h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 z-10 ` +
                    `${
                      step.status === "completed"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : step.status === "current"
                        ? "bg-amber-500 border-amber-500 text-zinc-950 font-extrabold shadow-md shadow-amber-500/25 scale-105"
                        : "bg-zinc-100 border-zinc-300 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-500"
                    }`
                  }
                >
                  {step.status === "completed" ? (
                    <Check className="h-4 w-4 stroke-[3] text-white" />
                  ) : (
                    <step.icon className={`h-4 w-4 ${step.status === "current" ? "text-zinc-950 stroke-[2.5]" : ""}`} />
                  )}
                </div>

                <div className="space-y-0.5 text-left md:text-center">
                  <h4
                    className={
                      `text-xs font-bold transition-colors ` +
                      `${
                        step.status === "completed"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : step.status === "current"
                          ? "text-amber-700 dark:text-amber-400 font-extrabold"
                          : "text-zinc-400 dark:text-zinc-500 font-medium"
                      }`
                    }
                  >
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight max-w-[160px] md:max-w-[130px] md:mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal for Finalize/Resume */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <Flag className="h-5 w-5 text-amber-500" />
              {pendingNextStatus === "FINISHED"
                ? "¿Finalizar Torneo?"
                : "¿Reanudar Torneo?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm">
              {pendingNextStatus === "FINISHED"
                ? "¿Estás seguro de que deseas finalizar este torneo? Esto consolidará los resultados finales y reconocimientos."
                : "¿Estás seguro de que deseas reanudar este torneo? Volverá al estado 'En Ejecución' para registrar resultados adicionales."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-bold cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNextStatus) {
                  executeStatusChange(pendingNextStatus);
                }
              }}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-5 cursor-pointer"
            >
              {pendingNextStatus === "FINISHED" ? "Finalizar Torneo" : "Reanudar Torneo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recalculate Modal */}
      <AlertDialog open={recalculateDialogOpen} onOpenChange={setRecalculateDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <Calculator className="h-5 w-5 text-amber-500" />
              ¿Recalcular Posiciones del Torneo?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm space-y-2">
              <span className="block">
                Esta acción reconstruirá y verificará la tabla de posiciones y llaves de combate de todas las categorías basándose en los enfrentamientos registrados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl text-xs font-bold cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRecalculate}
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs px-5 cursor-pointer"
            >
              Ejecutar Recálculo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pre-Flight Category Audit & Quorum Modal */}
      {preflightDialogOpen && (
        <TournamentPreflightModal
          open={preflightDialogOpen}
          onOpenChange={setPreflightDialogOpen}
          tournamentId={tournament.id}
          categories={categories}
          participants={participants}
          onConfirmProceed={async () => {
            await executeStatusChange("WEIGH_IN");
          }}
          onSuccessClean={onRefresh}
          onGoToCategories={() => {
            setPreflightDialogOpen(false);
            onTabChange("categories");
          }}
        />
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  manageBrandPlanAction,
  deleteBrandPlanAction,
} from "@/actions/brand-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit2, Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { BrandPlanConfig, BrandPortalData } from "@/types";

interface BrandPlanManagerProps {
  brand: BrandPortalData;
}

export function BrandPlanManager({ brand }: BrandPlanManagerProps) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<BrandPlanConfig[]>(brand.plans);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BrandPlanConfig | null>(null);

  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number>(500);
  const [priceYearly, setPriceYearly] = useState<number>(5000);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const handleOpenPlanModal = (plan?: BrandPlanConfig) => {
    if (plan) {
      setEditingPlan(plan);
      setName(plan.name);
      setDescription(plan.description || "");
      setPriceMonthly(plan.priceMonthly);
      setPriceYearly(plan.priceYearly);
    } else {
      if (plans.length >= 10) {
        toast.error(
          t(
            "brandAdminPayments.maxLimitReached",
            "Has alcanzado el límite máximo de 10 membresías creadas."
          )
        );
        return;
      }
      setEditingPlan(null);
      setName("");
      setDescription("");
      setPriceMonthly(500);
      setPriceYearly(5000);
    }
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingPlan(true);

    try {
      const res = await manageBrandPlanAction({
        id: editingPlan?.id,
        name,
        description,
        priceMonthly: Number(priceMonthly),
        priceYearly: Number(priceYearly),
        currency: brand.currency,
        isActive: true,
      });

      if (res.success && res.data) {
        if (editingPlan) {
          setPlans(plans.map((p) => (p.id === res.data!.id ? res.data! : p)));
        } else {
          setPlans([...plans, res.data]);
        }
        setIsPlanModalOpen(false);
        toast.success(t("brandAdminPayments.planSaved", "¡Membresía guardada exitosamente!"));
      } else {
        toast.error(res.error || t("brandAdminPayments.planError", "Error al guardar membresía."));
      }
    } catch (_err) {
      toast.error(t("brandAdminPayments.planError", "Error de red al guardar membresía."));
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlanId) return;
    setIsDeletingPlan(true);

    try {
      const res = await deleteBrandPlanAction(deletingPlanId);
      if (res.success) {
        setPlans(plans.filter((p) => p.id !== deletingPlanId));
        toast.success(t("brandAdminPayments.planDeleted", "¡Membresía eliminada exitosamente!"));
      } else {
        toast.error(res.error || t("brandAdminPayments.planDeleteError", "Error al eliminar."));
      }
    } catch (_err) {
      toast.error(t("brandAdminPayments.planDeleteError", "Error de red al eliminar."));
    } finally {
      setIsDeletingPlan(false);
      setDeletingPlanId(null);
    }
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Brand Plans Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <span>{t("brandAdminPayments.plansTitle", "Membresías & Tarifas de la Marca")}</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">({plans.length}/10)</span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("brandAdminPayments.plansSubtitle", "Crea y edita los paquetes que verán tus clientes en tu portal.")}
          </p>
        </div>

        <Button
          id="add-brand-plan-btn"
          onClick={() => handleOpenPlanModal()}
          disabled={plans.length >= 10}
          className="rounded-2xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span>{t("brandAdminPayments.createPlan", "Nueva Membresía")}</span>
        </Button>
      </div>

      {/* Brand Plans Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">{p.name}</h4>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPlanModal(p)}
                    className="h-8 w-8 p-0 rounded-xl"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-zinc-500 hover:text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingPlanId(p.id)}
                    className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {p.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">{p.description}</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex justify-between items-baseline">
              <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                ${p.priceMonthly} {p.currency}
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">/ mes</span>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingPlan ? t("brandAdminPayments.editPlan", "Editar Membresía") : t("brandAdminPayments.newPlan", "Nueva Membresía")}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              {t("brandAdminPayments.planFormDesc", "Define el nombre, descripción y precio de este paquete.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="planName" className="text-xs font-semibold">Nombre de la Membresía</Label>
              <Input
                id="planName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Membresía Mensual Gimnasio"
                required
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="planDesc" className="text-xs font-semibold">Descripción (Opcional)</Label>
              <Textarea
                id="planDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. Acceso ilimitado a pesas y cardio de Lunes a Sábado."
                className="rounded-xl text-xs resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="priceMonthly" className="text-xs font-semibold">Precio Mensual ({brand.currency})</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(Number(e.target.value))}
                  required
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="priceYearly" className="text-xs font-semibold">Precio Anual ({brand.currency})</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(Number(e.target.value))}
                  required
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-xl text-xs"
              >
                {t("common.cancel", "Cancelar")}
              </Button>
              <Button
                type="submit"
                id="save-brand-plan-submit-btn"
                disabled={isSavingPlan}
                className="rounded-xl text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isSavingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{t("common.save", "Guardar")}</span>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirmation AlertDialog */}
      <AlertDialog open={Boolean(deletingPlanId)} onOpenChange={() => setDeletingPlanId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>¿Eliminar Membresía?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              Esta acción eliminará el paquete del catálogo de tu marca. Los pagos
              históricos realizados por tus clientes conservarán su concepto y monto
              intactos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-plan-btn"
              disabled={isDeletingPlan}
              onClick={handleDeletePlan}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeletingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Eliminar Membresía</span>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

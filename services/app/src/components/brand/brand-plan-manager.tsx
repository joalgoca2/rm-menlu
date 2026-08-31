"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  manageBrandPlanAction,
  deleteBrandPlanAction,
  updateBrandSlugAction,
  checkBrandSlugAvailabilityAction,
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
import { Plus, Edit2, Trash2, Globe, Copy, Check, Lock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { BrandPlanConfig, BrandPortalData } from "@/types";

interface BrandPlanManagerProps {
  brand: BrandPortalData;
}

export function BrandPlanManager({ brand }: BrandPlanManagerProps) {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<BrandPlanConfig[]>(brand.plans);
  const [currentSlug, setCurrentSlug] = useState(brand.slug);
  const [isSlugLocked, setIsSlugLocked] = useState(brand.isSlugLocked);

  const [slugInput, setSlugInput] = useState(brand.slug);
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BrandPlanConfig | null>(null);

  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState<number>(500);
  const [priceYearly, setPriceYearly] = useState<number>(5000);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/brand/${currentSlug}`
    : `/brand/${currentSlug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success(t("brandAdminPayments.linkCopied", "¡Enlace del portal copiado!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = async () => {
    if (!slugInput.trim()) return;
    setIsSavingSlug(true);

    try {
      const availRes = await checkBrandSlugAvailabilityAction(slugInput, brand.id);
      if (!availRes.success || !availRes.data?.available) {
        toast.error(
          t(
            "brandAdminPayments.slugUnavailable",
            `El slug '${slugInput}' ya existe. Te sugerimos: ${availRes.data?.suggestedSlug}`
          )
        );
        setIsSavingSlug(false);
        return;
      }

      const res = await updateBrandSlugAction(brand.id, slugInput);
      if (res.success && res.data) {
        setCurrentSlug(res.data.slug);
        setIsSlugLocked(true);
        setIsSlugEditing(false);
        toast.success(t("brandAdminPayments.slugSaved", "¡Slug de marca guardado exitosamente!"));
      } else {
        toast.error(res.error || t("brandAdminPayments.slugError", "Error al guardar slug."));
      }
    } catch (_err) {
      toast.error(t("brandAdminPayments.slugError", "Error de red al guardar slug."));
    } finally {
      setIsSavingSlug(false);
    }
  };

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
      {/* Brand Public Link & Slug Control Card */}
      <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {t("brandAdminPayments.publicPortalTitle", "Enlace Público Marca Blanca")}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
              {t(
                "brandAdminPayments.publicPortalDesc",
                "Comparte este enlace con tus clientes para que se inscriban y paguen sus membresías sin ver branding del SaaS."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              id="copy-brand-public-url-btn"
              onClick={handleCopyUrl}
              className="rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              <span>{copied ? t("common.copied", "Copiado") : t("brandAdminPayments.copyLink", "Copiar Enlace")}</span>
            </Button>

            {!isSlugLocked && (
              <Button
                id="edit-brand-slug-btn"
                variant="outline"
                onClick={() => setIsSlugEditing(!isSlugEditing)}
                className="rounded-2xl text-xs font-bold"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                <span>{t("brandAdminPayments.customizeSlug", "Personalizar Slug")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Slug Customization Form */}
        {isSlugEditing && !isSlugLocked && (
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3 top-2.5 text-xs text-zinc-400 font-mono">/brand/</span>
              <Input
                id="custom-slug-input"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="mi-gimnasio"
                className="pl-16 rounded-xl font-mono text-xs"
              />
            </div>
            <Button
              id="save-custom-slug-btn"
              onClick={handleSaveSlug}
              disabled={isSavingSlug}
              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
            >
              {isSavingSlug ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{t("common.save", "Guardar y Bloquear")}</span>}
            </Button>
          </div>
        )}

        {isSlugLocked && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>{t("brandAdminPayments.slugLockedInfo", "Slug personalizado e inmutable:")}</span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">/brand/{currentSlug}</span>
          </p>
        )}
      </div>

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
              Esta acción eliminará el paquete del catálogo de tu marca. Los pagos históricos realizados por tus clientes conservarán su concepto y monto intactos.
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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Edit2, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createBrandWithSubscriptionAction,
  updateBrandWithSubscriptionAction,
  type BrandWithUsersCount,
} from "@/actions/brand";
import { getPlanConfigs } from "@/actions/billing";
import type { PlanConfig } from "@/types";
import { toast } from "sonner";

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandToEdit?: BrandWithUsersCount | null;
  onSuccess: () => void;
}

export function BrandFormDialog({
  open,
  onOpenChange,
  brandToEdit,
  onSuccess,
}: BrandFormDialogProps) {
  const isEditing = !!brandToEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planConfigs, setPlanConfigs] = useState<PlanConfig[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [planName, setPlanName] = useState("Free");
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [price, setPrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const finalPrice = Math.max(0, price * (1 - discount / 100));

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPlanConfigs();
      if (res.success && res.data) {
        setPlanConfigs(res.data.plans);
      }
    } catch (_err) {}
  }, []);

  useEffect(() => {
    if (open) {
      fetchPlans();
      if (isEditing && brandToEdit) {
        setName(brandToEdit.name);
        setDescription(brandToEdit.description || "");
        setCurrency(brandToEdit.currency || "USD");
        if (brandToEdit.subscription) {
          setPlanName(brandToEdit.subscription.planName || "Free");
          setBillingCycle(brandToEdit.subscription.billingCycle || "MONTHLY");
          setPrice(brandToEdit.subscription.price || 0);
          setDiscount(brandToEdit.subscription.discount || 0);
          setStartDate(
            new Date(brandToEdit.subscription.startDate)
              .toISOString()
              .split("T")[0]
          );
          setEndDate(
            new Date(brandToEdit.subscription.endDate)
              .toISOString()
              .split("T")[0]
          );
        }
      } else {
        setName("");
        setDescription("");
        setCurrency("USD");
        setPlanName("Free");
        setBillingCycle("MONTHLY");
        setPrice(0);
        setDiscount(0);
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        );
      }
    }
  }, [open, isEditing, brandToEdit, fetchPlans]);

  const applyPlanTemplate = (selectedName: string) => {
    const config = planConfigs.find((p) => p.planName === selectedName);
    if (config) {
      setPrice(config.priceMonthly);
    } else {
      if (selectedName === "Free") setPrice(0);
      else if (selectedName === "Pro") setPrice(29);
      else if (selectedName === "Enterprise") setPrice(99);
    }
    setPlanName(selectedName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    try {
      let res;
      if (isEditing && brandToEdit) {
        res = await updateBrandWithSubscriptionAction(brandToEdit.id, {
          name,
          description,
          currency,
          planName,
          billingCycle,
          price,
          discount,
          startDate,
          endDate,
        });
      } else {
        res = await createBrandWithSubscriptionAction({
          name,
          description,
          currency,
          planName,
          billingCycle,
          price,
          discount,
          startDate,
          endDate,
        });
      }

      if (res.success) {
        toast.success(
          isEditing
            ? "Marca y suscripción actualizadas exitosamente."
            : "Nueva marca registrada exitosamente."
        );
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(res.error ?? "No se pudo guardar la marca.");
      }
    } catch (_err) {
      toast.error("Error inesperado al guardar la marca.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden rounded-3xl shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              {isEditing ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                {isEditing ? "Editar Marca y Suscripción" : "Nueva Marca y Suscripción"}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-zinc-500">
                Configura los límites del plan operativo y el ciclo de facturación.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Plan Templates */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Plantillas de Plan Rápido
              </Label>
              <div className="flex flex-wrap gap-2">
                {(planConfigs.length > 0
                  ? planConfigs.map((p) => p.planName)
                  : ["Free", "Pro", "Enterprise"]
                ).map((pName) => (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => applyPlanTemplate(pName)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer",
                      planName === pName
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                    )}
                  >
                    {pName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Brand Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>Información Comercial de la Marca</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="brand-name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nombre de la Empresa / Organización
                </Label>
                <Input
                  id="brand-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Acme Corporation"
                  className="rounded-xl font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Moneda de Facturación
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="MXN">MXN ($)</SelectItem>
                    <SelectItem value="COP">COP ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-desc" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Descripción / Razón Social (Opcional)
              </Label>
              <Input
                id="brand-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Soluciones corporativas de tecnología"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Subscription & Pricing Group */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-zinc-200 dark:border-zinc-800 pb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Configuración de Suscripción & Facturación</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Plan de Precios
                </Label>
                <Select value={planName} onValueChange={applyPlanTemplate}>
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue placeholder="Selecciona un plan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Plan Gratuito (Free)</SelectItem>
                    <SelectItem value="Pro">Plan Pro</SelectItem>
                    <SelectItem value="Enterprise">Plan Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Ciclo de Facturación
                </Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger className="rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensual (MONTHLY)</SelectItem>
                    <SelectItem value="YEARLY">Anual (YEARLY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Precio Base ($USD)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Descuento (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Precio Final ($USD)
                </Label>
                <div className="h-10 px-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  ${finalPrice.toFixed(2)} USD
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Fecha de Inicio
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Fecha de Vencimiento
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Marca"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

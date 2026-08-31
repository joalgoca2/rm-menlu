"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getBrandPaymentConfigsListAction,
  deleteBrandPaymentConfigAction,
  toggleBrandPaymentConfigStatusAction,
  type BrandPaymentConfigItem,
} from "@/actions/payment-engine";
import { BrandPaymentConfigDialog } from "@/components/payment/brand-payment-config-dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { FormattedDate } from "@/components/ui/formatted-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";
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
import { useTranslation } from "@/components/providers/i18n-provider";

interface BrandPaymentGatewaysListProps {
  brandId: string;
  isSuperAdmin?: boolean;
}

export function BrandPaymentGatewaysList({
  brandId,
  isSuperAdmin = false,
}: BrandPaymentGatewaysListProps) {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<BrandPaymentConfigItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BrandPaymentConfigItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchConfigs = useCallback(
    async (page: number) => {
      if (!brandId) return;
      setIsLoading(true);
      try {
        const res = await getBrandPaymentConfigsListAction({
          brandId,
          page,
          limit: 6,
        });

        if (res.success && res.data) {
          setConfigs(res.data.configs);
          setTotalPages(res.data.totalPages);
          setTotalRecords(res.data.total);
          setCurrentPage(res.data.page);
        } else {
          toast.error(res.error ?? t("paymentGateways.errorLoading", "No se pudieron cargar las pasarelas."));
        }
      } catch (_err) {
        toast.error(t("paymentGateways.errorFetch", "Error al obtener la lista de pasarelas."));
      } finally {
        setIsLoading(false);
      }
    },
    [brandId, t]
  );

  useEffect(() => {
    fetchConfigs(currentPage);
  }, [currentPage, fetchConfigs]);

  const handleToggleStatus = async (configId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // Optimistic state update
    setConfigs((prev) =>
      prev.map((c) => (c.id === configId ? { ...c, isActive: nextStatus } : c))
    );

    try {
      const res = await toggleBrandPaymentConfigStatusAction(configId, nextStatus);
      if (res.success) {
        toast.success(
          nextStatus
            ? t("paymentGateways.enabledToast", "¡Pasarela activada exitosamente!")
            : t("paymentGateways.disabledToast", "Pasarela desactivada.")
        );
      } else {
        // Rollback
        setConfigs((prev) =>
          prev.map((c) => (c.id === configId ? { ...c, isActive: currentStatus } : c))
        );
        toast.error(res.error || t("paymentGateways.toggleError", "Error al cambiar estado."));
      }
    } catch (_err) {
      setConfigs((prev) =>
        prev.map((c) => (c.id === configId ? { ...c, isActive: currentStatus } : c))
      );
      toast.error(t("paymentGateways.toggleError", "Error de red al cambiar estado."));
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteBrandPaymentConfigAction(deletingId);
      if (res.success) {
        toast.success(t("paymentGateways.deleteSuccess", "Pasarela eliminada correctamente."));
        setDeletingId(null);
        fetchConfigs(currentPage);
      } else {
        toast.error(res.error ?? t("paymentGateways.deleteError", "No se pudo eliminar la pasarela."));
      }
    } catch (_err) {
      toast.error(t("paymentGateways.deleteError", "Error al eliminar la pasarela."));
    } finally {
      setIsDeleting(false);
    }
  };

  const getGatewayColor = (provider: string) => {
    switch (provider) {
      case "CLIP":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "STRIPE":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "MERCADOPAGO":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "PSE":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/90 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {t("paymentGateways.title", `Pasarelas de Pago Configuradas (${totalRecords})`).replace(
                "{count}",
                String(totalRecords)
              )}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t(
              "paymentGateways.subtitle",
              "Administra las credenciales privadas y activas de tu empresa para recibir cobros."
            )}
          </p>
        </div>

        {isSuperAdmin && (
          <Button
            onClick={() => {
              setEditingConfig(null);
              setIsConfigModalOpen(true);
            }}
            className="font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t("paymentGateways.addGatewayBtn", "Agregar Pasarela")}</span>
          </Button>
        )}
      </div>

      {/* Grid of Configured Gateways */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center p-12 bg-white/90 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
          <CreditCard className="h-10 w-10 text-zinc-400 mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            {t("paymentGateways.emptyTitle", "Sin Pasarelas de Pago Configuradas")}
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {t(
              "paymentGateways.emptyDescAdmin",
              "Las pasarelas son asignadas por el SuperAdmin. Una vez asignada una pasarela a tu marca, podrás ingresar tus claves de cobro y activarla."
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${getGatewayColor(
                      config.gatewayType
                    )}`}
                  >
                    {config.gatewayType}
                  </Badge>

                  {/* Interactive Instant Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(config.id, config.isActive)}
                    className="cursor-pointer focus:outline-none transition-transform active:scale-95"
                    title={config.isActive ? "Desactivar pasarela" : "Activar pasarela"}
                  >
                    {config.isActive ? (
                      <Badge className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold gap-1 rounded-lg">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{t("paymentGateways.activeBadge", "Activa")}</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold gap-1 rounded-lg">
                        <XCircle className="h-3 w-3" />
                        <span>{t("paymentGateways.inactiveBadge", "Inactiva")}</span>
                      </Badge>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    {t("paymentGateways.publicKeyLabel", "Llave Pública")}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <Key className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{config.publicKeyPreview}</span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 flex justify-between pt-1">
                  <span>{t("paymentGateways.updatedLabel", "Actualizado:")}</span>
                  <FormattedDate date={config.updatedAt} format="PP" />
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingConfig(config);
                    setIsConfigModalOpen(true);
                  }}
                  className="h-8 text-xs font-bold gap-1 rounded-xl"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>{t("common.edit", "Editar Llaves")}</span>
                </Button>
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingId(config.id)}
                    className="h-8 text-xs font-bold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Always Visible Pagination Control */}
      <div className="flex justify-center pt-2">
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Config Dialog */}
      {isConfigModalOpen && (
        <BrandPaymentConfigDialog
          isOpen={isConfigModalOpen}
          onClose={() => {
            setIsConfigModalOpen(false);
            setEditingConfig(null);
          }}
          brandId={brandId}
          initialGatewayType={editingConfig?.gatewayType}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => {
            fetchConfigs(currentPage);
          }}
        />
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={Boolean(deletingId)} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>¿Eliminar Configuración de Pasarela?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 dark:text-zinc-400">
              {t(
                "brandPaymentGateways.confirmDeleteDesc",
                "Esta acción eliminará las credenciales de la pasarela para esta empresa."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

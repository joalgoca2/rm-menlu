"use client";

import React, { useState } from "react";
import type { BrandPaymentConfigItem } from "@/actions/payment-engine";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteBrandPaymentConfigAction,
  toggleBrandPaymentConfigStatusAction,
} from "@/actions/payment-engine";
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
import {
  LayoutGrid,
  List,
  Search,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  ShieldCheck,
  PowerOff,
  Trash2,
} from "lucide-react";
import { FormattedDate } from "@/components/ui/formatted-date";
import { toast } from "sonner";

import { PaginationControl } from "@/components/ui/pagination-control";

interface BrandPaymentConfigsContainerProps {
  configs: BrandPaymentConfigItem[];
  total: number;
  currentPage: number;
  totalPages: number;
  currentSearch: string;
  onSearchSubmit: (search: string) => void;
  onPageChange: (page: number) => void;
  onOpenConfigModal: (brandId?: string) => void;
}

export function BrandPaymentConfigsContainer({
  configs,
  total: _total,
  currentPage,
  totalPages,
  currentSearch,
  onSearchSubmit,
  onPageChange,
  onOpenConfigModal,
}: BrandPaymentConfigsContainerProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [deletingConfigId, setDeletingConfigId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchInput);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConfigId) return;
    setIsDeleting(true);
    try {
      const res = await deleteBrandPaymentConfigAction(deletingConfigId);
      if (res.success) {
        toast.success(
          res.message ?? "Configuración de pasarela eliminada correctamente."
        );
        setDeletingConfigId(null);
        onSearchSubmit(currentSearch);
      } else {
        toast.error(res.error ?? "No se pudo eliminar la configuración.");
      }
    } catch (_err) {
      toast.error("Error al eliminar la configuración.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (configId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await toggleBrandPaymentConfigStatusAction(configId, nextStatus);
      if (res.success) {
        toast.success(
          nextStatus
            ? t("paymentEngineDetails.enabledSuperToast", "¡Pasarela activada exitosamente para la marca!")
            : t("paymentEngineDetails.disabledSuperToast", "Pasarela desactivada para la marca.")
        );
        onSearchSubmit(currentSearch);
      } else {
        toast.error(res.error || t("paymentEngineDetails.toggleErrorText", "Error al cambiar el estado de la pasarela."));
      }
    } catch (_err) {
      toast.error(t("paymentEngineDetails.toggleErrorText", "Error al cambiar el estado de la pasarela."));
    }
  };

  return (
    <div className="space-y-4">
      {/* Container Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <form
            onSubmit={handleSearchFormSubmit}
            className="flex items-center gap-2 flex-1 max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder={t("common.search", "Buscar marca o pasarela...")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="h-9 px-3 text-xs font-bold rounded-xl shrink-0 border-zinc-200 dark:border-zinc-700"
            >
              {t("common.searchBtn", "Buscar")}
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle Group */}
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title={t("common.cardsViewTitle", "Vista de Tarjetas")}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t("common.cardsView", "Cards")}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
              title={t("common.tableViewTitle", "Vista de Tabla")}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t("common.tableView", "Tabla")}</span>
            </button>
          </div>

          <Button
            onClick={() => onOpenConfigModal()}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 px-3 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t("paymentEngineDetails.addConfig", "Configurar Pasarela Cliente")}</span>
          </Button>
        </div>
      </div>

      {/* Content View Modes */}
      {configs.length === 0 ? (
        <div className="p-12 text-center text-zinc-400 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl">
          <CreditCard className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
          <p className="text-xs italic">
            {t(
              "paymentEngineDetails.emptyConfigs",
              "No hay pasarelas de pago habilitadas para marcas clientes."
            )}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* CARDS VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((c) => (
            <div
              key={c.id}
              className="p-6 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-sm space-y-4 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {c.brandName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(c.id, c.isActive)}
                  className="cursor-pointer focus:outline-none transition-transform active:scale-95"
                  title={
                    c.isActive
                      ? t("paymentEngineDetails.toggleDisableTitle", "Desactivar pasarela para la marca")
                      : t("paymentEngineDetails.toggleEnableTitle", "Activar pasarela para la marca")
                  }
                >
                  {c.isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t("paymentEngineDetails.enabledBadgeText", "Habilitada")}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20">
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>{t("paymentEngineDetails.disabledBadgeText", "Deshabilitada")}</span>
                    </span>
                  )}
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>{t("paymentEngineDetails.colProvider", "Proveedor")}:</span>
                  <span className="font-bold text-zinc-900 dark:text-white uppercase">
                    {c.gatewayType}
                  </span>
                </div>

                <div className="flex justify-between text-zinc-500">
                  <span>{t("paymentEngineDetails.colPublicKey", "API Key Pública")}:</span>
                  <span className="font-mono text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    {c.publicKeyPreview === "NOT_CONFIGURED" || c.publicKeyPreview === "Sin configurar" || !c.publicKeyPreview
                      ? t("paymentEngineDetails.saasNotConfigured", "Sin configurar")
                      : c.publicKeyPreview}
                  </span>
                </div>

                <div className="flex items-center justify-between text-zinc-500 pt-1">
                  <span>{t("paymentEngineDetails.colKeysStatus", "Estado Llaves")}:</span>
                  {c.hasCredentials ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t("paymentEngineDetails.saasRegistered", "Configuradas")}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Clock className="w-3 h-3" />
                      <span>{t("paymentEngineDetails.saasNotRegistered", "Pendiente Captura")}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingConfigId(c.id)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-8 w-8 p-0 rounded-xl"
                  title={t("paymentEngineDetails.deleteBtn", "Eliminar configuración de pasarela")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenConfigModal(c.brandId)}
                  className="text-xs font-semibold rounded-xl h-8"
                >
                  {t("paymentEngineDetails.manageBtn", "Administrar Pasarela")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW MODE */
        <div className="bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colBrand", "Empresa / Marca")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colProvider", "Proveedor")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colStatus", "Estatus")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colPublicKey", "API Key Pública")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colKeysStatus", "Estado Llaves")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">
                  {t("paymentEngineDetails.colUpdated", "Actualizado")}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">
                  {t("paymentEngineDetails.colActions", "Acciones")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {configs.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                >
                  <TableCell className="font-bold text-xs text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{c.brandName}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-bold uppercase">
                    {c.gatewayType}
                  </TableCell>

                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id, c.isActive)}
                      className="cursor-pointer focus:outline-none transition-transform active:scale-95"
                      title={
                        c.isActive
                          ? t("paymentEngineDetails.toggleDisableTitle", "Desactivar pasarela para la marca")
                          : t("paymentEngineDetails.toggleEnableTitle", "Activar pasarela para la marca")
                      }
                    >
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t("paymentEngineDetails.enabledBadgeText", "Habilitada")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/20">
                          <PowerOff className="w-3.5 h-3.5" />
                          <span>{t("paymentEngineDetails.disabledBadgeText", "Deshabilitada")}</span>
                        </span>
                      )}
                    </button>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    {c.publicKeyPreview}
                  </TableCell>

                  <TableCell>
                    {c.hasCredentials ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t("paymentEngineDetails.saasRegistered", "Configuradas")}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        <span>{t("paymentEngineDetails.saasNotRegistered", "Pendiente Captura")}</span>
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-zinc-500">
                    <FormattedDate date={c.updatedAt} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingConfigId(c.id)}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-8 w-8 p-0 rounded-xl"
                        title={t("paymentEngineDetails.deleteBtn", "Eliminar configuración de pasarela")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenConfigModal(c.brandId)}
                        className="text-xs font-semibold rounded-xl h-8"
                      >
                        {t("paymentEngineDetails.manageBtn", "Administrar Pasarela")}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mandatory Server-Side Pagination Control */}
      <div className="p-4 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-2xl shadow-sm">
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(deletingConfigId)}
        onOpenChange={(open) => !open && setDeletingConfigId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("paymentEngine.confirmDeleteTitle", "¿Eliminar configuración de pasarela?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "paymentEngine.confirmDeleteDesc",
                "Esta acción eliminará los accesos y credenciales de pasarela configurados para esta marca cliente. ¿Deseas continuar?"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 font-bold text-white"
            >
              {t("billing.confirmDeleteBtn", "Confirmar Eliminación")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

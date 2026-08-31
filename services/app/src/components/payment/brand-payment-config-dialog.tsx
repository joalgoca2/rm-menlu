"use client";

import React, { useState, useEffect } from "react";
import {
  saveBrandPaymentConfigAction,
  getBrandPaymentConfigAction,
} from "@/actions/payment-engine";
import type { PaymentGatewayType } from "@/types";
import { useTranslation } from "@/components/providers/i18n-provider";
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
import { CreditCard, Key, ShieldCheck, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface BrandItem {
  id: string;
  name: string;
}

interface BrandPaymentConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  brands?: BrandItem[];
  brandId?: string;
  initialBrandId?: string;
  isSuperAdmin?: boolean;
}

export function BrandPaymentConfigDialog({
  isOpen,
  onClose,
  onSuccess,
  brands = [],
  brandId: directBrandId,
  initialBrandId,
  isSuperAdmin = false,
}: BrandPaymentConfigDialogProps) {
  const { t } = useTranslation();

  const tenantBrands = brands || [];

  const targetBrandId = directBrandId || initialBrandId || tenantBrands[0]?.id || "";
  const [brandId, setBrandId] = useState<string>(targetBrandId);
  const [gatewayType, setGatewayType] = useState<PaymentGatewayType>("CLIP");
  const [publicKey, setPublicKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [webhookSecret, setWebhookSecret] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const currentBrandId = directBrandId || initialBrandId || brandId || tenantBrands[0]?.id;
    if (currentBrandId) {
      setBrandId(currentBrandId);
      getBrandPaymentConfigAction(currentBrandId).then((res) => {
        if (res.success && res.data) {
          setGatewayType(res.data.gatewayType);
          setPublicKey(res.data.publicKey);
          setIsActive(res.data.isActive);
        } else {
          setGatewayType("CLIP");
          setPublicKey("");
          setSecretKey("");
          setWebhookSecret("");
          setIsActive(true);
        }
      });
    }
  }, [isOpen, directBrandId, initialBrandId, brandId, tenantBrands]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      toast.error(t("paymentEngine.selectBrandError", "Selecciona una empresa cliente"));
      return;
    }

    setLoading(true);
    const res = await saveBrandPaymentConfigAction({
      brandId,
      gatewayType,
      publicKey: publicKey || "ENABLED_BY_SUPERADMIN",
      secretKey: secretKey || "ENABLED_BY_SUPERADMIN",
      webhookSecret,
      isActive,
    });
    setLoading(false);

    if (res.success) {
      toast.success(
        t(
          "paymentEngineDetails.configSaved",
          "Configuración de pasarela guardada correctamente"
        )
      );
      onSuccess();
      onClose();
    } else {
      toast.error(
        res.error ||
          t("paymentEngineDetails.configSaveError", "Error al guardar la pasarela")
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-6 my-auto">
        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              {isSuperAdmin
                ? t(
                    "paymentEngineDetails.superadminHabilitarTitle",
                    "Configurar Pasarela para Empresa Cliente"
                  )
                : t(
                    "paymentEngineDetails.configTitle",
                    "Configurar Pasarela de Pagos"
                  )}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isSuperAdmin
                ? t(
                    "paymentEngineDetails.superadminSubtitle",
                    "Asigna la pasarela permitida para la marca cliente inquilina."
                  )
                : t(
                    "paymentEngineDetails.configSubtitle",
                    "Ingresa las claves privadas de cobro de tu empresa."
                  )}
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {t(
                "paymentEngineDetails.superadminBanner",
                "Como SuperAdmin, puedes autorizar proveedores a nivel sistema. El cliente podrá capturar sus propias llaves en la configuración de su marca."
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Brand (Only for SuperAdmin) */}
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("paymentEngineDetails.selectBrandLabel", "Selecciona la Empresa Cliente (Brand)")}
              </Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger className="rounded-xl h-10 text-xs font-semibold">
                  <SelectValue
                    placeholder={t(
                      "paymentEngineDetails.selectBrandPlaceholder",
                      "Selecciona una marca..."
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tenantBrands.length === 0 ? (
                    <SelectItem value="none" disabled className="text-xs">
                      {t("paymentEngineDetails.noBrandsFound", "No hay marcas registradas")}
                    </SelectItem>
                  ) : (
                    tenantBrands.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs font-semibold">
                        {b.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Select Gateway */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              {t("paymentEngineDetails.selectProviderLabel", "Proveedor de Pago Autorizado")}
            </Label>
            {isSuperAdmin ? (
              <Select
                value={gatewayType}
                onValueChange={(val) => setGatewayType(val as PaymentGatewayType)}
              >
                <SelectTrigger className="rounded-xl h-10 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIP" className="text-xs font-bold">
                    Clip (Hosted Checkout)
                  </SelectItem>
                  <SelectItem value="STRIPE" className="text-xs font-bold">
                    Stripe (Global Checkout)
                  </SelectItem>
                  <SelectItem value="MERCADOPAGO" className="text-xs font-bold">
                    MercadoPago (LATAM)
                  </SelectItem>
                  <SelectItem value="PSE" className="text-xs font-bold">
                    PSE (Débito Bancario)
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <Badge
                  variant="outline"
                  className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                >
                  {gatewayType}
                </Badge>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {gatewayType === "CLIP"
                    ? "Clip (Hosted Checkout)"
                    : gatewayType === "STRIPE"
                    ? "Stripe (Global Checkout)"
                    : gatewayType === "MERCADOPAGO"
                    ? "MercadoPago (LATAM)"
                    : gatewayType === "PSE"
                    ? "PSE (Débito Bancario)"
                    : gatewayType}
                </span>
              </div>
            )}
          </div>

          <>
            {/* Public Key */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("paymentEngineDetails.saasPublicKeyLabel", "API Key Pública:")}
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="test_clip_pk_••••••••"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="pl-9 text-xs font-mono rounded-xl h-10"
                  required
                />
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("paymentEngineDetails.saasSecretKeyLabel", "Secret Key Privada:")}
              </Label>
              <Input
                type="password"
                placeholder="cl_sec_live_••••••••"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="text-xs font-mono rounded-xl h-10"
                required
              />
            </div>

            {/* Webhook Secret */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t("paymentEngineDetails.saasWebhookSecretLabel", "Firma Webhook:")}
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <Input
                  type="password"
                  placeholder="whsec_••••••••"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="pl-9 text-xs font-mono rounded-xl h-10"
                />
              </div>
            </div>
          </>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold rounded-xl h-10 px-4"
            >
              {t("common.cancel", "Cancelar")}
            </Button>
            <Button
              type="submit"
              disabled={loading || (isSuperAdmin && tenantBrands.length === 0)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSuperAdmin
                ? t("paymentEngineDetails.enableGatewayBtn", "Configurar Pasarela para Empresa")
                : t("paymentEngineDetails.saveConfig", "Guardar Pasarela")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

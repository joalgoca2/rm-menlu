"use client";

import React, { useState } from "react";
import { useTranslation } from "@/components/providers/i18n-provider";
import {
  updateBrandSlugAction,
  checkBrandSlugAvailabilityAction,
} from "@/actions/brand-portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Copy, Check, Lock, Loader2, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface BrandPublicLinkCardProps {
  brand: {
    id: string;
    slug: string;
    isSlugLocked: boolean;
  };
}

export function BrandPublicLinkCard({ brand }: BrandPublicLinkCardProps) {
  const { t } = useTranslation();
  const [currentSlug, setCurrentSlug] = useState(brand.slug);
  const [isSlugLocked, setIsSlugLocked] = useState(brand.isSlugLocked);

  const [slugInput, setSlugInput] = useState(brand.slug);
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
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

  return (
    <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-purple-950/20 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {t("brandAdminPayments.publicPortalTitle", "Enlace Público Academia Blanca")}
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
              placeholder="mi-dojo"
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
  );
}

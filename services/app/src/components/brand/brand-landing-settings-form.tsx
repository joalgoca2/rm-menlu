"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Palette,
  Megaphone,
  MapPin,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  Loader2,
  Sparkles,
  Layout,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateBrandLandingConfigAction } from "@/actions/brand-portal";
import { uploadBrandLogoAction } from "@/actions/brand";
import {
  isValidImageUrl,
  updateBrandLandingSchema,
} from "@/lib/validations/brand-portal";
import type {
  BrandLandingConfig,
  BrandFaqItem,
  BrandTestimonialItem,
} from "@/types";

interface BrandLandingSettingsFormProps {
  brandId: string;
  initialConfig?: BrandLandingConfig | null;
  initialLogoUrl?: string | null;
}

const COLOR_PRESETS = [
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Esmeralda", hex: "#10B981" },
  { name: "Rosa", hex: "#E11D48" },
  { name: "Ámbar", hex: "#F59E0B" },
  { name: "Púrpura", hex: "#9333EA" },
  { name: "Azul", hex: "#2563EB" },
  { name: "Negro", hex: "#18181B" },
];

export function BrandLandingSettingsForm({
  brandId,
  initialConfig,
  initialLogoUrl,
}: BrandLandingSettingsFormProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");

  // Form State
  const [primaryColor, setPrimaryColor] = useState(
    initialConfig?.primaryColor || "#4F46E5"
  );
  const [heroBannerUrl, setHeroBannerUrl] = useState(
    initialConfig?.heroBannerUrl || ""
  );
  const [heroTitle, setHeroTitle] = useState(initialConfig?.heroTitle || "");
  const [heroSubtitle, setHeroSubtitle] = useState(
    initialConfig?.heroSubtitle || ""
  );

  const [ctaText, setCtaText] = useState(initialConfig?.ctaText || "");
  const [ctaActionType, setCtaActionType] = useState<
    "REGISTER" | "WHATSAPP" | "CUSTOM_URL"
  >(initialConfig?.ctaActionType || "REGISTER");
  const [ctaCustomUrl, setCtaCustomUrl] = useState(
    initialConfig?.ctaCustomUrl || ""
  );

  const [whatsappNumber, setWhatsappNumber] = useState(
    initialConfig?.whatsappNumber || ""
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialConfig?.whatsappMessage || ""
  );
  const [address, setAddress] = useState(initialConfig?.address || "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialConfig?.googleMapsUrl || ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(
    initialConfig?.websiteUrl || ""
  );
  const [businessHours, setBusinessHours] = useState(
    initialConfig?.businessHours || ""
  );

  const [showPlans, setShowPlans] = useState(
    initialConfig?.showPlans ?? true
  );
  const [showFaq, setShowFaq] = useState(initialConfig?.showFaq ?? true);
  const [showTestimonials, setShowTestimonials] = useState(
    initialConfig?.showTestimonials ?? true
  );
  const [showWhatsappWidget, setShowWhatsappWidget] = useState(
    initialConfig?.showWhatsappWidget ?? true
  );
  const [showHeroPillars, setShowHeroPillars] = useState(
    initialConfig?.showHeroPillars ?? false
  );

  const [announcementBannerText, setAnnouncementBannerText] = useState(
    initialConfig?.announcementBannerText || ""
  );
  const [announcementBannerUrl, setAnnouncementBannerUrl] = useState(
    initialConfig?.announcementBannerUrl || ""
  );

  const [faqs, setFaqs] = useState<BrandFaqItem[]>(
    initialConfig?.faqs || []
  );
  const [testimonials, setTestimonials] = useState<BrandTestimonialItem[]>(
    initialConfig?.testimonials || []
  );

  const handleAddFaq = () => {
    if (faqs.length >= 10) return;
    setFaqs([
      ...faqs,
      {
        id: `faq-${Date.now()}`,
        question: "",
        answer: "",
      },
    ]);
  };

  const handleRemoveFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const handleUpdateFaq = (
    id: string,
    field: "question" | "answer",
    val: string
  ) => {
    setFaqs(faqs.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  const handleAddTestimonial = () => {
    if (testimonials.length >= 10) return;
    setTestimonials([
      ...testimonials,
      {
        id: `test-${Date.now()}`,
        author: "",
        role: "",
        quote: "",
        avatarUrl: "",
      },
    ]);
  };

  const handleRemoveTestimonial = (id: string) => {
    setTestimonials(testimonials.filter((tItem) => tItem.id !== id));
  };

  const handleUpdateTestimonial = (
    id: string,
    field: "author" | "role" | "quote" | "avatarUrl",
    val: string
  ) => {
    setTestimonials(
      testimonials.map((tItem) =>
        tItem.id === id ? { ...tItem, [field]: val } : tItem
      )
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (heroBannerUrl.trim() && !isValidImageUrl(heroBannerUrl)) {
      toast.error(
        "La URL del banner debe ser una imagen válida (.jpg, .png, .webp, .svg). No se permiten enlaces de video ni scripts."
      );
      return;
    }
    setIsSaving(true);
    try {
      const payload: BrandLandingConfig = {
        primaryColor,
        heroBannerUrl,
        heroTitle,
        heroSubtitle,
        ctaText,
        ctaActionType,
        ctaCustomUrl,
        whatsappNumber,
        whatsappMessage,
        address,
        googleMapsUrl,
        websiteUrl,
        businessHours,
        showPlans,
        showFaq,
        showTestimonials,
        showWhatsappWidget,
        showHeroPillars,
        announcementBannerText,
        announcementBannerUrl,
        faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
        testimonials: testimonials.filter(
          (tItem) => tItem.author.trim() && tItem.quote.trim()
        ),
      };

      const validation = updateBrandLandingSchema.safeParse(payload);
      if (!validation.success) {
        const issue = validation.error.issues[0]?.message || "Datos de formulario no válidos.";
        toast.error(issue);
        setIsSaving(false);
        return;
      }

      const res = await updateBrandLandingConfigAction(brandId, payload);
      if (res.success) {
        toast.success(
          t(
            "brandAdminPayments.landingConfigSaved",
            "¡Configuración de landing guardada exitosamente!"
          )
        );
      } else {
        toast.error(
          res.error ||
            t(
              "brandAdminPayments.landingConfigError",
              "Error al guardar la configuración."
            )
        );
      }
    } catch (_err: unknown) {
      toast.error(
        t(
          "brandAdminPayments.landingConfigError",
          "Error de conexión al guardar."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="h-5 w-5 text-indigo-500" />
            <span>
              {t(
                "brandAdminPayments.landingCustomizationTitle",
                "Personalización de la Landing Page"
              )}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t(
              "brandAdminPayments.landingCustomizationSubtitle",
              "Configura aspectos visuales, mensajes, contacto y bloques modulares para la página pública de tu marca."
            )}
          </p>
        </div>

        <Button
          id="save-brand-landing-config-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1.5" />
          )}
          <span>
            {t(
              "brandAdminPayments.saveLandingConfig",
              "Guardar Configuración"
            )}
          </span>
        </Button>
      </div>

      <Tabs defaultValue="identity" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl">
          <TabsTrigger
            value="identity"
            className="rounded-xl text-xs font-semibold"
          >
            <Palette className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("brandLandingForm.tabIdentity", "Identidad & Hero")}</span>
          </TabsTrigger>
          <TabsTrigger value="cta" className="rounded-xl text-xs font-semibold">
            <Megaphone className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("brandLandingForm.tabCta", "Llamado a Acción")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="modules"
            className="rounded-xl text-xs font-semibold"
          >
            <Layout className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("brandLandingForm.tabModules", "Módulos")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="rounded-xl text-xs font-semibold"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("brandLandingForm.tabContact", "Contacto")}</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="rounded-xl text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("brandLandingForm.tabFaq", "FAQ & Citas")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Identity & Hero */}
        <TabsContent value="identity" className="space-y-6">
          {/* Brand Logo Upload Card */}
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative h-16 w-16 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo de la Marca"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-7 w-7" />
                </div>
              )}
              <div>
                <Label className="text-xs font-bold block">
                  {t(
                    "brandLandingForm.officialLogoLabel",
                    "Logo Oficial de la Empresa / Marca"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {t(
                    "brandLandingForm.logoFileHelp",
                    "Formato PNG, JPG o WebP • Máximo 5 MB."
                  )}{" "}
                  <code className="text-indigo-600 dark:text-indigo-400">
                    /uploads/brand/[id].jpg
                  </code>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <input
                id="brand-logo-file-input"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error(
                      t(
                        "brandLandingForm.logoSizeError",
                        "El archivo excede el tamaño máximo permitido de 5 MB."
                      )
                    );
                    return;
                  }
                  setIsUploadingLogo(true);
                  try {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64 = event.target?.result as string;
                      const res = await uploadBrandLogoAction(brandId, base64);
                      if (res.success && res.data?.logoUrl) {
                        setLogoUrl(res.data.logoUrl);
                        toast.success(
                          t(
                            "brandLandingForm.logoSuccessToast",
                            "¡Logo actualizado exitosamente!"
                          )
                        );
                      } else {
                        toast.error(
                          res.error ||
                            t(
                              "brandLandingForm.logoErrorToast",
                              "Error al subir el logo."
                            )
                        );
                      }
                      setIsUploadingLogo(false);
                    };
                    reader.readAsDataURL(file);
                  } catch (_err) {
                    toast.error(
                      t(
                        "brandLandingForm.logoProcessError",
                        "Error al procesar el archivo de imagen."
                      )
                    );
                    setIsUploadingLogo(false);
                  }
                }}
              />
              <Button
                id="trigger-brand-logo-upload-btn"
                type="button"
                variant="outline"
                disabled={isUploadingLogo}
                onClick={() => {
                  document.getElementById("brand-logo-file-input")?.click();
                }}
                className="rounded-xl text-xs font-semibold w-full sm:w-auto"
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                <span>
                  {isUploadingLogo
                    ? t("brandLandingForm.uploadingLogo", "Subiendo...")
                    : t("brandLandingForm.uploadChangeLogo", "Cargar / Cambiar Logo")}
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.primaryColorLabel",
                  "Color Primario de la Marca"
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color-input"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-16 p-1 rounded-xl cursor-pointer"
                />
                <Input
                  id="primary-color-hex-input"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="rounded-xl text-xs font-mono max-w-[120px]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {COLOR_PRESETS.map((cp) => (
                  <button
                    key={cp.hex}
                    type="button"
                    onClick={() => setPrimaryColor(cp.hex)}
                    className="h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-700 transition-transform hover:scale-110"
                    style={{ backgroundColor: cp.hex }}
                    title={cp.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.heroBannerUrlLabel",
                  "URL Imagen de Banner (Hero Background)"
                )}
              </Label>
              <Input
                id="hero-banner-url-input"
                type="url"
                placeholder={t(
                  "brandLandingForm.heroBannerUrlPlaceholder",
                  "https://ejemplo.com/banner-gimnasio.jpg"
                )}
                value={heroBannerUrl}
                onChange={(e) => setHeroBannerUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
              <p className="text-[11px] text-zinc-400">
                {t(
                  "brandLandingForm.heroBannerUrlHelp",
                  "Opcional. Imagen panorámica de fondo para el encabezado."
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">
              {t(
                "brandLandingForm.heroTitleLabel",
                "Título del Hero (Headline)"
              )}
            </Label>
            <Input
              id="hero-title-input"
              type="text"
              placeholder={t(
                "brandLandingForm.heroTitlePlaceholder",
                "Tu Portal Privado de Miembros"
              )}
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold">
              {t(
                "brandLandingForm.heroSubtitleLabel",
                "Subtítulo / Mensaje de Bienvenida"
              )}
            </Label>
            <Textarea
              id="hero-subtitle-input"
              rows={3}
              placeholder={t(
                "brandLandingForm.heroSubtitlePlaceholder",
                "Accede a tu cuenta para gestionar tus membresías y realizar tus pagos..."
              )}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="rounded-xl text-xs"
            />
          </div>
        </TabsContent>

        {/* Tab 2: Call to Action (CTA) */}
        <TabsContent value="cta" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.ctaTextLabel",
                  "Texto del Botón Principal"
                )}
              </Label>
              <Input
                id="cta-text-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.ctaTextPlaceholder",
                  "Ingresar a Mi Cuenta / Inscribirme"
                )}
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t("brandLandingForm.ctaActionLabel", "Acción del Botón")}
              </Label>
              <select
                id="cta-action-type-select"
                value={ctaActionType}
                onChange={(e) =>
                  setCtaActionType(
                    e.target.value as "REGISTER" | "WHATSAPP" | "CUSTOM_URL"
                  )
                }
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium"
              >
                <option value="REGISTER">
                  {t(
                    "brandLandingForm.actionRegister",
                    "Redirigir a Registro / Login"
                  )}
                </option>
                <option value="WHATSAPP">
                  {t(
                    "brandLandingForm.actionWhatsapp",
                    "Abrir Chat de WhatsApp"
                  )}
                </option>
                <option value="CUSTOM_URL">
                  {t(
                    "brandLandingForm.actionCustomUrl",
                    "Redirigir a URL Personalizada"
                  )}
                </option>
              </select>
            </div>
          </div>

          {ctaActionType === "CUSTOM_URL" && (
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.customUrlLabel",
                  "URL Personalizada de Destino"
                )}
              </Label>
              <Input
                id="cta-custom-url-input"
                type="url"
                placeholder={t(
                  "brandLandingForm.ctaCustomUrlPlaceholder",
                  "https://misitio.com/registro"
                )}
                value={ctaCustomUrl}
                onChange={(e) => setCtaCustomUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Modular Toggles */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">
                  {t(
                    "brandLandingForm.showPlansLabel",
                    "Mostrar Planes de Membresía"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400">
                  {t(
                    "brandLandingForm.showPlansHelp",
                    "Muestra la cuadrícula de paquetes y precios en la landing."
                  )}
                </p>
              </div>
              <Switch
                id="show-plans-switch"
                checked={showPlans}
                onCheckedChange={setShowPlans}
              />
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">
                  {t(
                    "brandLandingForm.showFaqLabel",
                    "Mostrar Preguntas Frecuentes"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400">
                  {t(
                    "brandLandingForm.showFaqHelp",
                    "Acordeón desplegable con preguntas comunes."
                  )}
                </p>
              </div>
              <Switch
                id="show-faq-switch"
                checked={showFaq}
                onCheckedChange={setShowFaq}
              />
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">
                  {t(
                    "brandLandingForm.showTestimonialsLabel",
                    "Mostrar Testimonios"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400">
                  {t(
                    "brandLandingForm.showTestimonialsHelp",
                    "Tarjetas con opiniones de tus clientes o estudiantes."
                  )}
                </p>
              </div>
              <Switch
                id="show-testimonials-switch"
                checked={showTestimonials}
                onCheckedChange={setShowTestimonials}
              />
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">
                  {t(
                    "brandLandingForm.showWhatsappWidgetLabel",
                    "Widget Flotante de WhatsApp"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400">
                  {t(
                    "brandLandingForm.showWhatsappWidgetHelp",
                    "Botón flotante en la esquina inferior derecha."
                  )}
                </p>
              </div>
              <Switch
                id="show-whatsapp-widget-switch"
                checked={showWhatsappWidget}
                onCheckedChange={setShowWhatsappWidget}
              />
            </div>

            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">
                  {t(
                    "brandLandingForm.showHeroPillarsLabel",
                    "Tarjetas Informativas en el Hero"
                  )}
                </Label>
                <p className="text-[11px] text-zinc-400">
                  {t(
                    "brandLandingForm.showHeroPillarsHelp",
                    "Muestra las 3 tarjetas de características sobre la imagen principal."
                  )}
                </p>
              </div>
              <Switch
                id="show-hero-pillars-switch"
                checked={showHeroPillars}
                onCheckedChange={setShowHeroPillars}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>
                {t(
                  "brandLandingForm.announcementBannerLabel",
                  "Banner de Anuncio Promocional (Barra Superior)"
                )}
              </span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="announcement-banner-text-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.announcementPlaceholder",
                  "¡10% de descuento en inscripciones este mes!"
                )}
                value={announcementBannerText}
                onChange={(e) => setAnnouncementBannerText(e.target.value)}
                className="rounded-xl text-xs"
              />
              <Input
                id="announcement-banner-url-input"
                type="url"
                placeholder={t(
                  "brandLandingForm.announcementUrlPlaceholder",
                  "Enlace opcional al hacer clic en el anuncio..."
                )}
                value={announcementBannerUrl}
                onChange={(e) => setAnnouncementBannerUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Contact & Location */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t("brandLandingForm.whatsappNumberLabel", "Número de WhatsApp")}
              </Label>
              <Input
                id="whatsapp-number-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.whatsappNumberPlaceholder",
                  "+5215551234567"
                )}
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.whatsappMessageLabel",
                  "Mensaje Inicial de WhatsApp"
                )}
              </Label>
              <Input
                id="whatsapp-message-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.whatsappMessagePlaceholder",
                  "Hola, me interesa información de membresías."
                )}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.addressLabel",
                  "Dirección Física del Local / Dojo"
                )}
              </Label>
              <Input
                id="address-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.addressPlaceholder",
                  "Av. Principal #123, Col. Centro, CDMX"
                )}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t("brandLandingForm.googleMapsUrlLabel", "Enlace Google Maps")}
              </Label>
              <Input
                id="google-maps-url-input"
                type="url"
                placeholder={t(
                  "brandLandingForm.googleMapsUrlPlaceholder",
                  "https://maps.google.com/..."
                )}
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.websiteUrlLabel",
                  "Sitio Web Oficial / Página de la Academia"
                )}
              </Label>
              <Input
                id="website-url-input"
                type="url"
                placeholder={t(
                  "brandLandingForm.websiteUrlPlaceholder",
                  "https://academiahuanglong.com"
                )}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.businessHoursLabel",
                  "Horarios de Atención"
                )}
              </Label>
              <Input
                id="business-hours-input"
                type="text"
                placeholder={t(
                  "brandLandingForm.businessHoursPlaceholder",
                  "Lun a Vie: 7:00 AM - 9:00 PM | Sáb: 8:00 AM - 2:00 PM"
                )}
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: FAQ & Testimonials Editor */}
        <TabsContent value="faq" className="space-y-6">
          {/* FAQs List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.faqSectionTitle",
                  "Preguntas Frecuentes (Máx. 10)"
                )}
              </Label>
              <Button
                id="add-faq-item-btn"
                type="button"
                variant="outline"
                onClick={handleAddFaq}
                disabled={faqs.length >= 10}
                className="rounded-xl text-xs font-semibold h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>
                  {t("brandLandingForm.addFaqBtn", "Agregar Pregunta")}
                </span>
              </Button>
            </div>

            {faqs.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">
                {t(
                  "brandLandingForm.noFaqsAdded",
                  "No has agregado preguntas frecuentes."
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 relative bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500">
                        {t(
                          "brandLandingForm.faqQuestionNum",
                          `Pregunta #${idx + 1}`,
                          { num: idx + 1 }
                        )}
                      </span>
                      <Button
                        id={`remove-faq-${faq.id}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFaq(faq.id)}
                        className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      id={`faq-question-${faq.id}`}
                      placeholder={t(
                        "brandLandingForm.faqQuestionPlaceholder",
                        "¿Necesito experiencia previa?"
                      )}
                      value={faq.question}
                      onChange={(e) =>
                        handleUpdateFaq(faq.id, "question", e.target.value)
                      }
                      className="rounded-xl text-xs bg-white dark:bg-zinc-900"
                    />
                    <Textarea
                      id={`faq-answer-${faq.id}`}
                      rows={2}
                      placeholder={t(
                        "brandLandingForm.faqAnswerPlaceholder",
                        "No, contamos con clases para todos los niveles..."
                      )}
                      value={faq.answer}
                      onChange={(e) =>
                        handleUpdateFaq(faq.id, "answer", e.target.value)
                      }
                      className="rounded-xl text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testimonials List */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold">
                {t(
                  "brandLandingForm.testimonialsSectionTitle",
                  "Testimonios & Reseñas (Máx. 10)"
                )}
              </Label>
              <Button
                id="add-testimonial-item-btn"
                type="button"
                variant="outline"
                onClick={handleAddTestimonial}
                disabled={testimonials.length >= 10}
                className="rounded-xl text-xs font-semibold h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>
                  {t(
                    "brandLandingForm.addTestimonialBtn",
                    "Agregar Testimonio"
                  )}
                </span>
              </Button>
            </div>

            {testimonials.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">
                {t(
                  "brandLandingForm.noTestimonialsAdded",
                  "No has agregado testimonios de clientes."
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {testimonials.map((tItem, idx) => (
                  <div
                    key={tItem.id}
                    className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500">
                        {t(
                          "brandLandingForm.testimonialNum",
                          `Testimonio #${idx + 1}`,
                          { num: idx + 1 }
                        )}
                      </span>
                      <Button
                        id={`remove-testimonial-${tItem.id}`}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTestimonial(tItem.id)}
                        className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        id={`testimonial-author-${tItem.id}`}
                        placeholder={t(
                          "brandLandingForm.authorPlaceholder",
                          "Nombre del cliente (ej. María Gómez)"
                        )}
                        value={tItem.author}
                        onChange={(e) =>
                          handleUpdateTestimonial(
                            tItem.id,
                            "author",
                            e.target.value
                          )
                        }
                        className="rounded-xl text-xs bg-white dark:bg-zinc-900"
                      />
                      <Input
                        id={`testimonial-role-${tItem.id}`}
                        placeholder={t(
                          "brandLandingForm.rolePlaceholder",
                          "Rol / Tiempo (ej. Alumna desde 2023)"
                        )}
                        value={tItem.role || ""}
                        onChange={(e) =>
                          handleUpdateTestimonial(
                            tItem.id,
                            "role",
                            e.target.value
                          )
                        }
                        className="rounded-xl text-xs bg-white dark:bg-zinc-900"
                      />
                    </div>
                    <Textarea
                      id={`testimonial-quote-${tItem.id}`}
                      rows={2}
                      placeholder={t(
                        "brandLandingForm.quotePlaceholder",
                        "«Excelente ambiente y profesores muy profesionales...»"
                      )}
                      value={tItem.quote}
                      onChange={(e) =>
                        handleUpdateTestimonial(
                          tItem.id,
                          "quote",
                          e.target.value
                        )
                      }
                      className="rounded-xl text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

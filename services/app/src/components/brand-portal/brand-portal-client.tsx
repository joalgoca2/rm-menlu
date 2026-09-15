"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  ArrowRight,
  LogIn,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  MapPin,
  Clock,
  Globe,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Star,
  CreditCard,
} from "lucide-react";
import type { BrandPortalData } from "@/types";

interface BrandPortalClientProps {
  brand: BrandPortalData;
}

const isValidImageUrl = (url?: string | null): boolean => {
  if (!url || !url.trim()) return false;
  const clean = url.trim().toLowerCase();
  if (
    clean.includes("<") ||
    clean.includes(">") ||
    clean.includes("script") ||
    clean.includes("iframe") ||
    clean.includes("javascript:")
  ) {
    return false;
  }
  if (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".avi") ||
    clean.endsWith(".mov") ||
    clean.includes("youtube.com") ||
    clean.includes("youtu.be") ||
    clean.includes("vimeo.com")
  ) {
    return false;
  }
  return clean.startsWith("http://") || clean.startsWith("https://");
};

export function BrandPortalClient({ brand }: BrandPortalClientProps) {
  const { t } = useTranslation();
  const config = brand.landingConfig || {};
  const primaryColor = config.primaryColor || "#4F46E5";

  // FAQ Accordion Toggle State
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  // Build WhatsApp Link
  const getWhatsappUrl = () => {
    if (!config.whatsappNumber) return "#";
    const cleanNum = config.whatsappNumber.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      config.whatsappMessage || "Hola, me interesa información de membresías."
    );
    return `https://wa.me/${cleanNum}?text=${msg}`;
  };

  // Determine CTA Button Link & Behavior
  const getCtaLink = () => {
    if (config.ctaActionType === "WHATSAPP") {
      return getWhatsappUrl();
    }
    if (config.ctaActionType === "CUSTOM_URL" && config.ctaCustomUrl) {
      return config.ctaCustomUrl;
    }
    return "/login";
  };

  const isExternalCta =
    config.ctaActionType === "WHATSAPP" ||
    config.ctaActionType === "CUSTOM_URL";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Optional Top Announcement Banner */}
      {config.announcementBannerText && (
        <div
          className="w-full text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner"
          style={{ backgroundColor: primaryColor }}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          {config.announcementBannerUrl ? (
            <a
              href={config.announcementBannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <span>{config.announcementBannerText}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span>{config.announcementBannerText}</span>
          )}
        </div>
      )}

      {/* Header Bar */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <div className="relative h-12 w-12 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="h-12 w-12 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {brand.name}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span>
                  {t("brandPortal.verifiedBusiness", "Negocio Verificado")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                id="brand-portal-header-login-btn"
                className="rounded-2xl text-xs font-bold text-white shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                <span>
                  {t("brandPortal.memberLogin", "Ingresar a Mi Cuenta")}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 bg-gradient-to-b from-white via-zinc-50/50 to-zinc-50 dark:from-zinc-900 dark:via-zinc-950/50 dark:to-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/60">
          {isValidImageUrl(config.heroBannerUrl) && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <Image
                src={config.heroBannerUrl!}
                alt="Banner de Marca"
                fill
                unoptimized
                className="object-cover opacity-60 dark:opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-zinc-950/70 to-zinc-950" />
            </div>
          )}

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col justify-center items-center text-center">
            <h2
              className={`text-4xl sm:text-5xl font-black tracking-tight max-w-3xl leading-tight ${
                isValidImageUrl(config.heroBannerUrl)
                  ? "text-white"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {config.heroTitle ||
                t(
                  "brandPortal.friendlyHeroTitle",
                  "Tu Portal Privado de Miembros"
                )}
            </h2>

            <p
              className={`text-base mt-4 max-w-2xl leading-relaxed ${
                isValidImageUrl(config.heroBannerUrl)
                  ? "text-zinc-200"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {config.heroSubtitle ||
                brand.description ||
                t(
                  "brandPortal.friendlyHeroSub",
                  `Accede a tu cuenta en ${brand.name} para gestionar tus membresías, consultar tus asistencias y realizar tus pagos de forma segura.`
                )}
            </p>

            {/* Feature Pillars (Optional) */}
            {config.showHeroPillars && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl my-10 text-left">
                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t("brandPortal.pillar1Title", "Gestión de Membresías")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t(
                      "brandPortal.pillar1Desc",
                      "Consulta tus pases activos y renueva tus inscripciones."
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-indigo-500 mb-2" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t("brandPortal.pillar2Title", "Pagos 100% Seguros")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t(
                      "brandPortal.pillar2Desc",
                      "Paga en línea con Clip, Stripe o MercadoPago con recibo digital."
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 text-purple-500 mb-2" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {t("brandPortal.pillar3Title", "Soporte Directo")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t(
                      "brandPortal.pillar3Desc",
                      "Atención personalizada y canal directo con el equipo."
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className={`flex justify-center ${config.showHeroPillars ? "" : "mt-8"}`}>
              {isExternalCta ? (
                <a
                  href={getCtaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    id="hero-access-account-btn"
                    className="rounded-2xl text-white font-bold text-sm px-10 py-6 shadow-xl transition-transform hover:scale-105"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>
                      {config.ctaText ||
                        t(
                          "brandPortal.accessMyAccount",
                          "Ingresar a Mi Cuenta"
                        )}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </a>
              ) : (
                <Link href={getCtaLink()}>
                  <Button
                    id="hero-access-account-btn"
                    className="rounded-2xl text-white font-bold text-sm px-10 py-6 shadow-xl transition-transform hover:scale-105"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>
                      {config.ctaText ||
                        t(
                          "brandPortal.accessMyAccount",
                          "Ingresar a Mi Cuenta"
                        )}
                    </span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Public Membership Plans Grid (Modular) */}
        {(config.showPlans ?? true) && brand.plans && brand.plans.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 py-16 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Planes y Membresías Disponibles
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Selecciona la tarifa que mejor se adapte a tus necesidades y comienza hoy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brand.plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Plan
                      </span>
                      <CreditCard className="h-5 w-5 text-zinc-400" />
                    </div>
                    <h4 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                      {plan.name}
                    </h4>
                    {plan.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3">
                        {plan.description}
                      </p>
                    )}
                    <div className="my-6">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                          ${plan.priceMonthly.toLocaleString("es-MX")}
                        </span>
                        <span className="text-xs text-zinc-500 ml-1.5 font-medium">
                          {plan.currency} / mes
                        </span>
                      </div>
                      {plan.priceYearly > 0 && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          o ${plan.priceYearly.toLocaleString("es-MX")} {plan.currency} / año
                        </p>
                      )}
                    </div>
                  </div>

                  <Link href="/login" className="w-full">
                    <Button
                      id={`select-plan-btn-${plan.id}`}
                      className="w-full rounded-2xl text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Inscribirme en este Plan</span>
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Testimonials (Modular) */}
        {(config.showTestimonials ?? true) &&
          config.testimonials &&
          config.testimonials.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 py-16 border-b border-zinc-200 dark:border-zinc-800">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Lo que Dicen Nuestros Alumnos
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  Experiencias reales de nuestra comunidad.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {config.testimonials.map((tItem) => (
                  <div
                    key={tItem.id}
                    className="p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 italic leading-relaxed">
                      «{tItem.quote}»
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      {tItem.avatarUrl ? (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-zinc-200">
                          <Image
                            src={tItem.avatarUrl}
                            alt={tItem.author}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="h-10 w-10 rounded-full text-white font-bold flex items-center justify-center text-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {tItem.author.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {tItem.author}
                        </h5>
                        {tItem.role && (
                          <p className="text-[11px] text-zinc-400">
                            {tItem.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Section 4: FAQ Accordion (Modular) */}
        {(config.showFaq ?? true) && config.faqs && config.faqs.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-16 border-b border-zinc-200 dark:border-zinc-800">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center justify-center gap-2">
                <HelpCircle className="h-7 w-7 text-indigo-500" />
                <span>Preguntas Frecuentes</span>
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Resolvemos tus dudas principales antes de inscribirte.
              </p>
            </div>

            <div className="space-y-3">
              {config.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform ${
                        openFaqId === faq.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaqId === faq.id && (
                    <div className="p-4 pt-0 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/50 leading-relaxed bg-zinc-50/50 dark:bg-zinc-900/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Location & Contact Info */}
        {(config.address ||
          config.businessHours ||
          config.whatsappNumber ||
          config.websiteUrl) && (
          <section className="max-w-5xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {config.websiteUrl && (
                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center">
                  <Globe className="h-6 w-6 text-indigo-500 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Sitio Web Oficial
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Visita nuestra página principal.
                  </p>
                  <a
                    href={config.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-3 inline-flex items-center gap-1"
                  >
                    <span>Ir a la Academia</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {config.address && (
                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center">
                  <MapPin className="h-6 w-6 text-indigo-500 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Ubicación
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {config.address}
                  </p>
                  {config.googleMapsUrl && (
                    <a
                      href={config.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-3 inline-flex items-center gap-1"
                    >
                      <span>Ver en Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {config.businessHours && (
                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center">
                  <Clock className="h-6 w-6 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Horarios de Atención
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {config.businessHours}
                  </p>
                </div>
              )}

              {config.whatsappNumber && (
                <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col items-center text-center">
                  <MessageCircle className="h-6 w-6 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Contacto Directo
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Escríbenos directamente por WhatsApp.
                  </p>
                  <a
                    href={getWhatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-3 inline-flex items-center gap-1"
                  >
                    <span>Iniciar Chat</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Floating WhatsApp Widget (Modular) */}
      {(config.showWhatsappWidget ?? true) && config.whatsappNumber && (
        <a
          href={getWhatsappUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl transition-transform hover:scale-110 flex items-center gap-2 text-xs font-bold"
          title="Contactar por WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 gap-3">
          <p>
            © {new Date().getFullYear()} {brand.name}.{" "}
            {t(
              "brandPortal.allRightsReserved",
              "Todos los derechos reservados."
            )}
          </p>
          <div className="flex items-center gap-2 text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              {t(
                "brandPortal.sslEncryption",
                "Encriptación SSL & Pagos Seguros"
              )}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

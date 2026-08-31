"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Building2, Shield, Lock, ArrowRight, LogIn, CheckCircle2 } from "lucide-react";
import type { BrandPortalData } from "@/types";

interface BrandPortalClientProps {
  brand: BrandPortalData;
}

export function BrandPortalClient({ brand }: BrandPortalClientProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between">
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
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/30">
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                {brand.name}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-500" />
                <span>{t("brandPortal.verifiedBusiness", "Negocio Verificado")}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                id="brand-portal-login-btn"
                className="rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                <span>{t("brandPortal.memberLogin", "Ingresar a Mi Cuenta")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Welcome Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 flex-1 w-full flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-6">
          <Building2 className="h-4 w-4" />
          <span>{t("brandPortal.welcomeBadge", "¡Te damos la bienvenida!")}</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 max-w-3xl leading-tight">
          {t("brandPortal.friendlyHeroTitle", "Tu Portal Privado de Miembros")}
        </h2>

        <p className="text-base text-zinc-600 dark:text-zinc-400 mt-4 max-w-2xl leading-relaxed">
          {brand.description ||
            t(
              "brandPortal.friendlyHeroSub",
              `Accede a tu cuenta en ${brand.name} para gestionar tus membresías, consultar tus asistencias y realizar tus pagos de forma segura.`
            )}
        </p>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl my-10 text-left">
          <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("brandPortal.pillar1Title", "Gestión de Membresías")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("brandPortal.pillar1Desc", "Consulta tus pases activos y renueva tus inscripciones.")}
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("brandPortal.pillar2Title", "Pagos 100% Seguros")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("brandPortal.pillar2Desc", "Paga en línea con Clip, Stripe o MercadoPago con recibo digital.")}
            </p>
          </div>

          <div className="p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-purple-500 mb-2" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {t("brandPortal.pillar3Title", "Soporte Directo")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t("brandPortal.pillar3Desc", "Atención personalizada y canal directo con el equipo.")}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link href="/login">
            <Button
              id="hero-access-account-btn"
              className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-10 py-6 shadow-xl shadow-indigo-600/25"
            >
              <span>{t("brandPortal.accessMyAccount", "Ingresar a Mi Cuenta")}</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 gap-3">
          <p>© {new Date().getFullYear()} {brand.name}. {t("brandPortal.allRightsReserved", "Todos los derechos reservados.")}</p>
          <div className="flex items-center gap-2 text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t("brandPortal.sslEncryption", "Encriptación SSL & Pagos Seguros")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

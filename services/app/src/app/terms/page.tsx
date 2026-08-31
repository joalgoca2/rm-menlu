"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("common.backHome", "Volver al Inicio")}</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <FileText className="h-4 w-4 text-emerald-500" />
          <span>{t("terms.lastUpdated", "Última actualización: 10 de Agosto, 2026")}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {t("terms.title", "Términos y Condiciones de Servicio")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
          {t(
            "terms.subtitle",
            "Por favor, lee detenidamente estos términos antes de utilizar nuestros servicios."
          )}
        </p>
      </div>

      <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>{t("terms.cardTitle", "Acuerdo de Términos Generales")}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec1Title", "1. Aceptación de los Términos")}
            </h3>
            <p>
              {t(
                "terms.sec1Desc",
                "Al acceder y utilizar esta plataforma, aceptas estar sujeto a los presentes Términos y Condiciones y a todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno de estos términos, tienes prohibido el uso o acceso a este sitio."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec2Title", "2. Cuentas de Usuario y Seguridad")}
            </h3>
            <p>
              {t(
                "terms.sec2Desc",
                "Para acceder a ciertas funciones de la plataforma, deberás registrarte y mantener una cuenta activa. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec3Title", "3. Uso Aceptable del Servicio")}
            </h3>
            <p>
              {t(
                "terms.sec3Desc",
                "Te comprometes a utilizar la plataforma de manera legal y ética. Queda estrictamente prohibido:"
              )}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>
                {t(
                  "terms.sec3Item1",
                  "Intentar vulnerar la seguridad o integridad de la infraestructura."
                )}
              </li>
              <li>
                {t(
                  "terms.sec3Item2",
                  "Utilizar el servicio para transmitir contenido ilícito o engañoso."
                )}
              </li>
              <li>
                {t(
                  "terms.sec3Item3",
                  "Realizar ingeniería inversa o descompilación del software proporcionado."
                )}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec4Title", "4. Propiedad Intelectual")}
            </h3>
            <p>
              {t(
                "terms.sec4Desc",
                "Todo el contenido, código fuente, logotipos, diseños e interfaces de usuario son propiedad exclusiva de la plataforma o de sus licenciantes y están protegidos por las leyes internacionales de derechos de autor y propiedad intelectual."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec5Title", "5. Limitación de Responsabilidad")}
            </h3>
            <p>
              {t(
                "terms.sec5Desc",
                "En la máxima medida permitida por la ley, la plataforma no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso de nuestros servicios."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.sec6Title", "6. Modificaciones de los Términos")}
            </h3>
            <p>
              {t(
                "terms.sec6Desc",
                "Nos reservamos el derecho de modificar o reemplazar estos términos en cualquier momento. Notificaremos los cambios significativos publicando la versión actualizada en esta página."
              )}
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("terms.contactTitle", "Contacto Legal")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t(
                "terms.contactDesc",
                "Si tienes preguntas sobre estos Términos y Condiciones, puedes contactar a nuestro equipo legal en"
              )}{" "}
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                legal@example.com
              </span>.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

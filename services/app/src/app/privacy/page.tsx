"use client";

import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
          <Lock className="h-4 w-4 text-emerald-500" />
          <span>{t("privacy.lastUpdated", "Última actualización: 10 de Agosto, 2026")}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          {t("privacy.title", "Política de Privacidad")}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
          {t(
            "privacy.subtitle",
            "Conoce cómo recopilamos, usamos y protegemos la información personal en nuestra plataforma."
          )}
        </p>
      </div>

      <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/50 backdrop-blur shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>{t("privacy.cardTitle", "Protección y Tratamiento de Datos")}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.sec1Title", "1. Información que Recopilamos")}
            </h3>
            <p>
              {t(
                "privacy.sec1Desc",
                "Recopilamos la información personal necesaria para operar y mejorar nuestro servicio:"
              )}
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>
                {t(
                  "privacy.sec1Item1",
                  "Datos de cuenta: Nombre completo, correo electrónico y contraseña cifrada."
                )}
              </li>
              <li>
                {t(
                  "privacy.sec1Item2",
                  "Datos de uso: Dirección IP, tipo de navegador y registros de auditoría de inicio de sesión."
                )}
              </li>
              <li>
                {t(
                  "privacy.sec1Item3",
                  "Preferencias: Idioma, zona horaria y configuraciones regionales."
                )}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.sec2Title", "2. Finalidad del Tratamiento de Datos")}
            </h3>
            <p>{t("privacy.sec2Desc", "Utilizamos tu información personal exclusivamente para:")}</p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>{t("privacy.sec2Item1", "Proporcionar, autenticar y mantener el servicio activo.")}</li>
              <li>
                {t(
                  "privacy.sec2Item2",
                  "Notificar sobre cambios importantes o actualizaciones de seguridad."
                )}
              </li>
              <li>{t("privacy.sec2Item3", "Prevenir fraudes, abusos o vulneraciones de seguridad.")}</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.sec3Title", "3. Almacenamiento y Cifrado de Datos")}
            </h3>
            <p>
              {t(
                "privacy.sec3Desc",
                "Implementamos estándares de seguridad de grado industrial. Todas las contraseñas se almacenan con algoritmos de hashing seguro (bcrypt) y la comunicación se realiza a través de conexiones cifradas TLS/SSL (HTTPS)."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.sec4Title", "4. Cookies y Sesiones")}
            </h3>
            <p>
              {t(
                "privacy.sec4Desc",
                "Utilizamos cookies strictly necesarias de sesión HTTP para mantener tu cuenta autenticada y proteger la navegación contra ataques CSRF y XSS."
              )}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.sec5Title", "5. Derechos del Usuario (ARCO / GDPR)")}
            </h3>
            <p>
              {t(
                "privacy.sec5Desc",
                "Tienes el derecho de acceder, rectificar, cancelar u oponerte al tratamiento de tus datos personales. Puedes solicitar la eliminación completa de tu cuenta y datos en cualquier momento."
              )}
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">
              {t("privacy.contactTitle", "Contacto de Privacidad")}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              {t(
                "privacy.contactDesc",
                "Para ejercer tus derechos de privacidad o realizar consultas sobre tus datos, contáctanos en"
              )}{" "}
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                privacy@example.com
              </span>.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

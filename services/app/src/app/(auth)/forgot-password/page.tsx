"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";
import { emailSchema } from "@/lib/validations/common";
import { useTranslation } from "@/components/providers/i18n-provider";
import { LanguageSelector } from "@/components/layout/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const forgotSchema = z.object({ email: emailSchema });
type ForgotInput = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotInput>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotInput) => {
    setIsLoading(true);
    try {
      const res = await requestPasswordReset(data.email);
      if (res.success) {
        setIsSubmitted(true);
        toast.success(t("common.success", "Correo de recuperación enviado."));
      } else {
        toast.error(res.error ?? t("common.error", "No se pudo procesar la solicitud."));
      }
    } catch (_error: unknown) {
      toast.error(t("common.error", "Ocurrió un error inesperado."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Header Controls: Back link + Language Selector */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>{t("common.backHome", "Volver al Inicio")}</span>
          </Button>
        </Link>
        <LanguageSelector compact />
      </div>

      <Card className="border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/70 backdrop-blur shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("auth.forgotTitle", "Recuperar Contraseña")}
          </CardTitle>
          <CardDescription>
            {t(
              "auth.forgotSubtitle",
              "Ingresa tu correo registrado para enviarte las instrucciones"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSubmitted ? (
            <div className="flex flex-col items-center gap-3 text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h4 className="font-semibold text-zinc-900 dark:text-white">
                {t("auth.emailSentTitle", "¡Correo Enviado!")}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                {t(
                  "auth.emailSentDesc",
                  "Si tu correo existe en nuestro sistema, habrás recibido un enlace de recuperación."
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email", "Correo Electrónico")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@ejemplo.com"
                    className="pl-9"
                    error={Boolean(errors.email)}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full font-bold" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("auth.sendLink", "Enviar Enlace")
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-200 dark:border-zinc-800/80 pt-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t("auth.backToLogin", "Volver al inicio de sesión")}</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

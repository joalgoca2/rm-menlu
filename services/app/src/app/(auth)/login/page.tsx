"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
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

export default function LoginPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(
          t(
            "auth.invalidCredentials",
            "Credenciales inválidas. Verifica tu correo y contraseña."
          )
        );
      } else {
        toast.success(t("toasts.loginSuccess", "¡Sesión iniciada con éxito!"));
        window.location.href = "/dashboard";
      }
    } catch (_error: unknown) {
      toast.error(
        t("toasts.errorOccurred", "Ocurrió un error inesperado al iniciar sesión.")
      );
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
            {t("auth.loginTitle", "Iniciar Sesión")}
          </CardTitle>
          <CardDescription>
            {t(
              "auth.loginSubtitle",
              "Ingresa tus credenciales para acceder a tu panel"
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email", "Correo Electrónico")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder", "tu@ejemplo.com")}
                  className="pl-9"
                  error={Boolean(errors.email)}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-500">{t(errors.email.message ?? "")}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password", "Contraseña")}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t("auth.forgotPassword", "¿Olvidaste tu contraseña?")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder", "••••••••")}
                  className="pl-9 pr-10"
                  error={Boolean(errors.password)}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-500">
                  {t(errors.password.message ?? "")}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2 font-bold" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t("auth.signIn", "Ingresar")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t border-zinc-200 dark:border-zinc-800/80 pt-4 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("auth.b2bNotice", "Las cuentas son creadas y gestionadas directamente por el administrador de tu marca.")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

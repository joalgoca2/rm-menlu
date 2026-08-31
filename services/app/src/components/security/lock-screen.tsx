"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  verifySecurityPinAction,
  verifyPasswordAction,
  getSecurityConfigAction,
} from "@/actions/security";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FEATURES } from "@/lib/config/features";
import {
  authenticateBiometricCredential,
  isBiometricSupported,
} from "@/lib/security/webauthn";
import { Lock, Fingerprint, KeyRound, ShieldAlert, Key } from "lucide-react";

interface LockScreenProps {
  inactivityTimeoutMs?: number;
}

export function LockScreen({
  inactivityTimeoutMs = 5 * 60 * 1000,
}: LockScreenProps) {
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [mode, setMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [hasPin, setHasPin] = useState<boolean>(false);
  const [hasWebAuthn, setHasWebAuthn] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchSecurityConfig = useCallback(async () => {
    const res = await getSecurityConfigAction();
    if (res.success && res.data) {
      setHasPin(res.data.hasPin);
      setHasWebAuthn(res.data.hasWebAuthn);
      if (!res.data.hasPin) {
        setMode("password");
      }
    }
  }, []);

  useEffect(() => {
    if (!FEATURES.screenLock) return;
    fetchSecurityConfig();

    const handleLockTrigger = async () => {
      const res = await getSecurityConfigAction();
      let pinActive = hasPin;
      if (res.success && res.data) {
        setHasPin(res.data.hasPin);
        setHasWebAuthn(res.data.hasWebAuthn);
        pinActive = res.data.hasPin;
      }
      setMode(pinActive ? "pin" : "password");
      setError("");
      setIsLocked(true);
    };

    window.addEventListener("lock-screen-trigger", handleLockTrigger);
    return () => {
      window.removeEventListener("lock-screen-trigger", handleLockTrigger);
    };
  }, [fetchSecurityConfig, hasPin]);

  useEffect(() => {
    if (!FEATURES.screenLock || !hasPin) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsLocked(true);
      }, inactivityTimeoutMs);
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [hasPin, inactivityTimeoutMs]);

  if (!FEATURES.screenLock || !isLocked) {
    return null;
  }

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await verifySecurityPinAction(pin);
    setLoading(false);

    if (res.success && res.data) {
      setIsLocked(false);
      setPin("");
    } else {
      setError(
        res.error || t("security.invalidPin", "PIN de seguridad incorrecto")
      );
    }
  };

  const handleUnlockWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await verifyPasswordAction(password);
    setLoading(false);

    if (res.success && res.data) {
      setIsLocked(false);
      setPassword("");
      setPin("");
    } else {
      setError(
        res.error ||
          t("security.invalidPassword", "Contraseña de la cuenta incorrecta")
      );
    }
  };

  const handleUnlockWithBiometrics = async () => {
    setError("");
    setLoading(true);

    const res = await authenticateBiometricCredential("user-biometric");
    setLoading(false);

    if (res.success) {
      setIsLocked(false);
    } else {
      setError(
        res.error ||
          t("security.biometricFailed", "Falló la autenticación biométrica")
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl transition-all">
      <div className="w-full max-w-md p-8 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-3xl shadow-2xl space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
            <Lock className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {t("security.screenLocked", "Pantalla Bloqueada")}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === "pin"
              ? t(
                  "security.enterPinOrBiometric",
                  "Ingresa tu PIN de seguridad o utiliza tu contraseña."
                )
              : t(
                  "security.enterPassword",
                  "Ingresa la contraseña de tu cuenta para desbloquear la sesión."
                )}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === "pin" ? (
          <form onSubmit={handleUnlockWithPin} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
              <Input
                type="password"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="pl-10 text-center tracking-widest text-lg font-bold rounded-xl h-11"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {loading
                ? t("security.verifying", "Verificando...")
                : t("security.unlock", "Desbloquear con PIN")}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleUnlockWithPassword} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 text-left text-sm font-semibold rounded-xl h-11"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full h-11 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {loading
                ? t("security.verifying", "Verificando...")
                : t("security.unlockWithPasswordAction", "Desbloquear con Contraseña")}
            </Button>
          </form>
        )}

        {/* Options / Alternative Mode */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          {hasPin &&
            (mode === "pin" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError("");
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
              >
                {t("security.forgotPin", "¿Olvidaste tu PIN? Usar Contraseña")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("pin");
                  setError("");
                }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
              >
                {t("security.usePinMode", "Volver al bloqueo por PIN")}
              </button>
            ))}

          {hasWebAuthn && isBiometricSupported() && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleUnlockWithBiometrics}
                disabled={loading}
                className="w-full h-11 gap-2 rounded-xl text-xs font-semibold"
              >
                <Fingerprint className="w-4 h-4 text-emerald-500" />
                {t("security.unlockBiometrics", "Usar Huella Digital")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

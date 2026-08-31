"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Webhook,
  Key,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Send,
  Eye,
  Terminal,
  Zap,
  Info,
  Check,
  Building,
} from "lucide-react";
import {
  getWebhookLogs,
  regenerateBrandApiKey,
  retryWebhookLog,
  sendTestWebhook,
  updateBrandWebhookSettings,
} from "@/actions/integrations";
import { useTranslation } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaginationControl } from "@/components/ui/pagination-control";
import { FormattedDate } from "@/components/ui/formatted-date";
import type { Brand, WebhookLog } from "@/types";

interface IntegrationsClientProps {
  initialBrand: Brand | null;
  userBrandId: string | null;
}

export function IntegrationsClient({
  initialBrand,
  userBrandId,
}: IntegrationsClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [brand, setBrand] = useState<Brand | null>(initialBrand);
  const [billingWebhookUrl, _setBillingWebhookUrl] = useState(
    initialBrand?.billingWebhookUrl ?? ""
  );
  const [generalWebhookUrl, setGeneralWebhookUrl] = useState(
    initialBrand?.generalWebhookUrl ?? ""
  );
  const [isWebhookEnabled, setIsWebhookEnabled] = useState(
    initialBrand?.isWebhookEnabled ?? true
  );

  const [apiKey, setApiKey] = useState(initialBrand?.apiKey ?? "");

  // Logs state
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [successCount, setSuccessCount] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [avgDurationMs, setAvgDurationMs] = useState(0);

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Pagination params
  const currentPage = Number(searchParams.get("page") ?? "1");

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Fetch logs
  const fetchLogs = (page: number) => {
    startTransition(async () => {
      const res = await getWebhookLogs({
        page,
        limit: 10,
        brandId: userBrandId ?? undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data.logs);
        setTotalLogs(res.data.total);
        setTotalPages(res.data.totalPages);
        setSuccessCount(res.data.successCount);
        setFailCount(res.data.failCount);
        setAvgDurationMs(res.data.avgDurationMs);
      }
    });
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, userBrandId]);

  // Save Settings
  const handleSaveSettings = async () => {
    if (!userBrandId) {
      toast.error("Debes tener una marca activa para guardar webhooks.");
      return;
    }

    startTransition(async () => {
      const res = await updateBrandWebhookSettings(userBrandId, {
        billingWebhookUrl,
        generalWebhookUrl,
        isWebhookEnabled,
      });

      if (res.success && res.data) {
        setBrand(res.data);
        toast.success(
          t(
            "integrations.saveSuccess",
            "Configuración de webhooks actualizada exitosamente."
          )
        );
      } else {
        toast.error(res.error ?? "Error al guardar webhooks.");
      }
    });
  };

  // Send Test Webhook
  const handleSendTestWebhook = async () => {
    if (!userBrandId) {
      toast.error("Debes seleccionar una marca para enviar pruebas.");
      return;
    }

    startTransition(async () => {
      const res = await sendTestWebhook({
        brandId: userBrandId,
        event: "payment.success",
      });

      if (res.success) {
        toast.success(res.data?.message ?? "Webhook de prueba enviado.");
        fetchLogs(1);
      } else {
        toast.error(res.error ?? "Error al enviar webhook de prueba.");
      }
    });
  };

  // Regenerate API Key
  const handleRegenerateApiKey = async () => {
    if (!userBrandId) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas regenerar la API Key de la marca?\n\nCualquier integración o llamada Inbound externa que use la llave anterior dejará de funcionar."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await regenerateBrandApiKey(userBrandId);
      if (res.success && res.data) {
        setApiKey(res.data.apiKey);
        toast.success("API Key regenerada exitosamente.");
      } else {
        toast.error(res.error ?? "Error al regenerar API Key.");
      }
    });
  };

  // Retry Log
  const handleRetryLog = async (logId: string) => {
    startTransition(async () => {
      const res = await retryWebhookLog(logId);
      if (res.success) {
        toast.success("Reintento ejecutado exitosamente.");
        fetchLogs(currentPage);
      } else {
        toast.error(res.error ?? "El reintento falló.");
      }
    });
  };

  // Copy to Clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles.`);
  };

  const statusEndpointUrl = `${origin}/api/v1/brand/status`;
  const curlExample = `curl -X GET "${statusEndpointUrl}" \\
  -H "X-API-Key: ${apiKey || "mk_tu_api_key_aqui"}" \\
  -H "Content-Type: application/json"`;

  const _outboundSampleJson = `{
  "event": "user.registered",
  "timestamp": "2026-08-12T12:00:00.000Z",
  "brandId": "${userBrandId || "clx_id_de_marca"}",
  "data": {
    "userId": "usr_123456",
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "role": "USER",
    "registeredAtUtc": "2026-08-12T12:00:00.000Z"
  }
}`;

  const inboundResponseSampleJson = `{
  "success": true,
  "data": {
    "brandId": "${userBrandId || "clx_id_de_marca"}",
    "brandName": "${brand?.name || "General"}",
    "locale": "${brand?.defaultLocale || "es"}",
    "timezone": "${brand?.timezone || "UTC"}",
    "isWebhookEnabled": ${isWebhookEnabled ? "true" : "false"},
    "serverTimeUtc": "2026-08-12T12:00:00.000Z",
    "status": "OPERATIONAL"
  }
}`;

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-emerald-500" />
            <span>{t("integrations.title", "Integraciones & Webhooks")}</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t(
              "integrations.subtitle",
              "Gestión de automatizaciones salientes, API Inbound y auditoría de eventos"
            )}
          </p>
        </div>
      </div>

      {/* Brand Credentials Info Panel */}
      <Card
        className={
          "border-zinc-200/80 dark:border-zinc-800/60 bg-white/90 " +
          "dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 shadow-md " +
          "overflow-hidden rounded-2xl"
        }
      >
        <CardContent className="p-6 space-y-4">
          <div
            className={
              "flex flex-col sm:flex-row sm:items-center justify-between gap-4 " +
              "border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4"
            }
          >
            <div className="flex items-center gap-3">
              <div
                className={
                  "p-2.5 bg-emerald-500/10 border border-emerald-500/20 " +
                  "rounded-xl text-emerald-600 dark:text-emerald-400"
                }
              >
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3
                  className={
                    "text-base font-bold text-zinc-900 dark:text-white flex " +
                    "items-center gap-2"
                  }
                >
                  <span>Marca Activa: {brand?.name ?? "General"}</span>
                  {isWebhookEnabled ? (
                    <Badge
                      className={
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 " +
                        "border-emerald-500/20 text-[10px]"
                      }
                    >
                      Webhooks Activos
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      Webhooks Desactivados
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  ID:{" "}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {userBrandId ?? "No configurado"}
                  </code>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(userBrandId ?? "", "Brand ID")}
              className="gap-2 text-xs font-bold shrink-0"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar Brand ID</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <span
                className={
                  "text-xs font-bold text-zinc-600 dark:text-zinc-400 flex " +
                  "items-center gap-1.5"
                }
              >
                <Key className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>API Key de la Marca (Inbound Authentication):</span>
              </span>
              <code
                className={
                  "text-sm font-mono font-bold text-emerald-600 " +
                  "dark:text-emerald-400 block tracking-wide"
                }
              >
                {apiKey || "Sin API Key generada"}
              </code>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey, "API Key")}
                className="gap-2 text-xs font-bold"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copiar API Key</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerateApiKey}
                disabled={isPending}
                className={
                  "gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 " +
                  "hover:bg-rose-500/10"
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Regenerar</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-xl bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
          <TabsTrigger value="webhooks" className="gap-2 text-xs font-bold">
            <Webhook className="h-4 w-4" />
            <span>{t("integrations.tabWebhooks", "Webhooks Salientes")}</span>
          </TabsTrigger>

          <TabsTrigger value="endpoints" className="gap-2 text-xs font-bold">
            <Key className="h-4 w-4" />
            <span>{t("integrations.tabEndpoints", "Endpoints Inbound")}</span>
          </TabsTrigger>

          <TabsTrigger value="logs" className="gap-2 text-xs font-bold">
            <Activity className="h-4 w-4" />
            <span>{t("integrations.tabLogs", "Seguimiento de Webhooks")}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OUTBOUND WEBHOOKS */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Webhook className="h-5 w-5 text-emerald-500" />
                <span>Configuración de Webhooks Salientes (Outbound)</span>
              </CardTitle>
              <CardDescription>
                Define las URLs de destino en n8n, Zapier o tu servidor para recibir
                eventos automáticos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Switch Card */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <span>{t("integrations.masterSwitch", "Habilitar Webhooks de Marca")}</span>
                    {isWebhookEnabled ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-[10px]">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        Desactivado
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t(
                      "integrations.masterSwitchDesc",
                      "Permite el envío automático de webhooks salientes hacia servicios externos."
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isWebhookEnabled}
                  onChange={(e) => setIsWebhookEnabled(e.target.checked)}
                  className="h-5 w-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>


              {/* General Webhook URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="generalWebhookUrl" className="text-xs font-bold">
                    {t(
                      "integrations.generalUrlLabel",
                      "URL de Webhook para Eventos Generales (generalWebhookUrl)"
                    )}
                  </Label>
                  {generalWebhookUrl ? (
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 text-[10px]">
                      <Check className="h-3 w-3" />
                      <span>Configurado</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-500 gap-1 text-[10px]">
                      <AlertCircle className="h-3 w-3" />
                      <span>Sin configurar (Usará fallback .env)</span>
                    </Badge>
                  )}
                </div>
                <Input
                  id="generalWebhookUrl"
                  type="url"
                  placeholder={t(
                    "integrations.generalUrlPlaceholder",
                    "https://tu-n8n.ejemplo.com/webhook/general"
                  )}
                  value={generalWebhookUrl}
                  onChange={(e) => setGeneralWebhookUrl(e.target.value)}
                />
                <p className="text-[11px] text-zinc-500">
                  Disparado para eventos del sistema como registros de usuarios o cambios de
                  configuración.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isPending}
                  className="w-full sm:w-auto font-bold gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{t("integrations.saveSettings", "Guardar Configuración")}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendTestWebhook}
                  disabled={isPending}
                  className="w-full sm:w-auto font-bold gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                  <span>{t("integrations.sendTest", "Enviar Webhook de Prueba")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: INBOUND ENDPOINTS */}
        <TabsContent value="endpoints" className="space-y-6">
          {/* Brand Status Endpoint Service Card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                <span>{t("integrations.brandStatusTitle", "Endpoint de Estatus & Salud de Marca")}</span>
              </CardTitle>
              <CardDescription>
                Servicio Inbound en tiempo real para verificar la salud y configuración de la marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-zinc-900 text-zinc-100 rounded-xl text-xs font-mono flex items-center justify-between overflow-x-auto">
                <span className="text-emerald-400 font-bold mr-2">GET / POST</span>
                <span className="truncate">{statusEndpointUrl}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(statusEndpointUrl, "Endpoint URL")}
                  className="text-zinc-400 hover:text-white shrink-0 ml-2"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* cURL Example */}
              <div className="space-y-2">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  <span>Ejemplo de consumo vía cURL</span>
                </Label>
                <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800">
                  {curlExample}
                </pre>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(curlExample, "cURL")}
                    className="gap-2 text-xs font-bold"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{t("integrations.copyCurl", "Copiar cURL")}</span>
                  </Button>
                </div>
              </div>

              {/* Inbound Response Structure */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <Label className="text-xs font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-500" />
                  <span>Estructura de Respuesta Esperada (Response Schema)</span>
                </Label>
                <pre className="p-4 bg-zinc-950 text-zinc-300 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800">
                  {inboundResponseSampleJson}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: WEBHOOK MONITORING & LOGS */}
        <TabsContent value="logs" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">
                    {t("integrations.metricTotal", "Total Salientes")}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                    {totalLogs}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <Webhook className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">
                    {t("integrations.metricSuccess", "Enviados con Éxito")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {successCount}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">
                    {t("integrations.metricFailed", "Fallidos / Reintentos")}
                  </p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                    {failCount}
                  </p>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-500">
                    {t("integrations.metricLatency", "Latencia Promedio")}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                    {avgDurationMs} ms
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                  <Clock className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs Table Card */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">
                  {t("integrations.logsTitle", "Auditoría de Entregabilidad de Webhooks")}
                </CardTitle>
                <CardDescription>
                  Historial de despachos HTTP, latencias y reintentos exponenciales.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(currentPage)}
                disabled={isPending}
                className="gap-2 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Actualizar</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900/80">
                    <TableRow>
                      <TableHead className="font-bold text-xs">
                        {t("integrations.colEvent", "Evento")}
                      </TableHead>
                      <TableHead className="font-bold text-xs">
                        {t("integrations.colUrl", "URL Destino")}
                      </TableHead>
                      <TableHead className="font-bold text-xs">
                        {t("integrations.colStatus", "Estatus HTTP")}
                      </TableHead>
                      <TableHead className="font-bold text-xs">
                        {t("integrations.colAttempts", "Intentos")}
                      </TableHead>
                      <TableHead className="font-bold text-xs">
                        {t("integrations.colDate", "Fecha (UTC)")}
                      </TableHead>
                      <TableHead className="text-right font-bold text-xs">
                        {t("integrations.colActions", "Acciones")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-500">
                          Sin registros de webhooks recientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className="text-xs">
                          <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {log.event}
                          </TableCell>
                          <TableCell className="font-mono text-zinc-600 dark:text-zinc-300 max-w-xs truncate">
                            {log.url}
                          </TableCell>
                          <TableCell>
                            {log.success ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>{log.status ?? 200} OK</span>
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="gap-1 text-[10px]">
                                <AlertCircle className="h-3 w-3" />
                                <span>{log.status ? `HTTP ${log.status}` : "Error de Red"}</span>
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {log.attempts} / 5
                          </TableCell>
                          <TableCell>
                            <FormattedDate date={log.createdAt} format="datetime" />
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-8 px-2 text-xs gap-1"
                              title={t("integrations.viewDetail", "Ver Detalle")}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {!log.success && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRetryLog(log.id)}
                                disabled={isPending}
                                className="h-8 px-2 text-xs gap-1 font-bold text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
                                title={t("integrations.retryNow", "Reintentar Ahora")}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* MANDATORY PAGINATION CONTROL */}
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  router.push(`/dashboard/admin/integrations?page=${page}`);
                  fetchLogs(page);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WEBHOOK LOG DETAIL MODAL */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Webhook className="h-5 w-5 text-emerald-500" />
              <span>{t("integrations.modalTitle", "Detalle de Registro de Webhook")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Evento: <code className="font-bold text-emerald-600">{selectedLog?.event}</code> | URL: {selectedLog?.url}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-xs mt-2">
              {/* Status Meta Info */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Estatus</span>
                  <span className="font-bold">{selectedLog.status ?? "Error"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Latencia</span>
                  <span className="font-bold">{selectedLog.durationMs ?? 0} ms</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Intentos</span>
                  <span className="font-bold">{selectedLog.attempts} / 5</span>
                </div>
              </div>

              {/* Payload Section */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("integrations.payloadLabel", "Payload Enviado (JSON)")}
                </Label>
                <pre className="p-3 bg-zinc-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-zinc-800">
                  {tryFormatJson(selectedLog.payload)}
                </pre>
              </div>

              {/* Response Section */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {t("integrations.responseLabel", "Respuesta Recibida del Servidor")}
                </Label>
                <pre className="p-3 bg-zinc-950 text-zinc-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 border border-zinc-800">
                  {selectedLog.response || selectedLog.errorMessage || "Sin cuerpo de respuesta."}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function tryFormatJson(rawStr: string): string {
  try {
    const obj = JSON.parse(rawStr);
    return JSON.stringify(obj, null, 2);
  } catch (_err: unknown) {
    return rawStr;
  }
}

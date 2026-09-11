"use client";

import { useState } from "react";
import { Upload, Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateCSV, decodeTextWithAutoEncoding } from "@/lib/csv";
import { importStudentsFromCSVAction } from "@/actions/students";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/i18n-provider";

interface CSVImportModalProps {
  brandId: string;
  onSuccess?: () => void;
}

export function CSVImportModal({ brandId, onSuccess }: CSVImportModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const downloadTemplate = () => {
    const headers = [
      "nombre",
      "apellido",
      "fecha_nacimiento",
      "nacionalidad",
      "documento_identidad",
      "emergencia_telefono",
      "tutor_nombre",
      "tutor_email",
      "tutor_telefono",
    ];
    const demoRows = [
      {
        nombre: "Mateo",
        apellido: "Alvarez",
        fecha_nacimiento: "15/04/2014",
        nacionalidad: "Mexicana",
        documento_identidad: "10203040",
        emergencia_telefono: "3004567890",
        tutor_nombre: "Carlos Alvarez",
        tutor_email: "carlos.alvarez@ejemplo.com",
        tutor_telefono: "3004567890",
      },
      {
        nombre: "Sofia",
        apellido: "Barrera",
        fecha_nacimiento: "22/08/2015",
        nacionalidad: "Colombiana",
        documento_identidad: "10203041",
        emergencia_telefono: "3004567891",
        tutor_nombre: "Elena Barrera",
        tutor_email: "elena.barrera@ejemplo.com",
        tutor_telefono: "3004567891",
      },
      {
        nombre: "Roberto",
        apellido: "Mendoza",
        fecha_nacimiento: "10/05/1995",
        nacionalidad: "Española",
        documento_identidad: "10203042",
        emergencia_telefono: "3004567892",
        tutor_nombre: "",
        tutor_email: "",
        tutor_telefono: "",
      },
    ];
    const csv = generateCSV(headers, demoRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_alumnos.csv";
    a.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setReport(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (!buffer) {
        setIsLoading(false);
        return;
      }
      try {
        const content = decodeTextWithAutoEncoding(buffer);
        const response = await importStudentsFromCSVAction(brandId, content);

        if (!response.success) {
          toast.error(response.error || "Error al procesar el archivo CSV.");
          return;
        }

        if (response.data) {
          setReport(response.data);
          toast.success(
            t("students.csvSuccess", "Importación de alumnos completada.")
          );
          if (onSuccess) onSuccess();
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Error al importar los alumnos."
        );
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_importacion_alumnos.csv";
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100",
            "dark:hover:bg-zinc-800/60 rounded-xl px-4 font-bold text-xs",
            "text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-2"
          )}
        >
          <Upload className="h-4 w-4 text-amber-500" />
          <span>{t("students.importCSV", "Importar CSV")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-900",
          "dark:border-zinc-800 dark:text-white rounded-3xl sm:max-w-[500px]",
          "border shadow-2xl"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-6 w-6 text-amber-500" />
            {t("students.importTitle", "Carga Masiva de Alumnos")}
          </DialogTitle>
          <DialogDescription className="text-zinc-600 dark:text-zinc-400 text-xs">
            {t(
              "students.importDesc",
              "Importa múltiples expedientes de alumnos desde un archivo CSV sin forzar la creación de usuarios."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
            <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Download className="h-4 w-4" />
              1. {t("students.step1", "Descarga la plantilla")}
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t(
                "students.step1Desc",
                "Utiliza nuestro formato estándar para garantizar que los expedientes se carguen correctamente."
              )}
            </p>
            <Button
              onClick={downloadTemplate}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-bold w-full cursor-pointer shadow-xs text-xs"
            >
              {t("students.downloadTemplate", "Descargar Plantilla CSV")}
            </Button>
          </div>

          {!report ? (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2 px-1">
                <Upload className="h-4 w-4 text-amber-500" />
                2. {t("students.step2", "Sube tu archivo CSV")}
              </h4>
              <label
                className={cn(
                  "flex flex-col items-center justify-center w-full h-32 border-2",
                  "border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl",
                  "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all"
                )}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500 mb-2" />
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        {t("students.selectCSV", "Seleccionar archivo .csv")}
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {t("students.completed", "Proceso Finalizado")}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                    {t(
                      "students.completedDesc",
                      "Se han procesado todos los expedientes del archivo."
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={downloadReport}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl font-bold h-11 cursor-pointer shadow-xs text-xs"
              >
                <Download className="mr-2 h-4 w-4" />
                {t("students.downloadReport", "Descargar Reporte de Resultados")}
              </Button>
              <Button
                onClick={() => setReport(null)}
                variant="ghost"
                className="w-full text-zinc-500 dark:text-zinc-400 font-medium text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded-xl"
              >
                {t("students.uploadAnother", "Cargar otro archivo")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

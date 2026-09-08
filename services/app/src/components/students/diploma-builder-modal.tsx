"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  Settings2,
  Save,
  RotateCcw,
  Loader2,
  Check,
  Image as ImageIcon,
  FileText,
  Users,
  FileCheck,
  LayoutGrid,
  Tag,
  Upload,
  Trash2,
} from "lucide-react";
import type { StudentWithDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBrand } from "@/context/brand-context";
import {
  getDiplomaConfigAction,
  saveDiplomaConfigAction,
  uploadDiplomaBackgroundAction,
  removeDiplomaBackgroundAction,
} from "@/actions/diploma";

interface DiplomaBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: StudentWithDetails[];
  activeFilterDisciplineName?: string;
}

// Helper to calculate discipline text for each student based on filter and showDiscipline toggle
function getStudentDisciplineInfo(
  student: StudentWithDetails,
  showDiscipline: boolean,
  activeFilterDisciplineName?: string
): { disciplineName: string; beltName: string } {
  if (!showDiscipline) {
    return { disciplineName: "", beltName: "" };
  }

  // If filtered by a specific discipline in the main table toolbar, use that discipline!
  if (activeFilterDisciplineName) {
    return {
      disciplineName: activeFilterDisciplineName,
      beltName: student?.currentBelt?.name || "Grado Oficial",
    };
  }

  // Otherwise fallback to student's enrolled disciplines
  const enrollments = student?.enrollments || [];
  const beltName = student?.currentBelt?.name || "Grado Oficial";

  if (enrollments.length === 0) {
    return {
      disciplineName: "Artes Marciales",
      beltName,
    };
  }

  const allNames = enrollments
    .map((e) => e.discipline?.name)
    .filter((n): n is string => Boolean(n))
    .join(" • ");

  return {
    disciplineName: allNames || "Artes Marciales",
    beltName,
  };
}

export function DiplomaBuilderModal({
  open,
  onOpenChange,
  students,
  activeFilterDisciplineName,
}: DiplomaBuilderModalProps) {
  const { selectedBrandId, brands } = useBrand();
  const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0];

  // Config state
  const [template, setTemplate] = useState<"classic" | "modern">("classic");
  const [layout, setLayout] = useState<"1perpage" | "2perpage">("1perpage");
  const [isBlankMode, setIsBlankMode] = useState<boolean>(false);
  const [showDiscipline, setShowDiscipline] = useState<boolean>(true);
  const [showConfig, setShowConfig] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);

  // Custom text fields
  const [institutionName, setInstitutionName] = useState(
    activeBrand?.name || "Menlu 门路 • Academia de Artes Marciales"
  );
  const [reasonText, setReasonText] = useState(
    "Por su sobresaliente constancia, disciplina y destacado avance en El Camino del Esfuerzo."
  );
  const [dateText, setDateText] = useState(() => {
    const now = new Date();
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  });
  const [schoolLogoSubtext, setSchoolLogoSubtext] = useState(
    "Academia de Artes Marciales"
  );

  // 4 Signatures
  const [sig1Name, setSig1Name] = useState("Sensei Principal / Director");
  const [sig1Role, setSig1Role] = useState("Director General del Dojo");

  const [sig2Name, setSig2Name] = useState("Comité de Grados");
  const [sig2Role, setSig2Role] = useState("Certificación Oficial");

  const [sig3Name, setSig3Name] = useState("Instructor de Tatami");
  const [sig3Role, setSig3Role] = useState("Formador de Grados");

  const [sig4Name, setSig4Name] = useState("Árbitro / Evaluador");
  const [sig4Role, setSig4Role] = useState("Jurado Evaluador");

  // Loading & Saving states
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // Load saved config for Brand from DB on mount/open
  useEffect(() => {
    if (open) {
      setIsLoadingConfig(true);
      getDiplomaConfigAction()
        .then((res) => {
          if (res.success && res.data) {
            const cfg = res.data;
            if (cfg.template) setTemplate(cfg.template as "classic" | "modern");
            if (cfg.layout) setLayout(cfg.layout as "1perpage" | "2perpage");
            if (cfg.isBlankMode !== undefined) setIsBlankMode(cfg.isBlankMode);
            if (cfg.showDiscipline !== undefined) setShowDiscipline(cfg.showDiscipline);
            if (cfg.backgroundUrl !== undefined) setBackgroundUrl(cfg.backgroundUrl);
            if (cfg.institutionName) setInstitutionName(cfg.institutionName);
            if (cfg.reasonText) setReasonText(cfg.reasonText);
            if (cfg.dateText) setDateText(cfg.dateText);
            if (cfg.schoolLogoSubtext) setSchoolLogoSubtext(cfg.schoolLogoSubtext);
            if (cfg.sig1Name !== undefined) setSig1Name(cfg.sig1Name || "");
            if (cfg.sig1Role !== undefined) setSig1Role(cfg.sig1Role || "");
            if (cfg.sig2Name !== undefined) setSig2Name(cfg.sig2Name || "");
            if (cfg.sig2Role !== undefined) setSig2Role(cfg.sig2Role || "");
            if (cfg.sig3Name !== undefined) setSig3Name(cfg.sig3Name || "");
            if (cfg.sig3Role !== undefined) setSig3Role(cfg.sig3Role || "");
            if (cfg.sig4Name !== undefined) setSig4Name(cfg.sig4Name || "");
            if (cfg.sig4Role !== undefined) setSig4Role(cfg.sig4Role || "");
          }
        })
        .finally(() => setIsLoadingConfig(false));
    }
  }, [open]);

  // Helper to read image dimensions for print resolution validation
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error("Error al leer el archivo de imagen."));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle custom JPG background image upload with strict size & resolution validations
  // for high print quality
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Format validation (.jpg / .jpeg)
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && file.type !== "image/jpeg") {
      toast.error("Formato no permitido. Solo se admiten archivos de imagen en formato JPG (.jpg / .jpeg).");
      e.target.value = "";
      return;
    }

    // 2. Maximum file size validation (10 MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("El archivo excede el tamaño máximo de 10 MB. Por favor, sube una imagen optimizada.");
      e.target.value = "";
      return;
    }

    // 3. Minimum resolution validation for sharp printing (at least 1000x700px)
    try {
      const { width, height } = await getImageDimensions(file);
      if (width < 1000 || height < 700) {
        toast.error(
          `La resolución de la imagen es demasiado baja (${width}x${height}px). Para garantizar una excelente calidad de impresión se requiere una resolución mínima de 1000x700px.`
        );
        e.target.value = "";
        return;
      }
    } catch {
      toast.error("No se pudo verificar la resolución del archivo de imagen.");
      e.target.value = "";
      return;
    }

    setIsUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadDiplomaBackgroundAction(formData);
      if (res.success && res.data) {
        setBackgroundUrl(res.data.backgroundUrl);
        toast.success("Imagen de fondo en alta resolución guardada correctamente.");
      } else {
        toast.error(res.error || "No se pudo subir la imagen de fondo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al subir la imagen de fondo.");
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      const res = await removeDiplomaBackgroundAction();
      if (res.success) {
        setBackgroundUrl(null);
        toast.success("Imagen de fondo eliminada.");
      } else {
        toast.error(res.error || "No se pudo eliminar la imagen de fondo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar la imagen de fondo.");
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await saveDiplomaConfigAction({
        template,
        layout,
        isBlankMode,
        showDiscipline,
        backgroundUrl,
        institutionName,
        reasonText,
        dateText,
        schoolLogoSubtext,
        sig1Name,
        sig1Role,
        sig2Name,
        sig2Role,
        sig3Name,
        sig3Role,
        sig4Name,
        sig4Role,
      });

      if (res.success) {
        setSaveSuccess(true);
        toast.success("Configuración de diplomas guardada en la base de datos.");
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        toast.error(res.error || "No se pudo guardar la configuración.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setTemplate("classic");
    setLayout("1perpage");
    setIsBlankMode(false);
    setShowDiscipline(true);
    setInstitutionName(activeBrand?.name || "Menlu 门路 • Academia de Artes Marciales");
    setReasonText(
      "Por su sobresaliente constancia, disciplina y destacado avance en El Camino del Esfuerzo."
    );
    const now = new Date();
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    setDateText(`${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`);
    setSchoolLogoSubtext("Academia de Artes Marciales");
    setSig1Name("Sensei Principal / Director");
    setSig1Role("Director General del Dojo");
    setSig2Name("Comité de Grados");
    setSig2Role("Certificación Oficial");
    setSig3Name("Instructor de Tatami");
    setSig3Role("Formador de Grados");
    setSig4Name("Árbitro / Evaluador");
    setSig4Role("Jurado Evaluador");
  };

  // Determine active students for preview and print
  const activeStudents = isBlankMode
    ? layout === "2perpage"
      ? [
          { id: "blank1", user: { name: "" }, enrollments: [], currentBelt: null } as unknown as StudentWithDetails,
          { id: "blank2", user: { name: "" }, enrollments: [], currentBelt: null } as unknown as StudentWithDetails,
        ]
      : [{ id: "blank1", user: { name: "" }, enrollments: [], currentBelt: null } as unknown as StudentWithDetails]
    : students.length > 0
    ? students
    : [{ id: "blank1", user: { name: "" }, enrollments: [], currentBelt: null } as unknown as StudentWithDetails];

  // Group into pairs for 2-per-page layout
  const groupedStudents: StudentWithDetails[][] = [];
  if (layout === "2perpage") {
    for (let i = 0; i < activeStudents.length; i += 2) {
      groupedStudents.push(activeStudents.slice(i, i + 2));
    }
  }

  const handleExecutePrint = () => {
    if (!activeStudents || activeStudents.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permite las ventanas emergentes en tu navegador para abrir la pestaña de impresión.");
      return;
    }

    let pagesHtml = "";

    const customBgCss =
      template === "modern" && backgroundUrl
        ? `background-image: url('${backgroundUrl}'); background-size: cover; background-position: center;`
        : "";

    if (layout === "1perpage") {
      activeStudents.forEach((student) => {
        const studentName = student.user?.name || "";
        const studentIdCode =
          student.id !== "blank1" && student.id !== "blank2"
            ? `STU-${student.id.slice(-6).toUpperCase()}`
            : "";
        const { disciplineName, beltName } = getStudentDisciplineInfo(
          student,
          showDiscipline,
          activeFilterDisciplineName
        );

        pagesHtml += `
          <div class="diploma-page single-page">
            <div class="diploma-card ${template}" style="${customBgCss}">
              ${
                template === "classic" && !backgroundUrl
                  ? `<div class="wave-accent">
                      <svg viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 40C100 10 200 80 300 30C350 5 400 20 400 20V0H0V40Z" fill="#1e3a8a" opacity="0.15"/>
                        <path d="M0 70C120 30 220 100 320 50C370 25 400 40 400 40V0H0V70Z" fill="#3b82f6" opacity="0.10"/>
                      </svg>
                    </div>`
                  : ""
              }

              <div class="header">
                ${
                  template === "classic"
                    ? `<div class="brand-logo font-serif font-black">⚔</div>`
                    : `<div style="width:40px;"></div>`
                }
                <div class="inst-container">
                  <span class="inst-sub">${schoolLogoSubtext}</span>
                  <h2 class="inst-name">${institutionName}</h2>
                </div>
                <div class="header-right font-mono text-[8pt] text-blue-800 font-bold">${studentIdCode}</div>
              </div>

              <div class="body-content">
                <p class="intro-text">Otorga el presente reconocimiento de Honor a:</p>
                <div class="student-name-container">
                  <h1 class="student-name">${studentName || "&nbsp;"}</h1>
                </div>
                <p class="reason-text">${reasonText}</p>
                ${
                  showDiscipline && disciplineName
                    ? `<div class="badge-tag">${disciplineName} ${beltName ? `• <strong>${beltName}</strong>` : ""}</div>`
                    : ""
                }
                <div class="date-in-body">
                  Expedido el ${dateText}
                </div>
              </div>

              <div class="signatures-grid">
                <div class="sig-box">
                  ${sig1Name ? `<div class="sig-line"></div><div class="sig-name">${sig1Name}</div><div class="sig-role">${sig1Role}</div>` : ""}
                </div>
                <div class="sig-box">
                  ${sig2Name ? `<div class="sig-line"></div><div class="sig-name">${sig2Name}</div><div class="sig-role">${sig2Role}</div>` : ""}
                </div>
                <div class="sig-box">
                  ${sig3Name ? `<div class="sig-line"></div><div class="sig-name">${sig3Name}</div><div class="sig-role">${sig3Role}</div>` : ""}
                </div>
                <div class="sig-box">
                  ${sig4Name ? `<div class="sig-line"></div><div class="sig-name">${sig4Name}</div><div class="sig-role">${sig4Role}</div>` : ""}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    } else {
      // 2 per page layout (Portrait Letter Sheet)
      groupedStudents.forEach((pair) => {
        let pairCardsHtml = "";
        pair.forEach((student) => {
          const studentName = student.user?.name || "";
          const studentIdCode =
            student.id !== "blank1" && student.id !== "blank2"
              ? `STU-${student.id.slice(-6).toUpperCase()}`
              : "";
          const { disciplineName, beltName } = getStudentDisciplineInfo(
            student,
            showDiscipline,
            activeFilterDisciplineName
          );

          pairCardsHtml += `
            <div class="diploma-card-half ${template}" style="${customBgCss}">
              <div class="header half-header">
                ${
                  template === "classic"
                    ? `<div class="brand-logo text-sm font-black">⚔</div>`
                    : `<div style="width:20px;"></div>`
                }
                <div class="inst-container">
                  <h2 class="inst-name half-inst">${institutionName}</h2>
                </div>
                <div class="font-mono text-[7pt] text-blue-800 font-bold">${studentIdCode}</div>
              </div>

              <div class="body-content half-body">
                <p class="intro-text text-[9pt]">Otorga el presente diploma a:</p>
                <h2 class="student-name half-name">${studentName || "&nbsp;"}</h2>
                <p class="reason-text text-[9pt]">${reasonText}</p>
                ${
                  showDiscipline && disciplineName
                    ? `<div class="badge-tag text-[8pt] py-0.5 px-2">${disciplineName} • ${beltName}</div>`
                    : ""
                }
                <div class="date-in-body text-[8pt]">Expedido el ${dateText}</div>
              </div>

              <div class="signatures-grid half-sigs">
                <div class="sig-box">
                  ${sig1Name ? `<div class="sig-line"></div><div class="sig-name text-[7.5pt]">${sig1Name}</div>` : ""}
                </div>
                <div class="sig-box">
                  ${sig2Name ? `<div class="sig-line"></div><div class="sig-name text-[7.5pt]">${sig2Name}</div>` : ""}
                </div>
              </div>
            </div>
          `;
        });

        // If odd number, add empty slot
        if (pair.length < 2) {
          pairCardsHtml += `
            <div class="h-[134mm] w-full border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
              (Espacio disponible de media carta)
            </div>
          `;
        }

        pagesHtml += `<div class="diploma-page double-page">${pairCardsHtml}</div>`;
      });
    }

    const htmlDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Diplomas Oficiales - ${institutionName}</title>
          <style>
            @page {
              size: ${layout === "2perpage" ? "letter portrait" : "A4 landscape"};
              margin: 0;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .diploma-page {
              width: ${layout === "2perpage" ? "215.9mm" : "297mm"};
              height: ${layout === "2perpage" ? "279.4mm" : "210mm"};
              padding: 8mm;
              box-sizing: border-box;
              page-break-after: always;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #ffffff;
            }
            .diploma-page:last-child {
              page-break-after: avoid;
            }
            .double-page {
              flex-direction: column;
              gap: 6mm;
            }
            .diploma-card {
              width: 100%;
              height: 100%;
              padding: 8mm 12mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              position: relative;
              overflow: hidden;
              background: #ffffff;
            }
            .diploma-card.classic {
              border: 5px solid #1e3a8a;
            }
            .diploma-card.modern {
              border: none !important;
              box-shadow: none !important;
              background: transparent;
            }
            .wave-accent {
              position: absolute;
              top: 0;
              right: 0;
              width: 320px;
              height: 120px;
              pointer-events: none;
            }
            .header {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 4mm;
              z-index: 2;
            }
            .brand-logo {
              font-size: 20pt;
              color: #1e3a8a;
            }
            .inst-container {
              text-align: center;
            }
            .inst-sub {
              font-size: 7.5pt;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 2px;
              text-transform: uppercase;
              display: block;
            }
            .inst-name {
              font-size: 20pt;
              font-weight: 900;
              color: #1e3a8a;
              margin: 0;
              font-family: 'Georgia', serif;
              letter-spacing: 0.5px;
            }
            .body-content {
              z-index: 2;
              width: 100%;
              max-width: 750px;
              margin: 2mm auto;
            }
            .intro-text {
              font-size: 11pt;
              color: #475569;
              margin-bottom: 2mm;
            }
            .student-name-container {
              border-bottom: 2px solid #0f172a;
              padding-bottom: 2mm;
              margin: 2mm auto 4mm;
              min-width: 300px;
              display: inline-block;
            }
            .student-name {
              font-size: 26pt;
              font-weight: 900;
              color: #1e3a8a;
              margin: 0;
              font-family: 'Georgia', serif;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .reason-text {
              font-size: 10.5pt;
              color: #334155;
              line-height: 1.4;
              margin: 2mm 0;
            }
            .badge-tag {
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
              font-size: 9pt;
              font-weight: 600;
              padding: 2px 12px;
              border-radius: 99px;
              display: inline-block;
              margin-top: 2mm;
            }
            .date-in-body {
              font-size: 9pt;
              font-weight: 600;
              color: #64748b;
              margin-top: 3mm;
            }
            .signatures-grid {
              width: 100%;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 4mm;
              align-items: flex-end;
              z-index: 2;
              padding: 6mm 4mm 0;
              border-top: 1.5px solid #e2e8f0;
            }
            .sig-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
            .sig-line {
              width: 80%;
              border-bottom: 1.5px solid #0f172a;
              margin-bottom: 2px;
            }
            .sig-name {
              font-size: 8pt;
              font-weight: 800;
              color: #0f172a;
              text-transform: uppercase;
              line-height: 1.1;
            }
            .sig-role {
              font-size: 7pt;
              color: #64748b;
              line-height: 1.1;
            }

            /* Half page 2-per-page styles */
            .diploma-card-half {
              width: 100%;
              height: 128mm;
              padding: 4mm 8mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              background: #ffffff;
            }
            .diploma-card-half.classic {
              border: 3px solid #1e3a8a;
            }
            .diploma-card-half.modern {
              border: none !important;
              background: transparent;
            }
            .half-inst { font-size: 14pt; }
            .half-name { font-size: 18pt; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-[100vw] h-screen w-screen p-0 m-0 rounded-none border-none bg-slate-950 text-white flex flex-col overflow-hidden"
      >
        {/* STICKY TOP HEADER NAVBAR (Matching ChessCoach Image 100%) */}
        <header className="print:hidden bg-slate-900 border-b border-white/10 text-white p-3.5 px-6 sticky top-0 z-50 shadow-md flex items-center justify-between shrink-0 flex-wrap gap-3">
          {/* Left: Title & Brand Info */}
          <div>
            <h1 className="font-extrabold text-base tracking-tight flex items-center gap-2 text-white">
              Menlu <span className="text-amber-400 font-normal">门路</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full font-bold uppercase border border-amber-500/20">
                Diseñador de Diplomas
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Marca: <span className="font-semibold text-slate-200">{institutionName}</span> (
              {isBlankMode
                ? layout === "2perpage"
                  ? "2 diplomas en blanco (1 hoja)"
                  : "1 diploma en blanco"
                : `${activeStudents.length} diploma${activeStudents.length !== 1 ? "s" : ""}`}
              )
              {activeFilterDisciplineName && (
                <span className="ml-2 text-amber-400 font-bold">
                  • Filtro Activo: {activeFilterDisciplineName}
                </span>
              )}
            </p>
          </div>

          {/* Right: Control Pill Buttons (Matching ChessCoach Image) */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Bandera / Toggle para Mostrar Disciplina */}
            <button
              type="button"
              onClick={() => setShowDiscipline(!showDiscipline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showDiscipline
                  ? "bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Mostrar u Ocultar la insignia de la disciplina en los diplomas"
            >
              <Tag className="w-3.5 h-3.5" />
              {showDiscipline ? "Disciplina: Visible" : "Disciplina: Oculta"}
            </button>

            {/* Template Selector */}
            <div className="flex bg-slate-950 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTemplate("modern")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  template === "modern"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Moderno
              </button>
              <button
                type="button"
                onClick={() => setTemplate("classic")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  template === "classic"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Clásico
              </button>
            </div>

            {/* Content Mode Selector (Alumnos vs En Blanco) */}
            <div className="flex bg-slate-950 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setIsBlankMode(false)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isBlankMode
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Alumnos ({students.length})
              </button>
              <button
                type="button"
                onClick={() => setIsBlankMode(true)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isBlankMode
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" /> En Blanco
              </button>
            </div>

            {/* Layout Selector (2 por Hoja vs 1 por Hoja) */}
            <div className="flex bg-slate-950 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setLayout("2perpage")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  layout === "2perpage"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> 2 por Hoja
              </button>
              <button
                type="button"
                onClick={() => setLayout("1perpage")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  layout === "1perpage"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> 1 por Hoja
              </button>
            </div>

            {/* Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showConfig
                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  : "bg-slate-950 border-white/10 text-slate-300 hover:bg-slate-800"
              }`}
              title="Personalizar Textos y Firmas"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handleExecutePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </header>

        {/* Collapsible Customization Drawer / Panel */}
        {showConfig && (
          <div className="max-w-6xl mx-auto my-3 p-4 bg-slate-900 border-blue-500/30 text-white rounded-2xl border shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                ⚙️ Configuración Personalizada del Diploma (Vinculado a Marca)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetDefaults}
                  className="h-7 text-[10px] text-zinc-400 hover:text-white gap-1 px-2"
                >
                  <RotateCcw className="h-3 w-3" /> Restablecer
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="h-7 text-[10px] gap-1 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : saveSuccess ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  <span>{isSaving ? "Guardando..." : "Guardar en DB"}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300 font-semibold">Nombre de la Marca / Institución</Label>
                <Input
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300 font-semibold">Subtexto de Encabezado</Label>
                <Input
                  value={schoolLogoSubtext}
                  onChange={(e) => setSchoolLogoSubtext(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-slate-300 font-semibold">Fecha de Expedición</Label>
                <Input
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
              </div>
            </div>

            {/* Custom JPG Background Image Uploader (public/uploads/diploma/[brandId].jpg) */}
            <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <Label className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Fondo Personalizado (.JPG - Solo Plantilla Moderna)
                </Label>
                <span className="text-[10px] text-slate-400">
                  Calidad de Impresión: <span className="text-emerald-400 font-semibold">Mín. 1000x700px</span> • Máx. 10 MB (<code className="text-amber-300">/uploads/diploma/[brandId].jpg</code>)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,.jpg,.jpeg"
                  onChange={handleBackgroundUpload}
                  disabled={isUploadingBg}
                  className="text-[11px] text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer disabled:opacity-50"
                />
                {isUploadingBg && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo...
                  </span>
                )}
                {backgroundUrl && !isUploadingBg && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      Fondo Activo
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveBackground}
                      className="h-7 text-[10px] px-2 py-0 font-bold gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Quitar Fondo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <Label className="text-[11px] text-slate-300">Motivo del Reconocimiento</Label>
              <Textarea
                rows={2}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="bg-slate-950 border-white/10 text-xs rounded-lg text-white resize-none"
              />
            </div>

            {/* 4 Signatures Setup */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Firma 1</Label>
                <Input
                  placeholder="Nombre Firma 1"
                  value={sig1Name}
                  onChange={(e) => setSig1Name(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
                <Input
                  placeholder="Cargo Firma 1"
                  value={sig1Role}
                  onChange={(e) => setSig1Role(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white mt-1"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Firma 2</Label>
                <Input
                  placeholder="Nombre Firma 2"
                  value={sig2Name}
                  onChange={(e) => setSig2Name(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
                <Input
                  placeholder="Cargo Firma 2"
                  value={sig2Role}
                  onChange={(e) => setSig2Role(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white mt-1"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Firma 3</Label>
                <Input
                  placeholder="Nombre Firma 3"
                  value={sig3Name}
                  onChange={(e) => setSig3Name(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
                <Input
                  placeholder="Cargo Firma 3"
                  value={sig3Role}
                  onChange={(e) => setSig3Role(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white mt-1"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400">Firma 4</Label>
                <Input
                  placeholder="Nombre Firma 4"
                  value={sig4Name}
                  onChange={(e) => setSig4Name(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white"
                />
                <Input
                  placeholder="Cargo Firma 4"
                  value={sig4Role}
                  onChange={(e) => setSig4Role(e.target.value)}
                  className="bg-slate-950 border-white/10 text-xs rounded-lg text-white mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN CANVAS PREVIEW AREA */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-950 flex flex-col items-center justify-start space-y-8 select-none">
          {isLoadingConfig ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Cargando diplomas de la Marca...
            </div>
          ) : layout === "2perpage" ? (
            /* 2 DIPLOMAS PER PAGE LAYOUT (LETTER PORTRAIT SHEET WITH CUTTING LINE) */
            groupedStudents.map((pair, pageIdx) => (
              <div
                key={pageIdx}
                className="w-full max-w-[215.9mm] min-h-[279.4mm] bg-white text-slate-900 shadow-2xl rounded-xl p-5 flex flex-col justify-between overflow-hidden border border-slate-200"
              >
                {/* Top Diploma Card */}
                <DiplomaCard
                  student={pair[0]}
                  template={template}
                  isHalfPage={true}
                  showDiscipline={showDiscipline}
                  backgroundUrl={backgroundUrl}
                  activeFilterDisciplineName={activeFilterDisciplineName}
                  institutionName={institutionName}
                  schoolLogoSubtext={schoolLogoSubtext}
                  reasonText={reasonText}
                  dateText={dateText}
                  sig1Name={sig1Name}
                  sig1Role={sig1Role}
                  sig2Name={sig2Name}
                  sig2Role={sig2Role}
                  sig3Name={sig3Name}
                  sig3Role={sig3Role}
                  sig4Name={sig4Name}
                  sig4Role={sig4Role}
                />

                {/* Cutting Line Indicator (Identical to ChessCoach) */}
                <div className="w-full border-b-2 border-dashed border-slate-300 relative my-3 shrink-0">
                  <span className="absolute left-4 -top-2.5 bg-white px-2 text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    ✂ Línea de corte (Media Carta)
                  </span>
                </div>

                {/* Bottom Diploma Card (or Blank Available Slot) */}
                {pair[1] ? (
                  <DiplomaCard
                    student={pair[1]}
                    template={template}
                    isHalfPage={true}
                    showDiscipline={showDiscipline}
                    backgroundUrl={backgroundUrl}
                    activeFilterDisciplineName={activeFilterDisciplineName}
                    institutionName={institutionName}
                    schoolLogoSubtext={schoolLogoSubtext}
                    reasonText={reasonText}
                    dateText={dateText}
                    sig1Name={sig1Name}
                    sig1Role={sig1Role}
                    sig2Name={sig2Name}
                    sig2Role={sig2Role}
                    sig3Name={sig3Name}
                    sig3Role={sig3Role}
                    sig4Name={sig4Name}
                    sig4Role={sig4Role}
                  />
                ) : (
                  <div className="h-[128mm] w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs italic">
                    (Espacio disponible de media carta)
                  </div>
                )}
              </div>
            ))
          ) : (
            /* 1 DIPLOMA PER PAGE LAYOUT (FULL PAGE A4 / LANDSCAPE) */
            activeStudents.map((student) => (
              <DiplomaCard
                key={student.id}
                student={student}
                template={template}
                isHalfPage={false}
                showDiscipline={showDiscipline}
                backgroundUrl={backgroundUrl}
                activeFilterDisciplineName={activeFilterDisciplineName}
                institutionName={institutionName}
                schoolLogoSubtext={schoolLogoSubtext}
                reasonText={reasonText}
                dateText={dateText}
                sig1Name={sig1Name}
                sig1Role={sig1Role}
                sig2Name={sig2Name}
                sig2Role={sig2Role}
                sig3Name={sig3Name}
                sig3Role={sig3Role}
                sig4Name={sig4Name}
                sig4Role={sig4Role}
              />
            ))
          )}
        </main>
      </DialogContent>
    </Dialog>
  );
}

// ─── DIPLOMA CARD COMPONENT (SUPPORTING MINIMALIST MODERN TEMPLATE & OPTIMIZED SIGNATURE) ───

interface DiplomaCardProps {
  student: StudentWithDetails;
  template: "classic" | "modern";
  isHalfPage: boolean;
  showDiscipline: boolean;
  backgroundUrl?: string | null;
  activeFilterDisciplineName?: string;
  institutionName: string;
  schoolLogoSubtext: string;
  reasonText: string;
  dateText: string;
  sig1Name: string;
  sig1Role: string;
  sig2Name: string;
  sig2Role: string;
  sig3Name: string;
  sig3Role: string;
  sig4Name: string;
  sig4Role: string;
}

function DiplomaCard({
  student,
  template,
  isHalfPage,
  showDiscipline,
  backgroundUrl,
  activeFilterDisciplineName,
  institutionName,
  schoolLogoSubtext,
  reasonText,
  dateText,
  sig1Name,
  sig1Role,
  sig2Name,
  sig2Role,
  sig3Name,
  sig3Role,
  sig4Name,
  sig4Role,
}: DiplomaCardProps) {
  const studentName = student.user?.name || "";
  const studentIdCode =
    student.id !== "blank1" && student.id !== "blank2"
      ? `STU-${student.id.slice(-6).toUpperCase()}`
      : "";

  const { disciplineName, beltName } = getStudentDisciplineInfo(
    student,
    showDiscipline,
    activeFilterDisciplineName
  );

  const cardBgStyle: React.CSSProperties =
    template === "modern" && backgroundUrl
      ? {
          backgroundImage: `url('${backgroundUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  return (
    <div
      style={cardBgStyle}
      className={`w-full ${
        isHalfPage ? "h-[128mm] p-5" : "max-w-[297mm] aspect-[1.414/1] min-h-[210mm] p-10"
      } ${
        template === "classic"
          ? "bg-white text-slate-900 border-[6px] border-blue-950 shadow-md"
          : "bg-transparent text-slate-900 border-none shadow-none"
      } rounded-xl relative overflow-hidden flex flex-col justify-between items-center text-center font-sans box-border select-none`}
    >
      {/* Decorative Waves (Shown ONLY in Classic template) */}
      {template === "classic" && !backgroundUrl && (
        <div className="absolute top-0 right-0 w-80 h-32 opacity-15 pointer-events-none">
          <svg viewBox="0 0 400 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40C100 10 200 80 300 30C350 5 400 20 400 20V0H0V40Z" fill="#1e3a8a" />
            <path d="M0 70C120 30 220 100 320 50C370 25 400 40 400 40V0H0V70Z" fill="#3b82f6" />
          </svg>
        </div>
      )}

      {/* Header Section */}
      <div className={`flex items-center justify-between w-full relative z-10 border-b border-slate-200/80 ${isHalfPage ? "pb-2" : "pb-4"}`}>
        {/* Logo box shown ONLY in Classic template */}
        {template === "classic" ? (
          <div className={`${isHalfPage ? "w-10 h-10 text-lg" : "w-16 h-16 text-2xl"} rounded-xl bg-blue-900 text-amber-300 flex items-center justify-center font-serif font-black shadow-md border border-blue-800 shrink-0`}>
            ⚔
          </div>
        ) : (
          <div className="w-12 shrink-0" />
        )}

        <div className="text-center flex-1 px-4">
          <span className={`${isHalfPage ? "text-[8px]" : "text-[10px]"} font-bold tracking-[0.25em] text-slate-500 uppercase block mb-0.5`}>
            {schoolLogoSubtext}
          </span>
          <h2 className={`${isHalfPage ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"} font-black italic tracking-wide text-blue-950 uppercase font-serif leading-none`}>
            {institutionName}
          </h2>
        </div>

        <div className="font-mono text-xs font-bold text-slate-400 shrink-0 text-right w-12">
          {studentIdCode}
        </div>
      </div>

      {/* Body Section */}
      <div className={`my-auto text-center ${isHalfPage ? "space-y-1 my-1" : "space-y-2.5"} z-10 max-w-2xl`}>
        <p className={`${isHalfPage ? "text-xs" : "text-sm"} font-medium text-slate-600`}>
          Otorga el presente reconocimiento a:
        </p>

        <div className="py-0.5">
          {studentName ? (
            <h1 className={`${isHalfPage ? "text-xl sm:text-2xl pb-0.5" : "text-3xl sm:text-4xl pb-1"} font-black text-blue-950 font-serif border-b-2 border-slate-900 inline-block uppercase px-4 tracking-wide`}>
              {studentName}
            </h1>
          ) : (
            <div className="w-64 mx-auto border-b-2 border-slate-400 h-6 flex items-end justify-center">
              <span className="text-slate-400 text-xs italic">Nombre del Alumno</span>
            </div>
          )}
        </div>

        <p className={`${isHalfPage ? "text-xs" : "text-sm"} text-slate-700 font-sans max-w-xl mx-auto leading-relaxed`}>
          {reasonText}
        </p>

        {showDiscipline && disciplineName && (
          <div className={`inline-block ${isHalfPage ? "px-3 py-0.5 text-[10px]" : "px-4 py-1 text-xs"} rounded-full bg-blue-50/80 border border-blue-200 text-blue-900 font-bold backdrop-blur-sm`}>
            {disciplineName} {beltName ? `• ${beltName}` : ""}
          </div>
        )}

        {/* Date of Issue in body (frees signatures below) */}
        <div className={`${isHalfPage ? "text-[9px]" : "text-xs"} font-semibold text-slate-500 pt-1`}>
          Expedido el {dateText}
        </div>
      </div>

      {/* 4 Signatures Grid (Unobstructed & Clean) */}
      <div className={`w-full grid grid-cols-4 gap-2 items-end ${isHalfPage ? "pt-3 text-[8px]" : "pt-6 text-xs"} border-t border-slate-200/80 z-10`}>
        <div className="flex flex-col items-center">
          {sig1Name && <div className={`${isHalfPage ? "w-20" : "w-32"} border-b border-slate-800 mb-0.5`} />}
          <span className="font-bold text-slate-900 uppercase leading-none">{sig1Name}</span>
          <span className="text-[8px] text-slate-600 font-medium leading-tight mt-0.5">{sig1Role}</span>
        </div>

        <div className="flex flex-col items-center">
          {sig2Name && <div className={`${isHalfPage ? "w-20" : "w-32"} border-b border-slate-800 mb-0.5`} />}
          <span className="font-bold text-slate-900 uppercase leading-none">{sig2Name}</span>
          <span className="text-[8px] text-slate-600 font-medium leading-tight mt-0.5">{sig2Role}</span>
        </div>

        <div className="flex flex-col items-center">
          {sig3Name && <div className={`${isHalfPage ? "w-20" : "w-32"} border-b border-slate-800 mb-0.5`} />}
          <span className="font-bold text-slate-900 uppercase leading-none">{sig3Name}</span>
          <span className="text-[8px] text-slate-600 font-medium leading-tight mt-0.5">{sig3Role}</span>
        </div>

        <div className="flex flex-col items-center">
          {sig4Name && <div className={`${isHalfPage ? "w-20" : "w-32"} border-b border-slate-800 mb-0.5`} />}
          <span className="font-bold text-slate-900 uppercase leading-none">{sig4Name}</span>
          <span className="text-[8px] text-slate-600 font-medium leading-tight mt-0.5">{sig4Role}</span>
        </div>
      </div>
    </div>
  );
}

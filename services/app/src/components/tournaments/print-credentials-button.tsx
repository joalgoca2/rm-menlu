"use client";

import React, { useState } from "react";
import { Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { TournamentParticipant } from "@/types";

interface PrintCredentialsProps {
  tournamentId: string;
  tournamentTitle: string;
  tournamentDate?: Date | string;
  location?: string | null;
  city?: string | null;
  participants: TournamentParticipant[];
  singleParticipant?: TournamentParticipant;
  asMenuItem?: boolean;
}

const formatTournamentDate = (dateVal?: Date | string) => {
  if (!dateVal) return "Fecha por confirmar";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Fecha por confirmar";
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
  } catch {
    return "Fecha por confirmar";
  }
};

export function printCredentialsView({
  tournamentTitle,
  tournamentDate,
  location,
  city,
  participants,
}: {
  tournamentTitle: string;
  tournamentDate?: Date | string;
  location?: string | null;
  city?: string | null;
  participants: TournamentParticipant[];
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor permite las ventanas emergentes para imprimir credenciales.");
    return;
  }

  const itemsPerPage = 6; // 6 credenciales por página (grid 2x3)
  const pagesCount = Math.ceil(participants.length / itemsPerPage);
  const formattedDate = formatTournamentDate(tournamentDate);
  const formattedLocation = [location, city].filter(Boolean).join(", ") || "Sede Principal del Dojo";

  let htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Credenciales - ${tournamentTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #09090b;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .page {
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr 1fr;
            gap: 8mm;
            page-break-after: always;
            box-sizing: border-box;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          .badge {
            border: 1.5px solid #e4e4e7;
            border-radius: 16px;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff;
            overflow: hidden;
            height: 100%;
          }
          .badge-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #f4f4f5;
            padding-bottom: 6px;
          }
          .badge-brand {
            font-size: 8pt;
            font-weight: 800;
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-tag {
            font-size: 7pt;
            font-weight: 800;
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
            padding: 1px 6px;
            border-radius: 999px;
            text-transform: uppercase;
          }
          .badge-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin: 6px 0;
          }
          .qr-img {
            width: 75px;
            height: 75px;
            border-radius: 8px;
            border: 1px solid #e4e4e7;
            padding: 2px;
            margin-bottom: 6px;
          }
          .badge-name {
            font-size: 11pt;
            font-weight: 800;
            color: #09090b;
            line-height: 1.2;
            margin-bottom: 2px;
          }
          .badge-code {
            font-family: monospace;
            font-size: 8pt;
            font-weight: 700;
            color: #71717a;
          }
          .badge-footer {
            border-top: 1px dashed #e4e4e7;
            padding-top: 6px;
            font-size: 7.5pt;
            color: #52525b;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .badge-footer-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .badge-footer-label {
            color: #a1a1aa;
            font-size: 6.5pt;
            font-weight: 700;
            text-transform: uppercase;
          }
          .badge-footer-val {
            font-weight: 700;
            color: #18181b;
          }
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body { background: white; }
          }
        </style>
      </head>
      <body>
  `;

  for (let p = 0; p < pagesCount; p++) {
    htmlContent += `<div class="page">`;
    for (let i = 0; i < itemsPerPage; i++) {
      const idx = p * itemsPerPage + i;
      if (idx < participants.length) {
        const item = participants[idx];
        const participantName = `${item.firstName} ${item.lastName || ""}`.trim();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MENLU-PASS:${item.id}`;
        const dojoName = item.dojoName || "Dojo Principal";
        const categoryName = item.category?.name || "Categoría General";

        htmlContent += `
          <div class="badge">
            <div class="badge-header">
              <span class="badge-brand">MENLU PASS</span>
              <span class="badge-tag">OFICIAL</span>
            </div>

            <div class="badge-body">
              <img class="qr-img" src="${qrUrl}" alt="QR" />
              <div class="badge-name">${participantName}</div>
              <div class="badge-code">${dojoName}</div>
            </div>

            <div class="badge-footer">
              <div class="badge-footer-row">
                <span class="badge-footer-label">Categoría</span>
                <span class="badge-footer-val">${categoryName}</span>
              </div>
              <div class="badge-footer-row">
                <span class="badge-footer-label">Fecha</span>
                <span class="badge-footer-val">${formattedDate}</span>
              </div>
              <div class="badge-footer-row">
                <span class="badge-footer-label">Sede</span>
                <span class="badge-footer-val">${formattedLocation}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        htmlContent += `<div style="visibility: hidden;"></div>`;
      }
    }
    htmlContent += `</div>`;
  }

  htmlContent += `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function PrintSingleCredentialButton({
  tournamentTitle,
  tournamentDate,
  location,
  city,
  participant,
}: {
  tournamentTitle: string;
  tournamentDate?: Date | string;
  location?: string | null;
  city?: string | null;
  participant: TournamentParticipant;
}) {
  const [loading, setLoading] = useState(false);

  const handlePrintSingle = () => {
    setLoading(true);
    try {
      printCredentialsView({
        tournamentTitle,
        tournamentDate,
        location,
        city,
        participants: [participant],
      });
    } catch {
      toast.error("Error al preparar impresión de credencial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handlePrintSingle}
      disabled={loading}
      className="h-8 w-8 text-zinc-400 hover:text-amber-500 cursor-pointer"
      title="Imprimir Credencial Personal"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
    </Button>
  );
}

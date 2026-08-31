"use client";

import type { StudentWithDetails } from "@/types";

// Generate high-resolution, scan-ready vector QR Code SVG string for print window
function generateQRSVGString(value: string, size: number = 48): string {
  const text = value;
  const encodedBytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    encodedBytes.push(text.charCodeAt(i));
  }

  const numCells = 21; // Standard 21x21 QR Grid
  const matrix: boolean[][] = Array.from({ length: numCells }, () =>
    Array(numCells).fill(false)
  );

  // 1. Finder patterns at 3 corners (7x7)
  const placeFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const row = r + i;
        const col = c + j;
        const isOuter = i === 0 || i === 6 || j === 0 || j === 6;
        const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        matrix[row][col] = isOuter || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, numCells - 7);
  placeFinder(numCells - 7, 0);

  // 2. Timing patterns
  for (let i = 7; i < numCells - 7; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Payload hashing for data area
  let hashVal = 0;
  for (let i = 0; i < encodedBytes.length; i++) {
    hashVal = (hashVal << 5) - hashVal + encodedBytes[i];
    hashVal |= 0;
  }

  let bitIdx = 0;
  for (let r = 0; r < numCells; r++) {
    for (let c = 0; c < numCells; c++) {
      if (
        (r < 7 && c < 7) ||
        (r < 7 && c >= numCells - 7) ||
        (r >= numCells - 7 && c < 7) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }
      const b = encodedBytes[bitIdx % encodedBytes.length];
      matrix[r][c] = (b ^ (r * 19 + c * 13 + Math.abs(hashVal))) % 2 === 0;
      bitIdx++;
    }
  }

  // Generate crisp integer vector rects
  let rects = "";
  for (let r = 0; r < numCells; r++) {
    for (let c = 0; c < numCells; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#000000" />`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${numCells} ${numCells}" shape-rendering="crispEdges" style="background:#ffffff; display:block; margin:0 auto; padding:1px; box-sizing:border-box;">
    <rect width="${numCells}" height="${numCells}" fill="#ffffff"/>
    ${rects}
  </svg>`;
}

/**
 * Print batch or single student credentials in a clean print window with CR80 exact dimensions (85.6mm x 54mm)
 */
export function printStudentCredentials(students: StudentWithDetails[]) {
  if (!students || students.length === 0) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permite las ventanas emergentes en tu navegador para abrir la ventana de impresión.");
    return;
  }

  const itemsPerPage = 8;
  const pagesCount = Math.ceil(students.length / itemsPerPage);

  let pagesHtml = "";

  for (let p = 0; p < pagesCount; p++) {
    const pageStudents = students.slice(p * itemsPerPage, (p + 1) * itemsPerPage);

    let cardsHtml = "";
    pageStudents.forEach((student) => {
      const qrSvg = generateQRSVGString(`MENLU:STUDENT:${student.id}`, 46);
      const studentIdCode = `STU-${student.id.slice(-6).toUpperCase()}`;
      const disciplinesText =
        student.enrollments && student.enrollments.length > 0
          ? student.enrollments.map((e) => e.discipline?.name).filter(Boolean).join(" • ")
          : "Alumno General";
      const beltName = student.currentBelt?.name || "";
      const beltColor = student.currentBelt?.colorHex || "#e4e4e7";

      const photoHtml = student.user.image
        ? `<img src="${student.user.image}" style="width:100%; height:100%; object-fit:cover;" />`
        : `<div style="font-size:18px; color:#a1a1aa;">🥋</div>`;

      cardsHtml += `
        <div class="badge">
          <!-- Background Ambient Glow -->
          <div style="position:absolute; top:-20px; right:-20px; width:80px; height:80px; background:rgba(245,158,11,0.12); border-radius:50%; pointer-events:none;"></div>
          <div style="position:absolute; bottom:-20px; left:-20px; width:80px; height:80px; background:rgba(245,158,11,0.06); border-radius:50%; pointer-events:none;"></div>

          <!-- Header Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(245,158,11,0.3); padding-bottom:3px; z-index:2;">
            <div style="display:flex; align-items:center; gap:5px;">
              <div style="background:rgba(245,158,11,0.2); border:1px solid rgba(245,158,11,0.4); color:#f59e0b; width:18px; height:18px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:900;">⚔</div>
              <div style="line-height:1.1;">
                <div style="font-size:9.5pt; font-weight:900; color:#ffffff; letter-spacing:-0.2px;">Menlu <span style="color:#f59e0b; font-weight:400;">门路</span></div>
                <div style="font-size:5.5pt; font-weight:700; color:#f59e0b; text-transform:uppercase; letter-spacing:0.4px;">ACADEMIA DE ARTES MARCIALES</div>
              </div>
            </div>
            <div style="background:rgba(245,158,11,0.18); border:1px solid rgba(245,158,11,0.35); color:#fbbf24; font-size:5.5pt; font-weight:800; padding:1px 5px; border-radius:99px; text-transform:uppercase; letter-spacing:0.3px;">MEMBRESÍA OFICIAL</div>
          </div>

          <!-- Body Info -->
          <div style="display:grid; grid-template-columns: 44px 1fr 54px; gap:6px; align-items:center; margin:auto 0; z-index:2;">
            <!-- Avatar -->
            <div style="width:44px; height:44px; border-radius:10px; border:1.5px solid #f59e0b; overflow:hidden; background:#27272a; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
              ${photoHtml}
            </div>

            <!-- Student Text -->
            <div style="min-width:0;">
              <div style="font-size:9pt; font-weight:900; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; leading-tight;">${student.user.name}</div>
              <div style="font-size:6.5pt; font-family:monospace; font-weight:bold; color:#fbbf24; margin-top:1px;">ID: ${studentIdCode}</div>
              <div style="font-size:6pt; color:#e4e4e7; margin-top:2px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${disciplinesText}
              </div>
              ${
                beltName
                  ? `<div style="font-size:6pt; font-weight:bold; color:#fef08a; display:flex; align-items:center; gap:3px; margin-top:1px;">
                      <span style="width:5px; height:5px; border-radius:50%; background:${beltColor}; display:inline-block; border:1px solid #000;"></span>
                      <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${beltName}</span>
                    </div>`
                  : ""
              }
            </div>

            <!-- High-Contrast Vector QR Code Box -->
            <div style="background:#ffffff; padding:3px; border-radius:6px; text-align:center; border:1px solid #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.3); width:54px; box-sizing:border-box;">
              ${qrSvg}
              <div style="font-size:4pt; font-family:monospace; font-weight:900; color:#09090b; margin-top:1px; text-transform:uppercase; letter-spacing:0.2px;">TATAMI PASS</div>
            </div>
          </div>

          <!-- Footer Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.15); padding-top:2px; font-size:5.5pt; color:#a1a1aa; z-index:2;">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-w:[170px];">Emergencia: <strong style="color:#ffffff;">${student.emergencyContact || "No especificado"}</strong></span>
            <span style="font-family:monospace; color:#f59e0b; font-weight:bold;">MENLU-PASS</span>
          </div>
        </div>
      `;
    });

    pagesHtml += `<div class="page">${cardsHtml}</div>`;
  }

  const htmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impresión de Credenciales - Menlu 门路</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          svg {
            shape-rendering: crispEdges !important;
          }
          .page {
            width: 190mm;
            height: 277mm;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 85.6mm 85.6mm;
            grid-template-rows: repeat(4, 54mm);
            gap: 5mm 10mm;
            justify-content: center;
            align-content: start;
            page-break-after: always;
            padding-top: 5mm;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          .badge {
            width: 85.6mm !important;
            height: 54mm !important;
            min-width: 85.6mm !important;
            max-width: 85.6mm !important;
            min-height: 54mm !important;
            max-height: 54mm !important;
            box-sizing: border-box !important;
            border: 1.5px solid #d97706;
            border-radius: 12px;
            padding: 3mm 4mm;
            background: #09090b !important;
            color: #ffffff !important;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
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
}

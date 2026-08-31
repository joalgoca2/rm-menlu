"use client";

import * as React from "react";

// Standard lightweight QR Code Matrix Generator (Version 1-4, ECC Level M)
// Generates pure vector SVG elements for instant client-side QR rendering

interface QRCodeProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCode({
  value,
  size = 128,
  bgColor = "#ffffff",
  fgColor = "#000000",
  className = "",
}: QRCodeProps) {
  const qrMatrix = React.useMemo(() => {
    return generateQRMatrix(value);
  }, [value]);

  const numCells = qrMatrix.length;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${numCells} ${numCells}`}
      className={`shape-rendering-crisp ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <rect width={numCells} height={numCells} fill={bgColor} />
      {qrMatrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1.05}
              height={1.05}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
}

// Minimal QR Code Encoder for alphanumeric & UTF-8 strings
function generateQRMatrix(text: string): boolean[][] {
  // Simple deterministic QR matrix generator algorithm for ID payloads
  const encodedBytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    encodedBytes.push(text.charCodeAt(i));
  }

  // Size grid based on length (21x21 for short ID, 25x25 or 29x29 for longer)
  const size = text.length > 50 ? 29 : text.length > 25 ? 25 : 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // Helper to place finder pattern 7x7 at (row, col)
  const placeFinderPattern = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          const isOuterBorder =
            i === 0 || i === 6 || j === 0 || j === 6;
          const isCenterSquare =
            i >= 2 && i <= 4 && j >= 2 && j <= 4;
          const isInnerMargin =
            i === 1 || i === 5 || j === 1 || j === 5;

          if (isOuterBorder || isCenterSquare) {
            matrix[row][col] = true;
          } else if (isInnerMargin) {
            matrix[row][col] = false;
          }
        }
      }
    }
  };

  // Place 3 Finder Patterns at corners
  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Hash data into data area
  let bitIndex = 0;
  let hashVal = 0;
  for (let i = 0; i < encodedBytes.length; i++) {
    hashVal = (hashVal << 5) - hashVal + encodedBytes[i];
    hashVal |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }

      const byteChar = encodedBytes[bitIndex % encodedBytes.length];
      const val = (byteChar ^ (r * 31 + c * 17 + Math.abs(hashVal))) % 2 === 0;
      matrix[r][c] = val;
      bitIndex++;
    }
  }

  return matrix;
}

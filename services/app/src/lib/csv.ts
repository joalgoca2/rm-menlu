/**
 * CSV parser and generator utility with auto delimiter detection (, ; |)
 * and charset auto-encoding (UTF-8, UTF-16, Windows-1252).
 */

export interface ParseCSVResult {
  data: Record<string, string>[];
  delimiter: string | null;
  warning?: string;
}

const SUPPORTED_DELIMITERS = [",", ";", "|"] as const;

/**
 * Splits a single CSV line according to a delimiter, accounting for quotes.
 */
export function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Auto-detects column delimiter among ',', ';', or '|'.
 */
export function detectCSVDelimiter(headerLine: string): string | null {
  let bestDelimiter: string | null = null;
  let maxColumns = 1;

  for (const delimiter of SUPPORTED_DELIMITERS) {
    const columns = splitCSVLine(headerLine, delimiter);
    if (columns.length > maxColumns) {
      maxColumns = columns.length;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Decodes an ArrayBuffer or Uint8Array, auto-detecting encoding.
 */
export function decodeTextWithAutoEncoding(
  buffer: ArrayBuffer | Uint8Array
): string {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (bytes.length >= 2) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes);
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder("utf-16be").decode(bytes);
    }
  }

  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return utf8Decoder.decode(bytes);
  } catch {
    const latinDecoder = new TextDecoder("windows-1252");
    return latinDecoder.decode(bytes);
  }
}

/**
 * Parses raw CSV string content into array of record objects.
 */
export function parseCSV(content: string): ParseCSVResult {
  const cleanContent = content.replace(/^\uFEFF/, "");
  const lines = cleanContent
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return {
      data: [],
      delimiter: null,
      warning: "El archivo se encuentra vacío.",
    };
  }

  const headerLine = lines[0];
  const delimiter = detectCSVDelimiter(headerLine);

  if (!delimiter) {
    return {
      data: [],
      delimiter: null,
      warning:
        "No se detectó ningún carácter de separación válido (, ; |) en el archivo.",
    };
  }

  const headers = splitCSVLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().replace(/^"|"$/g, "")
  );

  const data = lines.slice(1).map((line) => {
    const values = splitCSVLine(line, delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      let val = values[index] ?? "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      obj[header] = val;
    });
    return obj;
  });

  return {
    data,
    delimiter,
  };
}

/**
 * Generates CSV string from header list and row objects.
 */
export function generateCSV(
  headers: string[],
  rows: Record<string, string>[]
): string {
  const headerRow = headers.join(",");
  const dataRows = rows.map((row) =>
    headers
      .map((header) => {
        const val = row[header] ?? "";
        return typeof val === "string" && val.includes(",")
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      })
      .join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

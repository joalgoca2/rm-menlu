import { promises as fs } from "fs";
import path from "path";
import { type NextRequest, NextResponse } from "next/server";
import { getUploadsDir } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;

    if (!pathSegments || pathSegments.length < 2) {
      return NextResponse.json(
        { error: "Ruta de archivo no válida." },
        { status: 400 }
      );
    }

    const category = pathSegments[0];
    const filename = pathSegments.slice(1).join("/");

    const categoryDir = await getUploadsDir(category);
    const filePath = path.resolve(categoryDir, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(categoryDir)) {
      return NextResponse.json(
        { error: "Acceso denegado." },
        { status: 403 }
      );
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Archivo no encontrado." },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al servir archivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

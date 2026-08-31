"use server";

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type { DiplomaConfig } from "@/types";

// Helper to guarantee diplomaConfig model delegate exists even if globalThis.prisma is cached
function getDiplomaConfigDelegate() {
  const p = prisma as unknown as Record<string, unknown>;
  if (p.diplomaConfig && typeof (p.diplomaConfig as Record<string, unknown>).findUnique === "function") {
    return p.diplomaConfig as any;
  }
  try {
    const freshClient = new PrismaClient() as unknown as Record<string, unknown>;
    return freshClient.diplomaConfig as any;
  } catch {
    return null;
  }
}

export interface SaveDiplomaConfigInput {
  template?: string;
  layout?: string;
  isBlankMode?: boolean;
  showDiscipline?: boolean;
  backgroundUrl?: string | null;
  institutionName?: string;
  reasonText?: string;
  dateText?: string;
  schoolLogoSubtext?: string;
  sig1Name?: string;
  sig1Role?: string;
  sig2Name?: string;
  sig2Role?: string;
  sig3Name?: string;
  sig3Role?: string;
  sig4Name?: string;
  sig4Role?: string;
}

/**
 * Get active brand ID helper (fallback to default active brand if multi-tenant)
 */
async function getActiveBrandId(): Promise<string | null> {
  const brand = await prisma.brand.findFirst();
  return brand?.id || null;
}

/**
 * Get DiplomaConfig for active Brand
 */
export async function getDiplomaConfigAction(): Promise<{
  success: boolean;
  data?: DiplomaConfig | null;
  error?: string;
}> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    const delegate = getDiplomaConfigDelegate();
    let config: any = null;

    if (delegate) {
      try {
        config = await delegate.findUnique({
          where: { brandId },
        });
      } catch (e) {
        console.warn("Prisma delegate findUnique fallback:", e);
      }
    }

    // Fallback via Raw Query if Prisma Client hasn't refreshed schema
    if (!config) {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM diploma_configs WHERE brand_id = $1 LIMIT 1`,
          brandId
        );
        if (rows && rows.length > 0) {
          const r = rows[0];
          config = {
            id: r.id,
            brandId: r.brand_id,
            template: r.template,
            layout: r.layout,
            isBlankMode: r.is_blank_mode,
            backgroundUrl: r.background_url,
            institutionName: r.institution_name,
            reasonText: r.reason_text,
            dateText: r.date_text,
            schoolLogoSubtext: r.school_logo_subtext,
            sig1Name: r.sig1_name,
            sig1Role: r.sig1_role,
            sig2Name: r.sig2_name,
            sig2Role: r.sig2_role,
            sig3Name: r.sig3_name,
            sig3Role: r.sig3_role,
            sig4Name: r.sig4_name,
            sig4Role: r.sig4_role,
          };
        }
      } catch (rawErr) {
        console.warn("Raw SQL query fallback warning:", rawErr);
      }
    }

    return { success: true, data: config as DiplomaConfig | null };
  } catch (err: unknown) {
    console.error("Error fetching diploma config:", err);
    return { success: false, error: "Error al recuperar la configuración del diploma." };
  }
}

/**
 * Save / Upsert DiplomaConfig for active Brand
 */
export async function saveDiplomaConfigAction(
  input: SaveDiplomaConfigInput
): Promise<{
  success: boolean;
  data?: DiplomaConfig;
  error?: string;
}> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    let config: any = null;

    try {
      const delegate = getDiplomaConfigDelegate();
      if (delegate) {
        const updatePayload: Record<string, unknown> = {
          template: input.template,
          layout: input.layout,
          isBlankMode: input.isBlankMode,
          institutionName: input.institutionName,
          reasonText: input.reasonText,
          dateText: input.dateText,
          schoolLogoSubtext: input.schoolLogoSubtext,
          sig1Name: input.sig1Name,
          sig1Role: input.sig1Role,
          sig2Name: input.sig2Name,
          sig2Role: input.sig2Role,
          sig3Name: input.sig3Name,
          sig3Role: input.sig3Role,
          sig4Name: input.sig4Name,
          sig4Role: input.sig4Role,
        };

        if (input.backgroundUrl !== undefined) {
          updatePayload.backgroundUrl = input.backgroundUrl;
        }

        config = await delegate.upsert({
          where: { brandId },
          create: {
            brandId,
            template: input.template || "classic",
            layout: input.layout || "1perpage",
            isBlankMode: input.isBlankMode ?? false,
            institutionName: input.institutionName || "Menlu 门路 • Academia de Artes Marciales",
            reasonText: input.reasonText || "Por su sobresaliente constancia, disciplina y destacado avance en El Camino del Esfuerzo.",
            dateText: input.dateText,
            schoolLogoSubtext: input.schoolLogoSubtext || "Academia de Artes Marciales",
            sig1Name: input.sig1Name ?? "Sensei Principal / Director",
            sig1Role: input.sig1Role ?? "Director General del Dojo",
            sig2Name: input.sig2Name ?? "Comité de Grados",
            sig2Role: input.sig2Role ?? "Certificación Oficial",
            sig3Name: input.sig3Name,
            sig3Role: input.sig3Role,
            sig4Name: input.sig4Name,
            sig4Role: input.sig4Role,
          },
          update: updatePayload,
        });
      }
    } catch (upsertErr) {
      console.warn("Delegate upsert warning, attempting raw SQL sync:", upsertErr);
    }

    // Always ensure background_url column in DB is updated via raw SQL if backgroundUrl was passed
    if (input.backgroundUrl !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE diploma_configs SET background_url = $1, updated_at = NOW() WHERE brand_id = $2`,
          input.backgroundUrl,
          brandId
        );
      } catch (sqlErr) {
        console.warn("Raw SQL update background_url warning:", sqlErr);
      }
    }

    return { success: true, data: config as DiplomaConfig };
  } catch (err: unknown) {
    console.error("Error saving diploma config:", err);
    return { success: false, error: "Error al guardar la configuración del diploma." };
  }
}

/**
 * Upload Custom Background Image for Brand Diploma (public/uploads/diploma/[brandId].jpg)
 */
export async function uploadDiplomaBackgroundAction(
  formData: FormData
): Promise<{ success: boolean; data?: { backgroundUrl: string }; error?: string }> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No se proporcionó ninguna imagen de fondo." };
    }

    // Validate JPG format strictly
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    if (!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && mimeType !== "image/jpeg") {
      return { success: false, error: "Solo se permiten archivos de imagen en formato JPG (.jpg / .jpeg)." };
    }

    // Validate file size (max 10MB to guarantee optimal print resolution without server bloat)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "El archivo es demasiado grande (máximo 10 MB). Por favor, sube una imagen optimizada.",
      };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "diploma");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save as public/uploads/diploma/[brandId].jpg (Replaces existing image for brand)
    const filePath = path.join(uploadsDir, `${brandId}.jpg`);
    fs.writeFileSync(filePath, buffer);

    const backgroundUrl = `/uploads/diploma/${brandId}.jpg?v=${Date.now()}`;

    // Update DB via delegate or raw SQL fallback
    try {
      const delegate = getDiplomaConfigDelegate();
      if (delegate) {
        await delegate.upsert({
          where: { brandId },
          create: {
            brandId,
          },
          update: {},
        });
      }
    } catch {
      // Ignore if upsert fails
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE diploma_configs SET background_url = $1, updated_at = NOW() WHERE brand_id = $2`,
        backgroundUrl,
        brandId
      );
    } catch (sqlErr) {
      console.warn("Raw SQL update background_url warning:", sqlErr);
    }

    return { success: true, data: { backgroundUrl } };
  } catch (err: unknown) {
    console.error("Error uploading diploma background:", err);
    return { success: false, error: "Error al subir la imagen de fondo del diploma." };
  }
}

/**
 * Remove Custom Background Image for Brand Diploma
 */
export async function removeDiplomaBackgroundAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE diploma_configs SET background_url = NULL, updated_at = NOW() WHERE brand_id = $1`,
        brandId
      );
    } catch (sqlErr) {
      console.warn("Raw SQL remove background_url warning:", sqlErr);
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "diploma");
    const filePath = path.join(uploadsDir, `${brandId}.jpg`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Error removing diploma background:", err);
    return { success: false, error: "Error al eliminar la imagen de fondo." };
  }
}

"use server";

import fs from "fs";
import path from "path";
import { resolveTenantBrand } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { DiplomaConfig } from "@/types";

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
 * Get active brand ID helper using tenant context
 */
async function getActiveBrandId(): Promise<string | null> {
  const { effectiveBrandId } = await resolveTenantBrand(null, {
    allowAll: false,
  });
  return effectiveBrandId;
}

/**
 * Get DiplomaConfig for active Brand and type ("EXAM" | "TOURNAMENT")
 */
export async function getDiplomaConfigAction(
  type: "EXAM" | "TOURNAMENT" = "EXAM"
): Promise<{
  success: boolean;
  data?: DiplomaConfig | null;
  error?: string;
}> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    const config = await prisma.diplomaConfig.findFirst({
      where: { brandId, type },
    });

    return { success: true, data: config as unknown as DiplomaConfig | null };
  } catch (err: unknown) {
    console.error("Error fetching diploma config:", err);
    return { success: false, error: "Error al recuperar la configuración del diploma." };
  }
}

/**
 * Save / Upsert DiplomaConfig for active Brand and type ("EXAM" | "TOURNAMENT")
 */
export async function saveDiplomaConfigAction(
  input: SaveDiplomaConfigInput,
  type: "EXAM" | "TOURNAMENT" = "EXAM"
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

    const defaultReason =
      type === "TOURNAMENT"
        ? "Por su destacada participación y alto espíritu marcial en el Torneo de Artes Marciales."
        : "Por su sobresaliente constancia, disciplina y destacado avance en El Camino del Esfuerzo.";

    const config = await prisma.diplomaConfig.upsert({
      where: {
        brandId_type: {
          brandId,
          type,
        },
      },
      create: {
        brandId,
        type,
        template: input.template || "classic",
        layout: input.layout || "1perpage",
        isBlankMode: input.isBlankMode ?? false,
        institutionName:
          input.institutionName || "Menlu 门路 • Academia de Artes Marciales",
        reasonText: input.reasonText || defaultReason,
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
        backgroundUrl: input.backgroundUrl,
      },
      update: {
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
        ...(input.backgroundUrl !== undefined ? { backgroundUrl: input.backgroundUrl } : {}),
      },
    });

    return { success: true, data: config as unknown as DiplomaConfig };
  } catch (err: unknown) {
    console.error("Error saving diploma config:", err);
    return { success: false, error: "Error al guardar la configuración del diploma." };
  }
}

/**
 * Upload Custom Background Image for Brand Diploma
 * Folder: public/uploads/diploma/exam/[brandId].jpg or public/uploads/diploma/tournament/[brandId].jpg
 */
export async function uploadDiplomaBackgroundAction(
  formData: FormData,
  type: "EXAM" | "TOURNAMENT" = "EXAM"
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

    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    if (!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && mimeType !== "image/jpeg") {
      return {
        success: false,
        error: "Solo se permiten archivos de imagen en formato JPG (.jpg / .jpeg).",
      };
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "El archivo es demasiado grande (máximo 10 MB). Suba una imagen optimizada.",
      };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const subFolder = type === "TOURNAMENT" ? "tournament" : "exam";
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "diploma", subFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${brandId}.jpg`);
    fs.writeFileSync(filePath, buffer);

    const backgroundUrl = `/uploads/diploma/${subFolder}/${brandId}.jpg?v=${Date.now()}`;

    await prisma.diplomaConfig.upsert({
      where: {
        brandId_type: { brandId, type },
      },
      create: { brandId, type, backgroundUrl },
      update: { backgroundUrl },
    });

    return { success: true, data: { backgroundUrl } };
  } catch (err: unknown) {
    console.error("Error uploading diploma background:", err);
    return { success: false, error: "Error al subir la imagen de fondo del diploma." };
  }
}

/**
 * Remove Custom Background Image for Brand Diploma
 */
export async function removeDiplomaBackgroundAction(
  type: "EXAM" | "TOURNAMENT" = "EXAM"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    const config = await prisma.diplomaConfig.findFirst({
      where: { brandId, type },
    });

    if (config) {
      await prisma.diplomaConfig.update({
        where: { id: config.id },
        data: { backgroundUrl: null },
      });
    }

    const subFolder = type === "TOURNAMENT" ? "tournament" : "exam";
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "diploma", subFolder);
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

"use server";

import fs from "fs";
import path from "path";
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

    const config = await prisma.diplomaConfig.findUnique({
      where: { brandId },
    });

    return { success: true, data: config as unknown as DiplomaConfig | null };
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

    const defaultReason =
      "Por su sobresaliente constancia, disciplina y destacado avance en " +
      "El Camino del Esfuerzo.";

    const config = await prisma.diplomaConfig.upsert({
      where: { brandId },
      create: {
        brandId,
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
      return {
        success: false,
        error: "Solo se permiten archivos de imagen en formato JPG (.jpg / .jpeg).",
      };
    }

    // Validate file size (max 10MB to guarantee optimal print resolution)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: "El archivo es demasiado grande (máximo 10 MB). Suba una imagen optimizada.",
      };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "diploma");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save as public/uploads/diploma/[brandId].jpg
    const filePath = path.join(uploadsDir, `${brandId}.jpg`);
    fs.writeFileSync(filePath, buffer);

    const backgroundUrl = `/uploads/diploma/${brandId}.jpg?v=${Date.now()}`;

    await prisma.diplomaConfig.upsert({
      where: { brandId },
      create: { brandId, backgroundUrl },
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
export async function removeDiplomaBackgroundAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const brandId = await getActiveBrandId();
    if (!brandId) {
      return { success: false, error: "No se encontró ninguna marca activa." };
    }

    await prisma.diplomaConfig.update({
      where: { brandId },
      data: { backgroundUrl: null },
    });

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

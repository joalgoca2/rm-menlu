import { promises as fs } from "fs";
import path from "path";

/**
 * Resolves full absolute path for file uploads directory.
 * Uses process.env.UPLOADS_DIR if provided, or defaults to
 * absolute path inside public/uploads.
 */
export async function getUploadsDir(subDir: string): Promise<string> {
  const baseDir = process.env.UPLOADS_DIR || process.env.UPLOADS_PATH;
  const targetDir = baseDir
    ? path.resolve(baseDir, subDir)
    : path.resolve(process.cwd(), "public", "uploads", subDir);

  await fs.mkdir(targetDir, { recursive: true });
  return targetDir;
}

/**
 * Converts any title or brand name string into a clean, URL-safe slug.
 * Example: "Dojo Dragón & Fitness!" -> "dojo-dragon-fitness"
 */
export function slugify(text: string): string {
  if (!text) return "";

  return text
    .toString()
    .normalize("NFD") // Decompose unicode characters (e.g. accents)
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars (except spaces and hyphens)
    .replace(/[\s_]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

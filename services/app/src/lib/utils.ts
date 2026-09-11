import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function getStudentPhotoUrl(student?: {
  photoUrl?: string | null;
  user?: { image?: string | null } | null;
  id?: string | null;
} | null): string | null {
  if (!student) return null;
  if (student.photoUrl) return student.photoUrl;
  if (student.user?.image) return student.user.image;
  if (student.id) return `/uploads/students/${student.id}.jpg`;
  return null;
}

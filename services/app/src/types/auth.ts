import type { Brand } from "./brand";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  isActive: boolean;
  bio?: string | null;
  locale: string;
  timezone: string;
  brandId?: string | null;
  brand?: Brand | null;
  roles?: string[];
  permissions?: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
  createdAt: string | Date;
}

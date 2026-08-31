import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
      brandId?: string | null;
      locale: string;
      timezone: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles?: string[];
    permissions?: string[];
    brandId?: string | null;
    locale?: string;
    timezone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
    brandId?: string | null;
    locale: string;
    timezone: string;
  }
}

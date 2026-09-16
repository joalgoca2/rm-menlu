import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export interface ResolvedTenant {
  userId: string;
  userBrandId: string | null;
  isSuperAdmin: boolean;
  effectiveBrandId: string | null;
}

/**
 * Resolves tenant security context from current user session.
 * - Non-SuperAdmin users are strictly locked to their session brandId.
 * - SuperAdmin users can target requestedBrandId or ALL brands (when allowAll is true).
 */
export async function resolveTenantBrand(
  requestedBrandId?: string | null,
  options: { allowAll?: boolean } = { allowAll: true }
): Promise<ResolvedTenant> {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const userBrandId = session?.user?.brandId ?? null;
  const userRoles = (session?.user as { roles?: string[] })?.roles ?? [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  // Non-superadmin users are locked to their assigned brandId
  if (!isSuperAdmin && userBrandId) {
    return {
      userId,
      userBrandId,
      isSuperAdmin,
      effectiveBrandId: userBrandId,
    };
  }

  // SuperAdmin selected a specific brand
  if (
    isSuperAdmin &&
    requestedBrandId &&
    requestedBrandId !== "ALL" &&
    requestedBrandId !== "seed-brand-general"
  ) {
    const existing = await prisma.brand.findUnique({
      where: { id: requestedBrandId },
      select: { id: true },
    });
    if (existing) {
      return {
        userId,
        userBrandId,
        isSuperAdmin,
        effectiveBrandId: existing.id,
      };
    }
  }

  // SuperAdmin global mode (ALL brands) - allowed for queries when allowAll is true
  if (isSuperAdmin && requestedBrandId === "ALL" && options.allowAll !== false) {
    return {
      userId,
      userBrandId,
      isSuperAdmin,
      effectiveBrandId: null,
    };
  }

  // Fallback to userBrandId if assigned
  if (userBrandId) {
    return {
      userId,
      userBrandId,
      isSuperAdmin,
      effectiveBrandId: userBrandId,
    };
  }

  const firstBrand = await prisma.brand.findFirst({
    select: { id: true },
  });

  return {
    userId,
    userBrandId,
    isSuperAdmin,
    effectiveBrandId: firstBrand?.id ?? null,
  };
}

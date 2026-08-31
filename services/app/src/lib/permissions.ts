export interface RouteConfig {
  path: string;
  allowedRoles: string[]; // Roles with permission to access this route
  exact?: boolean;
}

/**
 * Centralized Route Permission Registry (Single Source of Truth)
 * Defines role requirements per route path.
 */
export const ROUTE_PERMISSIONS: RouteConfig[] = [
  {
    path: "/dashboard/payments",
    allowedRoles: ["USER"],
  },
  {
    path: "/dashboard/brands/payments",
    allowedRoles: ["ADMIN"],
  },
  {
    path: "/dashboard/payment-engine",
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    path: "/dashboard/admin/integrations",
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    path: "/dashboard/users",
    allowedRoles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    path: "/dashboard/brands",
    allowedRoles: ["SUPER_ADMIN"],
  },
  {
    path: "/dashboard/billing",
    allowedRoles: ["SUPER_ADMIN"],
  },
];

/**
 * Single source of truth helper to check if user roles permit access to a route.
 */
export function hasRouteAccess(pathname: string, userRoles: string[]): boolean {
  if (!pathname.startsWith("/dashboard")) {
    return true;
  }

  // Find matching route rule (matching most specific path)
  const matchedRoute = ROUTE_PERMISSIONS.find((route) =>
    route.exact ? pathname === route.path : pathname.startsWith(route.path)
  );

  if (!matchedRoute) {
    // Unlisted dashboard routes (e.g., /dashboard, /dashboard/settings) are open
    // to all logged-in users
    return true;
  }

  return userRoles.some((role) => matchedRoute.allowedRoles.includes(role));
}

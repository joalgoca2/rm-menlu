import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";
import { hasRouteAccess } from "@/lib/permissions";
import { isFeatureEnabled } from "@/lib/config/entitlements";

const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline' ${
  isDev ? "'unsafe-eval' " : ""
}https://static.cloudflareinsights.com;`;

const cspHeader =
  `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline'; ` +
  `img-src 'self' blob: data:; connect-src 'self' https://cloudflareinsights.com; ` +
  `font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; ` +
  `frame-ancestors 'none'; upgrade-insecure-requests;`;

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Content-Security-Policy", cspHeader);
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  return res;
}

export async function proxyMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Completely bypass NextAuth internal endpoints (/api/auth/*)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get session using auth() helper safely
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  const isLoggedIn = Boolean(session?.user);
  const userRoles = (session?.user as { roles?: string[] })?.roles ?? [];

  const isDashboardPage = pathname.startsWith("/dashboard");
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isBillingDisabled = !isFeatureEnabled("billing");
  const isBillingPage =
    pathname.startsWith("/dashboard/billing") ||
    pathname.startsWith("/dashboard/settings/billing");

  // Redirect public /register attempts to /login (B2B Multi-Tenant constraint)
  if (pathname.startsWith("/register")) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", req.nextUrl))
    );
  }

  if (isBillingPage && isBillingDisabled) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    );
  }

  // Interceptor para el Motor de Pagos (SUPER_ADMIN y ADMIN)
  if (pathname.startsWith("/dashboard/payment-engine")) {
    if (!isLoggedIn) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/login", req.nextUrl))
      );
    }
    if (!userRoles.includes("SUPER_ADMIN") && !userRoles.includes("ADMIN")) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", req.nextUrl))
      );
    }
  }

  // 2. Protection for API Admin routes
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    if (!hasRouteAccess("/dashboard/admin", userRoles)) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      );
    }
  }

  // 3. Unauthenticated Dashboard Access -> Redirect to /login
  if (isDashboardPage && !isLoggedIn) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/login", req.nextUrl))
    );
  }

  // 4. Centralized Route Access Control Check via hasRouteAccess()
  if (isDashboardPage && isLoggedIn) {
    if (!hasRouteAccess(pathname, userRoles)) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", req.nextUrl))
      );
    }
  }

  // 5. Already Logged In Access to Auth Pages (/login, /register)
  if (isAuthPage && isLoggedIn) {
    return applySecurityHeaders(
      NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    );
  }

  return applySecurityHeaders(NextResponse.next());
}

export default proxyMiddleware;

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow /admin/login and /api/admin/login freely
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin routes
  const isAdminPage = pathname.startsWith("/admin");
  // Protect admin API routes and mutating template API routes
  const isAdminApi = pathname.startsWith("/api/admin");
  const isProtectedTemplateApi =
    pathname.startsWith("/api/templates") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);

  if (isAdminPage || isAdminApi || isProtectedTemplateApi) {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyAdminSessionToken(token);

    if (!isValid) {
      if (isAdminPage) {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      } else {
        return NextResponse.json(
          { error: "Unauthorized: Admin session required" },
          { status: 401 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/templates/:path*"],
};

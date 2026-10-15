import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, Next.js internals and files with extensions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname === "/login";
  const isPublicRoute =
    pathname === "/privacy" ||
    pathname === "/data-deletion" ||
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/health");

  // Always allow public routes through
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Fast cookie check for session token (works in both dev and prod)
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in — redirect away from login page
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

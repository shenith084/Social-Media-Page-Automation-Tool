import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static assets, internal APIs, and auth api routes
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = pathname === "/login";
  const isPublicRoute = pathname.startsWith("/api/webhook") || pathname.startsWith("/api/health");

  // In development, allow access to prevent redirect loops
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Fast cookie check for session token
  const sessionCookie = 
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    if (isAuthRoute || isPublicRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

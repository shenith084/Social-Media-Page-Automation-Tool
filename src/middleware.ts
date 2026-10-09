import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login"];
const publicRoutes = ["/api/webhook", "/api/health"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static assets and better-auth api routes
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") // static files like .ico, .png
  ) {
    return NextResponse.next();
  }

  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Check session using better-auth's fetch approach for middleware
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  if (!session) {
    if (isAuthRoute || isPublicRoute) {
      return NextResponse.next();
    }
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in, don't let them sit on the login page
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow authenticated access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

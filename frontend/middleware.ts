import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).origin !== request.nextUrl.origin) {
          return NextResponse.json({ success: false, message: "Cross-origin request rejected.", data: null, errors: null }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ success: false, message: "Invalid request origin.", data: null, errors: null }, { status: 403 });
      }
    }
  }
  if (request.nextUrl.pathname.startsWith("/dashboard") && !request.cookies.has("bv_access")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/api/auth/:path*"] };

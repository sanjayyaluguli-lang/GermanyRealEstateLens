import { NextResponse, type NextRequest } from "next/server";

// Runs before every page request:
//  1. Enforce HTTPS in production (behind a TLS-terminating proxy).
//  2. Optimistic redirect to /login for protected pages without a session
//     cookie. The real authorisation check happens server-side in every page
//     and action (requireUser), this only saves a round-trip.

const PROTECTED = ["/dashboard", "/profile", "/scenarios", "/favourites", "/account"];

export function proxy(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && request.headers.get("x-forwarded-proto") === "http") {
    // Build the target from the public origin, not the internal bind address.
    const origin = process.env.APP_URL?.startsWith("https://")
      ? process.env.APP_URL
      : `https://${request.headers.get("x-forwarded-host") ?? request.headers.get("host")}`;
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, origin), 308);
  }

  const { pathname, search } = request.nextUrl;
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const cookie = isProd ? "__Host-grl_session" : "grl_session";
    if (!request.cookies.has(cookie)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

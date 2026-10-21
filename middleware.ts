import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-token";

const PROTECTED = ["/import", "/imported", "/atc", "/api/import"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "دسترسی به این بخش فقط برای مدیر مجاز است." },
      { status: 401 },
    );
  }

  const login = new URL("/login", request.url);
  const next = `${pathname}${search}`;
  if (next.startsWith("/") && !next.startsWith("//")) login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/import/:path*",
    "/imported/:path*",
    "/atc/:path*",
    "/api/import/:path*",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-token";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const secure =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return response;
}

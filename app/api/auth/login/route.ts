import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-token";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= 10) {
    return NextResponse.json({ ok: false, error: "too_many_attempts" }, { status: 429 });
  }

  const configuredUser = process.env.ADMIN_USERNAME || "admin";
  const configuredPassword = process.env.ADMIN_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";
  if (!configuredPassword || !secret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  let username = "";
  let password = "";
  try {
    const body = (await request.json()) as { username?: unknown; password?: unknown };
    username = typeof body.username === "string" ? body.username : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  if (!same(username, configuredUser) || !same(password, configuredPassword)) {
    const next = !entry || entry.resetAt <= now ? { count: 1, resetAt: now + 5 * 60_000 } : { ...entry, count: entry.count + 1 };
    attempts.set(ip, next);
    return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createSessionToken(configuredUser);
  const response = NextResponse.json({ ok: true });
  const secure =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

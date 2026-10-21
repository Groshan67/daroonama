import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth-token";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function adminConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.ADMIN_PASSWORD);
}

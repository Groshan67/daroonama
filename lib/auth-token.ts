export const SESSION_COOKIE = "daronama_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function secret(): string {
  return process.env.AUTH_SECRET ?? "";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(username: string): Promise<string> {
  if (!secret()) throw new Error("AUTH_SECRET is not configured");
  const payload = {
    sub: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !secret()) return false;
  const [body, signature] = token.split(".");
  if (!body || !signature) return false;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature).buffer as ArrayBuffer,
      new TextEncoder().encode(body),
    );
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as {
      sub?: string;
      exp?: number;
    };
    return Boolean(payload.sub) && typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

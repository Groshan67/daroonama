import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ورود مدیر",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/import";
}

export default async function LoginPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const next = safeNext(query.next);
  if (await isAdmin()) redirect(next);
  return <LoginForm next={next} configured={adminConfigured()} />;
}

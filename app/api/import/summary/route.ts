import { NextResponse } from "next/server";
import { getImportSummary } from "@/lib/import/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, summary: getImportSummary() });
}

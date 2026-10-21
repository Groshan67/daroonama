import { NextResponse, type NextRequest } from "next/server";
import { getDrugSummaries } from "@/lib/data";

export async function GET(request: NextRequest) {
  const codes = (request.nextUrl.searchParams.get("codes") ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean)
    .slice(0, 100);

  return NextResponse.json(
    { drugs: getDrugSummaries(codes) },
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { searchSimulationProducts } from "@/lib/catalog/simulation";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
  return NextResponse.json(
    { ok: true, products: searchSimulationProducts(query, 10) },
    { headers: { "Cache-Control": "private, max-age=15" } },
  );
}

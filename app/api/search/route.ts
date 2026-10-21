import { NextResponse, type NextRequest } from "next/server";
import { getCatalogSearchHits } from "@/lib/catalog/queries";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 4);
  const limit = Number.isFinite(rawLimit) ? Math.min(8, Math.max(1, rawLimit)) : 4;

  if (query.trim().length < 2) {
    return NextResponse.json({
      query,
      total: 0,
      drugs: [],
      ingredients: [],
      companies: [],
      categories: [],
    });
  }

  const hits = getCatalogSearchHits(query, limit);
  return NextResponse.json(
    {
      query,
      total:
        hits.drugs.length + hits.ingredients.length + hits.companies.length + hits.categories.length,
      ...hits,
    },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}

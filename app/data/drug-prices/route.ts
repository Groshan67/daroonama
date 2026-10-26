import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT irc, display_name, ingredient_name_fa, brand_owner_name,
              dosage_form_fa, dose, package_count, price_toman, unit_price_toman,
              generic_code, atc, category_name, last_seen_at
       FROM products
       WHERE is_current = 1 AND price_toman IS NOT NULL
       ORDER BY display_name COLLATE NOCASE ASC, irc ASC`,
    )
    .all() as unknown as Record<string, unknown>[];

  const header = [
    "irc",
    "display_name",
    "ingredient_name_fa",
    "brand_owner_name",
    "dosage_form_fa",
    "dose",
    "package_count",
    "package_price_toman",
    "unit_price_toman",
    "generic_code",
    "atc",
    "category_name",
    "last_seen_at",
  ];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(header.map((key) => csv(row[key])).join(","));
  }
  const body = `\uFEFF${lines.join("\n")}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="groshan-drug-prices.csv"',
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

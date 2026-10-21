import { getDb } from "@/lib/db";
import { normalizeSearch } from "./normalize";
import type { HistoryRow, ProductRow } from "./service";

export type ImportedSearchParams = {
  q?: string;
  category?: string;
  productType?: string;
  priced?: string;
  page?: number;
  perPage?: number;
  sort?: string;
};

export type ImportedSearchResult = {
  rows: ProductRow[];
  total: number;
  page: number;
  pages: number;
};

const SELECT_COLUMNS = `irc, gtin, fingerprint, row_hash, generic_code, generic_name_en,
  generic_name_fa, ingredient_key, ingredient_name_fa, ingredient_name_en, brand_name,
  display_name, brand_owner_name, brand_owner_national_id, producer_name, producer_country,
  dosage_form_fa, dosage_form_en, route_fa, route_en, drug_index_id, drug_index_fa,
  drug_index_en, dose, package_count, price_rial, price_toman, unit_price_toman, status,
  status_label, issuance_date, expiration_date, product_type, atc, category_id,
  category_name, erx, source_response_at, first_seen_at, last_seen_at, last_batch_id`;

export function searchImported({
  q = "",
  category = "",
  productType = "",
  priced = "",
  page = 1,
  perPage = 20,
  sort = "recent",
}: ImportedSearchParams): ImportedSearchResult {
  const db = getDb();
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(100, Math.max(5, perPage));
  const where: string[] = [];
  const params: (string | number)[] = [];

  const query = normalizeSearch(q);
  if (query) {
    where.push(`search_text LIKE ?`);
    params.push(`%${query}%`);
  }
  if (category) {
    where.push(`category_id = ?`);
    params.push(category);
  }
  if (productType) {
    where.push(`product_type = ?`);
    params.push(productType);
  }
  if (priced === "1") {
    where.push(`price_toman IS NOT NULL`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = db
    .prepare(`SELECT COUNT(*) AS count FROM products ${whereSql}`)
    .get(...params) as { count: number };
  const total = countRow.count;
  const pages = Math.max(1, Math.ceil(total / safePerPage));
  const currentPage = Math.min(safePage, pages);

  const orderBy =
    sort === "price-asc"
      ? "price_toman IS NULL, price_toman ASC"
      : sort === "price-desc"
        ? "price_toman IS NULL, price_toman DESC"
        : sort === "name"
          ? "display_name COLLATE NOCASE ASC"
          : "price_toman IS NULL ASC, last_seen_at DESC, display_name ASC";

  const rows = db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM products ${whereSql}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
    )
    .all(...params, safePerPage, (currentPage - 1) * safePerPage) as unknown as ProductRow[];

  return { rows, total, page: currentPage, pages };
}

export function getImportedProduct(irc: string): ProductRow | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT ${SELECT_COLUMNS} FROM products WHERE irc = ?`)
    .get(irc) as ProductRow | undefined;
}

export function getPriceHistory(irc: string): HistoryRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT irc, price_rial, price_toman, observed_at, source_response_at, batch_id
       FROM price_history WHERE irc = ? ORDER BY observed_at ASC, id ASC`,
    )
    .all(irc) as unknown as HistoryRow[];
}

export function getSimilarImported(
  product: ProductRow,
  limit = 6,
): ProductRow[] {
  const db = getDb();
  if (product.generic_code) {
    return db
      .prepare(
        `SELECT ${SELECT_COLUMNS} FROM products
         WHERE generic_code = ? AND irc != ?
         ORDER BY unit_price_toman IS NULL, unit_price_toman ASC
         LIMIT ?`,
      )
      .all(product.generic_code, product.irc, limit) as unknown as ProductRow[];
  }
  return db
    .prepare(
      `SELECT ${SELECT_COLUMNS} FROM products
       WHERE ingredient_key = ? AND irc != ?
       ORDER BY unit_price_toman IS NULL, unit_price_toman ASC
       LIMIT ?`,
    )
    .all(product.ingredient_key, product.irc, limit) as unknown as ProductRow[];
}

export function getImportedCategoryCounts(): { id: string; name: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT category_id AS id, MAX(category_name) AS name, COUNT(*) AS count
       FROM products
       GROUP BY category_id
       ORDER BY count DESC`,
    )
    .all() as unknown as { id: string; name: string; count: number }[];
}

export function getImportedIngredientCount(product: ProductRow): number {
  const db = getDb();
  if (!product.ingredient_key) return 0;
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM products WHERE ingredient_key = ?`)
    .get(product.ingredient_key) as { count: number };
  return row.count;
}

export function getImportedHistoryCount(irc: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM price_history WHERE irc = ?`)
    .get(irc) as { count: number };
  return row.count;
}

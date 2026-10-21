import { getDb } from "@/lib/db";
import type { ProductRow } from "@/lib/import/service";

export type AtcNode = {
  code: string;
  parent_code: string | null;
  level: number;
  name_en: string | null;
  name_fa: string | null;
  ddd: string | null;
  path_codes: string | null;
  path_fa: string | null;
};

export type AtcNodeWithCounts = AtcNode & {
  children_count: number;
  product_count: number;
};

const ATC_COLUMNS = `code, parent_code, level, name_en, name_fa, ddd, path_codes, path_fa`;

const PRODUCT_COLUMNS = `irc, gtin, fingerprint, row_hash, generic_code, generic_name_en,
  generic_name_fa, ingredient_key, ingredient_name_fa, ingredient_name_en, brand_name,
  display_name, brand_owner_name, brand_owner_national_id, producer_name, producer_country,
  dosage_form_fa, dosage_form_en, route_fa, route_en, drug_index_id, drug_index_fa,
  drug_index_en, dose, package_count, price_rial, price_toman, unit_price_toman, status,
  status_label, issuance_date, expiration_date, product_type, atc, category_id,
  category_name, erx, source_response_at, first_seen_at, last_seen_at, last_batch_id`;

export function getAtcCounts(): { level: number; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT level, COUNT(*) AS count FROM atc_nodes GROUP BY level ORDER BY level`,
    )
    .all() as unknown as { level: number; count: number }[];
}

export function getAtcRoots(): AtcNodeWithCounts[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT n.${ATC_COLUMNS.replaceAll(", ", ", n.")},
        (SELECT COUNT(*) FROM atc_nodes c WHERE c.parent_code = n.code) AS children_count,
        (SELECT COUNT(*) FROM products p WHERE p.is_current = 1 AND p.atc LIKE n.code || '%') AS product_count
       FROM atc_nodes n
       WHERE n.level = 1
       ORDER BY n.code`,
    )
    .all() as unknown as AtcNodeWithCounts[];
}

export function getAtcNode(code: string): AtcNode | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT ${ATC_COLUMNS} FROM atc_nodes WHERE code = ?`)
    .get(code) as AtcNode | undefined;
}

export function getAtcChildren(code: string): AtcNodeWithCounts[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT n.${ATC_COLUMNS.replaceAll(", ", ", n.")},
        (SELECT COUNT(*) FROM atc_nodes c WHERE c.parent_code = n.code) AS children_count,
        (SELECT COUNT(*) FROM products p WHERE p.is_current = 1 AND p.atc LIKE n.code || '%') AS product_count
       FROM atc_nodes n
       WHERE n.parent_code = ?
       ORDER BY n.code`,
    )
    .all(code) as unknown as AtcNodeWithCounts[];
}

export function getAtcPath(code: string): AtcNode[] {
  const db = getDb();
  const node = getAtcNode(code);
  if (!node) return [];
  const codes = (node.path_codes || code).split("/").filter(Boolean);
  if (codes.length <= 1) return [node];
  const placeholders = codes.map(() => "?").join(", ");
  const rows = db
    .prepare(`SELECT ${ATC_COLUMNS} FROM atc_nodes WHERE code IN (${placeholders}) ORDER BY level`)
    .all(...codes) as unknown as AtcNode[];
  return rows.length ? rows : [node];
}

export function getAtcProducts(code: string, limit = 50): ProductRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT ${PRODUCT_COLUMNS} FROM products
       WHERE is_current = 1 AND atc LIKE ? AND atc IS NOT NULL
       ORDER BY price_toman IS NULL, price_toman ASC
       LIMIT ?`,
    )
    .all(`${code}%`, limit) as unknown as ProductRow[];
}

export function getAtcProductCount(code: string): number {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM products WHERE is_current = 1 AND atc LIKE ?`)
    .get(`${code}%`) as { count: number };
  return row.count;
}

export function isAtcLoaded(): boolean {
  const db = getDb();
  const row = db.prepare(`SELECT COUNT(*) AS count FROM atc_nodes`).get() as { count: number };
  return row.count > 0;
}

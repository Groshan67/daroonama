import { getDb } from "@/lib/db";
import { rebuildIdentities } from "@/lib/catalog/identity";
import type { NormalizedProduct, PriceUnit } from "./normalize";

export type ImportMeta = {
  fileName: string;
  fileHash: string;
  observedAt: string;
  priceUnit: PriceUnit;
  columns: string[];
  invalidRows: number;
};

export type ImportResult = {
  batchId: number;
  rowCount: number;
  inserted: number;
  updated: number;
  unchanged: number;
  priceChanges: number;
  invalidRows: number;
  observedAt: string;
};

export type BatchRow = {
  id: number;
  file_name: string;
  file_hash: string;
  imported_at: string;
  observed_at: string;
  source_response_at: string | null;
  row_count: number;
  inserted_count: number;
  updated_count: number;
  unchanged_count: number;
  price_change_count: number;
  invalid_count: number;
  status: string;
  note: string | null;
};

export type ProductRow = {
  irc: string;
  gtin: string | null;
  fingerprint: string | null;
  row_hash: string;
  generic_code: string | null;
  generic_name_en: string | null;
  generic_name_fa: string | null;
  ingredient_key: string | null;
  ingredient_name_fa: string | null;
  ingredient_name_en: string | null;
  brand_name: string | null;
  display_name: string | null;
  en_name: string | null;
  brand_owner_name: string | null;
  brand_owner_national_id: string | null;
  producer_name: string | null;
  producer_country: string | null;
  dosage_form_fa: string | null;
  dosage_form_en: string | null;
  route_fa: string | null;
  route_en: string | null;
  drug_index_id: string | null;
  drug_index_fa: string | null;
  drug_index_en: string | null;
  dose: string | null;
  package_count: number | null;
  price_rial: number | null;
  price_toman: number | null;
  unit_price_toman: number | null;
  status: number | null;
  status_label: string | null;
  issuance_date: string | null;
  expiration_date: string | null;
  product_type: string | null;
  atc: string | null;
  category_id: string | null;
  category_name: string | null;
  erx: string | null;
  source_response_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_batch_id: number;
};

export type HistoryRow = {
  irc: string;
  price_rial: number | null;
  price_toman: number | null;
  observed_at: string;
  source_response_at: string | null;
  batch_id: number;
};

const PRODUCT_COLUMNS = [
  "irc",
  "gtin",
  "fingerprint",
  "row_hash",
  "generic_code",
  "generic_name_en",
  "generic_name_fa",
  "ingredient_key",
  "ingredient_name_fa",
  "ingredient_name_en",
  "brand_name",
  "display_name",
  "en_name",
  "brand_owner_name",
  "brand_owner_national_id",
  "producer_name",
  "producer_country",
  "dosage_form_fa",
  "dosage_form_en",
  "route_fa",
  "route_en",
  "drug_index_id",
  "drug_index_fa",
  "drug_index_en",
  "dose",
  "package_count",
  "price_rial",
  "price_toman",
  "unit_price_toman",
  "status",
  "status_label",
  "issuance_date",
  "expiration_date",
  "product_type",
  "atc",
  "category_id",
  "category_name",
  "erx",
  "source_response_at",
  "search_text",
  "raw_json",
  "first_seen_at",
  "last_seen_at",
  "last_batch_id",
] as const;

const UPDATE_COLUMNS = PRODUCT_COLUMNS.filter(
  (column) => column !== "irc" && column !== "first_seen_at",
);

function productValues(product: NormalizedProduct, now: string, batchId: number) {
  return [
    product.irc,
    product.gtin,
    product.fingerprint,
    product.rowHash,
    product.genericCode,
    product.genericNameEn,
    product.genericNameFa,
    product.ingredientKey,
    product.ingredientNameFa,
    product.ingredientNameEn,
    product.brandName,
    product.displayName,
    product.enName,
    product.brandOwnerName,
    product.brandOwnerNationalId,
    product.producerName,
    product.producerCountry,
    product.dosageFormFa,
    product.dosageFormEn,
    product.routeFa,
    product.routeEn,
    product.drugIndexId,
    product.drugIndexFa,
    product.drugIndexEn,
    product.dose,
    product.packageCount,
    product.priceRial,
    product.priceToman,
    product.unitPriceToman,
    product.status,
    product.statusLabel,
    product.issuanceDate,
    product.expirationDate,
    product.productType,
    product.atc,
    product.categoryId,
    product.categoryName,
    product.erx,
    product.sourceResponseAt,
    product.searchText,
    product.rawJson,
    now,
    now,
    batchId,
  ];
}

function observedIso(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00.000Z`)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function findBatchByHash(fileHash: string): BatchRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM import_batches
       WHERE file_hash = ? AND status = 'completed'
       ORDER BY id DESC LIMIT 1`,
    )
    .get(fileHash) as BatchRow | undefined;
}

export function listBatches(limit = 12): BatchRow[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM import_batches ORDER BY id DESC LIMIT ?`)
    .all(limit) as unknown as BatchRow[];
  // node:sqlite returns null-prototype objects; Client Components need plain objects.
  return rows.map((row) => ({ ...row }));
}

export type ImportSummary = {
  total: number;
  ingredients: number;
  companies: number;
  categories: number;
  genericFamilies: number;
  priced: number;
  noPrice: number;
  supplements: number;
  lastSeen: string | null;
  batches: number;
  lastBatch: BatchRow | null;
};

export function getImportSummary(): ImportSummary {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COUNT(DISTINCT ingredient_key) AS ingredients,
         COUNT(DISTINCT COALESCE(NULLIF(brand_owner_national_id, ''), brand_owner_name)) AS companies,
         COUNT(DISTINCT category_id) AS categories,
         COUNT(DISTINCT generic_code) AS genericFamilies,
         COALESCE(SUM(CASE WHEN price_toman IS NOT NULL THEN 1 ELSE 0 END), 0) AS priced,
         COALESCE(SUM(CASE WHEN price_toman IS NULL THEN 1 ELSE 0 END), 0) AS noPrice,
         COALESCE(SUM(CASE WHEN product_type = '28' THEN 1 ELSE 0 END), 0) AS supplements,
         MAX(last_seen_at) AS lastSeen
       FROM products`,
    )
    .get() as {
    total: number;
    ingredients: number;
    companies: number;
    categories: number;
    genericFamilies: number;
    priced: number;
    noPrice: number;
    supplements: number;
    lastSeen: string | null;
  };
  const batches = db.prepare(`SELECT COUNT(*) AS count FROM import_batches`).get() as {
    count: number;
  };
  return {
    ...row,
    batches: batches.count,
    lastBatch: listBatches(1)[0] ?? null,
  };
}

export function importProducts(products: NormalizedProduct[], meta: ImportMeta): ImportResult {
  const db = getDb();
  const now = new Date().toISOString();
  const observedAt = observedIso(meta.observedAt);
  const sourceResponseAt =
    products
      .map((product) => product.sourceResponseAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  const batchInfo = db
    .prepare(
      `INSERT INTO import_batches
       (file_name, file_hash, imported_at, observed_at, source_response_at, row_count,
        invalid_count, status, columns_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', ?)`,
    )
    .run(
      meta.fileName,
      meta.fileHash,
      now,
      observedAt,
      sourceResponseAt,
      products.length,
      meta.invalidRows,
      JSON.stringify(meta.columns),
    );
  const batchId = Number(batchInfo.lastInsertRowid);

  const existing = db
    .prepare(`SELECT irc, row_hash, price_toman FROM products`)
    .all() as unknown as { irc: string; row_hash: string; price_toman: number | null }[];
  const known = new Map(existing.map((row) => [row.irc, row]));

  const placeholders = PRODUCT_COLUMNS.map(() => "?").join(", ");
  const updateSql = UPDATE_COLUMNS.map((column) => `${column} = excluded.${column}`).join(", ");
  const upsert = db.prepare(
    `INSERT INTO products (${PRODUCT_COLUMNS.join(", ")}) VALUES (${placeholders})
     ON CONFLICT(irc) DO UPDATE SET ${updateSql}`,
  );
  const insertHistory = db.prepare(
    `INSERT OR IGNORE INTO price_history
       (irc, price_rial, price_toman, observed_at, source_response_at, batch_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let priceChanges = 0;

  db.exec("BEGIN IMMEDIATE");
  try {
    for (const product of products) {
      const previous = known.get(product.irc);
      if (!previous) {
        inserted += 1;
      } else if (previous.row_hash === product.rowHash) {
        unchanged += 1;
      } else {
        updated += 1;
      }

      if (
        product.priceToman !== null &&
        (!previous || previous.price_toman !== product.priceToman)
      ) {
        if (previous) priceChanges += 1;
      }

      upsert.run(...productValues(product, now, batchId));

      if (product.priceToman !== null) {
        insertHistory.run(
          product.irc,
          product.priceRial,
          product.priceToman,
          observedAt,
          product.sourceResponseAt || sourceResponseAt,
          batchId,
        );
      }

      known.set(product.irc, {
        irc: product.irc,
        row_hash: product.rowHash,
        price_toman: product.priceToman,
      });
    }

    db.prepare(
      `UPDATE import_batches SET
         inserted_count = ?, updated_count = ?, unchanged_count = ?,
         price_change_count = ?, status = 'completed'
       WHERE id = ?`,
    ).run(inserted, updated, unchanged, priceChanges, batchId);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.prepare(`UPDATE import_batches SET status = 'failed', note = ? WHERE id = ?`).run(
      String(error),
      batchId,
    );
    throw error;
  }

  try {
    db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // A checkpoint is an optimization; the committed data is still valid.
  }

  try {
    rebuildIdentities();
  } catch (error) {
    console.error("identity rebuild failed after import", error);
  }

  return {
    batchId,
    rowCount: products.length,
    inserted,
    updated,
    unchanged,
    priceChanges,
    invalidRows: meta.invalidRows,
    observedAt,
  };
}

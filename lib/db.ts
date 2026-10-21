import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { __daranamaDb?: DatabaseSync };

function databasePath(): string {
  if (process.env.DARANAMA_DB_PATH) return process.env.DARANAMA_DB_PATH;
  const dir = path.join(process.cwd(), ".data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "daranama.sqlite");
}

function hasColumn(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as { name: string }[];
  return rows.some((row) => row.name === column);
}

function ensureColumn(db: DatabaseSync, table: string, column: string, definition: string) {
  if (hasColumn(db, table, column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

function migrate(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS import_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      source_response_at TEXT,
      row_count INTEGER NOT NULL DEFAULT 0,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      unchanged_count INTEGER NOT NULL DEFAULT 0,
      price_change_count INTEGER NOT NULL DEFAULT 0,
      invalid_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed',
      note TEXT,
      columns_json TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_batches_imported_at
      ON import_batches(imported_at DESC);
    CREATE INDEX IF NOT EXISTS idx_batches_file_hash
      ON import_batches(file_hash);

    CREATE TABLE IF NOT EXISTS products (
      irc TEXT PRIMARY KEY,
      gtin TEXT,
      fingerprint TEXT,
      row_hash TEXT NOT NULL,
      generic_code TEXT,
      generic_name_en TEXT,
      generic_name_fa TEXT,
      ingredient_key TEXT,
      ingredient_name_fa TEXT,
      ingredient_name_en TEXT,
      brand_name TEXT,
      display_name TEXT,
      brand_owner_name TEXT,
      brand_owner_national_id TEXT,
      producer_name TEXT,
      producer_country TEXT,
      dosage_form_fa TEXT,
      dosage_form_en TEXT,
      route_fa TEXT,
      route_en TEXT,
      drug_index_id TEXT,
      drug_index_fa TEXT,
      drug_index_en TEXT,
      dose TEXT,
      package_count INTEGER,
      price_rial INTEGER,
      price_toman INTEGER,
      unit_price_toman INTEGER,
      status INTEGER,
      status_label TEXT,
      issuance_date TEXT,
      expiration_date TEXT,
      product_type TEXT,
      atc TEXT,
      category_id TEXT,
      category_name TEXT,
      erx TEXT,
      source_response_at TEXT,
      search_text TEXT,
      raw_json TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      last_batch_id INTEGER NOT NULL,
      identity_id INTEGER,
      is_current INTEGER NOT NULL DEFAULT 1,
      price_missing_latest INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_products_ingredient
      ON products(ingredient_key);
    CREATE INDEX IF NOT EXISTS idx_products_generic_code
      ON products(generic_code);
    CREATE INDEX IF NOT EXISTS idx_products_category
      ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand_owner
      ON products(brand_owner_national_id);
    CREATE INDEX IF NOT EXISTS idx_products_search
      ON products(search_text);
    CREATE INDEX IF NOT EXISTS idx_products_atc
      ON products(atc);
    CREATE INDEX IF NOT EXISTS idx_products_type
      ON products(product_type);
    CREATE INDEX IF NOT EXISTS idx_products_price
      ON products(price_toman);
    CREATE INDEX IF NOT EXISTS idx_products_drug_index
      ON products(drug_index_id);

    CREATE TABLE IF NOT EXISTS drug_indexes (
      id INTEGER PRIMARY KEY,
      en_name TEXT,
      fa_name TEXT,
      dosage_form_id INTEGER,
      dosage_form_title TEXT,
      strength TEXT,
      str TEXT,
      strength_unit TEXT,
      route_id INTEGER,
      route_title TEXT,
      atc_code TEXT,
      idl_id INTEGER,
      description TEXT,
      molecule TEXT,
      measure TEXT,
      commission_date TEXT,
      persian_commission_date TEXT,
      canceled INTEGER NOT NULL DEFAULT 0,
      cancellation_date TEXT,
      persian_cancellation_date TEXT,
      last_updated TEXT,
      cas_number TEXT,
      narcotic_grade TEXT,
      access_level TEXT,
      drug_type TEXT,
      rial_price_ceiling INTEGER,
      attribute_ids_json TEXT,
      clinical_use_ids_json TEXT,
      fetched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_drug_indexes_atc
      ON drug_indexes(atc_code);
    CREATE INDEX IF NOT EXISTS idx_drug_indexes_canceled
      ON drug_indexes(canceled);

    CREATE TABLE IF NOT EXISTS drug_index_ingredients (
      drug_index_id INTEGER NOT NULL,
      id INTEGER NOT NULL,
      substance_id INTEGER,
      substance_name TEXT,
      cas_number TEXT,
      pubchem_cid INTEGER,
      strength REAL,
      strength_unit_id INTEGER,
      strength_unit_en TEXT,
      strength_unit_ucum TEXT,
      molecule TEXT,
      last_updated TEXT,
      PRIMARY KEY (drug_index_id, id)
    );

    CREATE INDEX IF NOT EXISTS idx_drug_index_ingredients_index
      ON drug_index_ingredients(drug_index_id);

    CREATE TABLE IF NOT EXISTS product_identity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identity_key TEXT NOT NULL UNIQUE,
      canonical_irc TEXT NOT NULL,
      gtin TEXT,
      generic_code TEXT,
      brand_owner_national_id TEXT,
      brand_norm TEXT,
      dose_norm TEXT,
      package_count INTEGER,
      product_type TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      current_price_rial INTEGER,
      current_price_toman INTEGER,
      price_last_seen_at TEXT,
      price_missing_latest INTEGER NOT NULL DEFAULT 0,
      aliases_count INTEGER NOT NULL DEFAULT 1,
      confidence TEXT NOT NULL DEFAULT 'high',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_identity_canonical
      ON product_identity(canonical_irc);
    CREATE INDEX IF NOT EXISTS idx_identity_gtin
      ON product_identity(gtin);
    CREATE INDEX IF NOT EXISTS idx_identity_generic
      ON product_identity(generic_code);
    CREATE INDEX IF NOT EXISTS idx_identity_ingredient
      ON product_identity(brand_owner_national_id);

    CREATE TABLE IF NOT EXISTS identity_alias (
      identity_id INTEGER NOT NULL,
      irc TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      batch_id INTEGER NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (identity_id, irc)
    );

    CREATE INDEX IF NOT EXISTS idx_alias_irc
      ON identity_alias(irc);
    CREATE INDEX IF NOT EXISTS idx_alias_identity
      ON identity_alias(identity_id);

    CREATE TABLE IF NOT EXISTS identity_price_history (
      identity_id INTEGER NOT NULL,
      observed_at TEXT NOT NULL,
      irc TEXT NOT NULL,
      price_rial INTEGER,
      price_toman INTEGER,
      batch_id INTEGER NOT NULL,
      PRIMARY KEY (identity_id, observed_at)
    );

    CREATE INDEX IF NOT EXISTS idx_identity_history_identity
      ON identity_price_history(identity_id, observed_at);

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      irc TEXT NOT NULL,
      price_rial INTEGER,
      price_toman INTEGER,
      observed_at TEXT NOT NULL,
      source_response_at TEXT,
      batch_id INTEGER NOT NULL,
      UNIQUE(irc, batch_id)
    );

    CREATE INDEX IF NOT EXISTS idx_price_history_irc
      ON price_history(irc, observed_at);

    CREATE TABLE IF NOT EXISTS atc_nodes (
      code TEXT PRIMARY KEY,
      parent_code TEXT,
      level INTEGER NOT NULL,
      name_en TEXT,
      name_fa TEXT,
      ddd TEXT,
      path_codes TEXT,
      path_fa TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_atc_parent
      ON atc_nodes(parent_code);
    CREATE INDEX IF NOT EXISTS idx_atc_level
      ON atc_nodes(level);
  `);

  ensureColumn(db, "products", "identity_id", "INTEGER");
  ensureColumn(db, "products", "is_current", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "products", "price_missing_latest", "INTEGER NOT NULL DEFAULT 0");
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_identity
      ON products(identity_id);
    CREATE INDEX IF NOT EXISTS idx_products_current
      ON products(is_current);
  `);
}

export function getDb(): DatabaseSync {
  if (globalForDb.__daranamaDb) return globalForDb.__daranamaDb;
  const db = new DatabaseSync(databasePath());
  migrate(db);
  globalForDb.__daranamaDb = db;
  return db;
}

export function getDatabasePath(): string {
  return databasePath();
}

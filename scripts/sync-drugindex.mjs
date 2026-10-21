#!/usr/bin/env node
/**
 * Fetch all official DrugIndex records and upsert them into SQLite.
 *
 * Usage:
 *   node scripts/sync-drugindex.mjs
 *
 * Environment:
 *   DARANAMA_DB_PATH   default: .data/daranama.sqlite
 *   DRUG_INDEX_PAGE_SIZE default: 500 (the API's 3172 size is unreliable after page 1)
 *   DRUG_INDEX_URL     override the endpoint
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const BASE_URL =
  process.env.DRUG_INDEX_URL ??
  "https://irc.fda.gov.ir/api/DrugIndexApi/GetAllDrugIndexesWithSpecificAttribute";
const PAGE_SIZE = Math.max(50, Math.min(2000, Number(process.env.DRUG_INDEX_PAGE_SIZE ?? 500) || 500));
const dbPath = path.resolve(process.env.DARANAMA_DB_PATH ?? ".data/daranama.sqlite");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(pageNumber) {
  const url = new URL(BASE_URL);
  url.searchParams.set("pageNumber", String(pageNumber));
  url.searchParams.set("pageSize", String(PAGE_SIZE));

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data?.Success) {
        throw new Error(data?.Message || data?.ErrorCode || "API returned Success=false");
      }
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        console.warn(`page ${pageNumber}: attempt ${attempt} failed (${error.message}); retrying...`);
        await sleep(attempt * 800);
      }
    }
  }
  throw new Error(`page ${pageNumber} failed: ${lastError?.message ?? lastError}`);
}

function createSchema(db) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
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
    CREATE INDEX IF NOT EXISTS idx_drug_indexes_atc ON drug_indexes(atc_code);
    CREATE INDEX IF NOT EXISTS idx_drug_indexes_canceled ON drug_indexes(canceled);
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
  `);
}

function nullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function nullableReal(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function main() {
  console.log(`endpoint: ${BASE_URL}`);
  console.log(`pageSize: ${PAGE_SIZE}`);

  const first = await fetchPage(1);
  const total = Number(first.Count ?? 0);
  const actualPageSize = Number(first.PageSize ?? PAGE_SIZE) || PAGE_SIZE;
  const pages = total > 0 ? Math.ceil(total / actualPageSize) : 1;
  console.log(`reported count: ${total}; pages: ${pages}`);

  const byId = new Map();
  for (let page = 1; page <= pages; page += 1) {
    const data = page === 1 ? first : await fetchPage(page);
    const result = Array.isArray(data.Result) ? data.Result : [];
    for (const item of result) {
      const id = Number(item?.Id);
      if (Number.isFinite(id)) byId.set(id, item);
    }
    console.log(`page ${page}/${pages}: ${result.length} records; unique so far: ${byId.size}`);
    if (result.length === 0 && page > 1) break;
  }

  const rows = [...byId.values()];
  if (rows.length === 0) throw new Error("API returned no records");
  console.log(`unique drug indexes: ${rows.length}; reported count: ${total}`);
  if (total > 0 && rows.length < total) {
    console.warn(`WARNING: received ${rows.length} of ${total} reported records; importing what was returned.`);
  }

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  createSchema(db);

  const upsert = db.prepare(`
    INSERT INTO drug_indexes (
      id, en_name, fa_name, dosage_form_id, dosage_form_title, strength, str,
      strength_unit, route_id, route_title, atc_code, idl_id, description, molecule,
      measure, commission_date, persian_commission_date, canceled,
      cancellation_date, persian_cancellation_date, last_updated, cas_number,
      narcotic_grade, access_level, drug_type, rial_price_ceiling,
      attribute_ids_json, clinical_use_ids_json, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      en_name = excluded.en_name,
      fa_name = excluded.fa_name,
      dosage_form_id = excluded.dosage_form_id,
      dosage_form_title = excluded.dosage_form_title,
      strength = excluded.strength,
      str = excluded.str,
      strength_unit = excluded.strength_unit,
      route_id = excluded.route_id,
      route_title = excluded.route_title,
      atc_code = excluded.atc_code,
      idl_id = excluded.idl_id,
      description = excluded.description,
      molecule = excluded.molecule,
      measure = excluded.measure,
      commission_date = excluded.commission_date,
      persian_commission_date = excluded.persian_commission_date,
      canceled = excluded.canceled,
      cancellation_date = excluded.cancellation_date,
      persian_cancellation_date = excluded.persian_cancellation_date,
      last_updated = excluded.last_updated,
      cas_number = excluded.cas_number,
      narcotic_grade = excluded.narcotic_grade,
      access_level = excluded.access_level,
      drug_type = excluded.drug_type,
      rial_price_ceiling = excluded.rial_price_ceiling,
      attribute_ids_json = excluded.attribute_ids_json,
      clinical_use_ids_json = excluded.clinical_use_ids_json,
      fetched_at = excluded.fetched_at
  `);
  const clearIngredients = db.prepare(`DELETE FROM drug_index_ingredients WHERE drug_index_id = ?`);
  const insertIngredient = db.prepare(`
    INSERT OR REPLACE INTO drug_index_ingredients (
      drug_index_id, id, substance_id, substance_name, cas_number, pubchem_cid,
      strength, strength_unit_id, strength_unit_en, strength_unit_ucum, molecule, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fetchedAt = new Date().toISOString();
  let ingredientRows = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of rows) {
      const id = Number(row.Id);
      upsert.run(
        id,
        row.EnName ?? null,
        row.FaName ?? null,
        nullableNumber(row.DosageFormID),
        row.DosageFormTitle ?? null,
        row.Strength ?? null,
        row.STR ?? null,
        row.StrengthUnitEnTitle ?? null,
        nullableNumber(row.RoutOfAdminID),
        row.RoutOfAdminEnTitle ?? null,
        row.ATCCode ?? null,
        nullableNumber(row.IDL_ID),
        row.Description ?? null,
        row.Molecule ?? null,
        row.Measure ?? null,
        row.CommissionDate ?? null,
        row.PersianCommissionDate ?? null,
        row.Canceled ? 1 : 0,
        row.CancellationDate ?? null,
        row.PersianCancellationDate ?? null,
        row.LastUpdated ?? null,
        row.CASNumber ?? null,
        row.NarcoticGrade ?? null,
        row.AccessLevel ?? null,
        row.DrugType ?? null,
        nullableNumber(row.RialPriceCeiling),
        JSON.stringify(row.DrugIndexAttributeIds ?? []),
        JSON.stringify(row.DrugIndexApprovedClinicalUseIds ?? []),
        fetchedAt,
      );

      clearIngredients.run(id);
      for (const ingredient of row.DrugIndexIngredients ?? []) {
        const ingredientId = nullableNumber(ingredient.Id);
        if (ingredientId === null) continue;
        insertIngredient.run(
          id,
          ingredientId,
          nullableNumber(ingredient.SubstanceId),
          ingredient.SubstanceName ?? null,
          ingredient.CASNumber ?? null,
          nullableNumber(ingredient.PubChemCID),
          nullableReal(ingredient.Strength),
          nullableNumber(ingredient.StrengthUnitId),
          ingredient.StrengthUnitEnTitle ?? null,
          ingredient.StrengthUnitUCUMTitle ?? null,
          ingredient.Molecule ?? null,
          ingredient.LastUpdated ?? null,
        );
        ingredientRows += 1;
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  const count = db.prepare(`SELECT COUNT(*) AS count FROM drug_indexes`).get();
  const ingredients = db.prepare(`SELECT COUNT(*) AS count FROM drug_index_ingredients`).get();
  const access = db.prepare(`SELECT access_level, COUNT(*) AS count FROM drug_indexes GROUP BY access_level`).all();
  const types = db.prepare(`SELECT drug_type, COUNT(*) AS count FROM drug_indexes GROUP BY drug_type`).all();
  console.log(JSON.stringify({
    fetched: rows.length,
    dbDrugIndexes: count.count,
    dbIngredients: ingredients.count,
    ingredientRowsInserted: ingredientRows,
    access,
    types,
  }, null, 2));
  db.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

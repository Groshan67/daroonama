#!/usr/bin/env node
/**
 * Import the official ATC hierarchy into SQLite.
 *
 * Usage:
 *   node scripts/import-atc.mjs /path/to/atc.csv
 *   DARANAMA_DB_PATH=/path/to/db.sqlite node scripts/import-atc.mjs atc.csv
 */
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { parse } from "csv-parse/sync";

const LEVEL_BY_LENGTH = new Map([
  [1, 1],
  [3, 2],
  [4, 3],
  [5, 4],
  [7, 5],
]);

const LEVEL_PARENT_LENGTH = new Map([
  [2, 1],
  [3, 3],
  [4, 4],
  [5, 5],
]);

const csvPath = path.resolve(process.argv[2] ?? "atc.csv");
const dbPath = path.resolve(process.env.DARANAMA_DB_PATH ?? ".data/daranama.sqlite");

if (!fs.existsSync(csvPath)) {
  console.error(`ATC CSV not found: ${csvPath}`);
  process.exit(1);
}

const buffer = fs.readFileSync(csvPath);
const text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
const records = parse(text, {
  columns: true,
  bom: true,
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true,
});

const byCode = new Map();
for (const record of records) {
  const code = String(record.atc_code ?? "").trim().toUpperCase();
  if (!code) continue;
  const level = LEVEL_BY_LENGTH.get(code.length);
  if (!level) {
    console.warn(`skip invalid ATC length: ${code}`);
    continue;
  }
  if (byCode.has(code)) {
    console.warn(`duplicate ATC code: ${code}`);
    continue;
  }
  byCode.set(code, {
    code,
    level,
    nameEn: String(record.atc_name ?? "").trim(),
    nameFa: String(record.atc_name_fa ?? "").trim(),
    ddd: String(record.ddd ?? "").trim(),
  });
}

let missingParents = 0;
for (const node of byCode.values()) {
  if (node.level === 1) {
    node.parentCode = null;
    continue;
  }
  const parentLength = LEVEL_PARENT_LENGTH.get(node.level);
  const parentCode = node.code.slice(0, parentLength);
  node.parentCode = parentCode;
  if (!byCode.has(parentCode)) missingParents += 1;
}

const pathCache = new Map();
function pathFor(code) {
  if (pathCache.has(code)) return pathCache.get(code);
  const node = byCode.get(code);
  if (!node) return [];
  const pathCodes = node.parentCode ? [...pathFor(node.parentCode), code] : [code];
  pathCache.set(code, pathCodes);
  return pathCodes;
}

for (const node of byCode.values()) {
  const pathCodes = pathFor(node.code);
  node.pathCodes = pathCodes.join("/");
  node.pathFa = pathCodes
    .map((code) => byCode.get(code)?.nameFa || code)
    .join(" › ");
}

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
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
  CREATE INDEX IF NOT EXISTS idx_atc_parent ON atc_nodes(parent_code);
  CREATE INDEX IF NOT EXISTS idx_atc_level ON atc_nodes(level);
`);

const insert = db.prepare(
  `INSERT INTO atc_nodes
    (code, parent_code, level, name_en, name_fa, ddd, path_codes, path_fa)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

const sorted = [...byCode.values()].sort(
  (a, b) => a.level - b.level || a.code.localeCompare(b.code),
);

db.exec("BEGIN IMMEDIATE");
try {
  db.exec("DELETE FROM atc_nodes");
  for (const node of sorted) {
    insert.run(
      node.code,
      node.parentCode,
      node.level,
      node.nameEn,
      node.nameFa,
      node.ddd,
      node.pathCodes,
      node.pathFa,
    );
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  try {
    db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  } catch {
    // optional
  }
  db.close();
}

const counts = {};
for (const node of sorted) counts[node.level] = (counts[node.level] ?? 0) + 1;
console.log(`ATC file: ${csvPath}`);
console.log(`Database: ${dbPath}`);
console.log(`Rows: ${sorted.length}`);
console.log(`Levels: ${JSON.stringify(counts)}`);
console.log(`Missing parent nodes: ${missingParents}`);
console.log("Done.");

import { createHash } from "node:crypto";
import { getDb } from "../db";

type IdentitySourceRow = {
  irc: string;
  gtin: string | null;
  generic_code: string | null;
  brand_owner_name: string | null;
  brand_owner_national_id: string | null;
  brand_name: string | null;
  display_name: string | null;
  dose: string | null;
  dosage_form_fa: string | null;
  dosage_form_en: string | null;
  route_fa: string | null;
  route_en: string | null;
  package_count: number | null;
  product_type: string | null;
  issuance_date: string | null;
  expiration_date: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_batch_id: number;
  price_rial: number | null;
  price_toman: number | null;
};

type PriceObservation = {
  irc: string;
  observed_at: string;
  batch_id: number;
  price_rial: number | null;
  price_toman: number | null;
  issuance_date: string | null;
};

export type IdentityGroup = {
  key: string;
  canonical: IdentitySourceRow;
  rows: IdentitySourceRow[];
  firstSeen: string;
  lastSeen: string;
  currentPriceRial: number | null;
  currentPriceToman: number | null;
  priceLastSeen: string | null;
  priceMissingLatest: number;
  confidence: "high" | "medium";
  history: PriceObservation[];
};

export type IdentityRebuildReport = {
  dryRun: boolean;
  products: number;
  identities: number;
  aliases: number;
  mergedGroups: number;
  mergedRows: number;
  maxAliases: number;
  noGtinIdentities: number;
  multiGtinGroups: number;
  withPrice: number;
  withoutPrice: number;
  priceObservations: number;
  duplicates: { key: string; aliases: number; ircs: string[] }[];
};

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedGtin(value: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function dateRank(value: string | null | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value : "";
}

export function identityKeyFor(row: IdentitySourceRow): string {
  const gtin = normalizedGtin(row.gtin);
  const generic = (row.generic_code ?? "").trim();
  const owner =
    (row.brand_owner_national_id ?? "").trim() || normalize(row.brand_owner_name);
  const pack = row.package_count ?? 0;
  const type = (row.product_type ?? "").trim();
  const brand = normalize(row.brand_name);

  // A branded product keeps its identity when it is re-registered with a new
  // GTIN/IRC. For unbranded generics, GTIN is the safer continuity key.
  if (brand) {
    return `b:${generic}|${owner}|${brand}|${normalize(row.dose)}|${normalize(
      row.dosage_form_en || row.dosage_form_fa,
    )}|${normalize(row.route_en || row.route_fa)}|${pack}|${type}`;
  }

  if (gtin) {
    return `g:${gtin}|${generic}|${owner}|${pack}|${type}`;
  }

  const parts = [
    generic,
    owner,
    normalize(row.brand_name) || normalize(row.display_name),
    normalize(row.dose),
    normalize(row.dosage_form_en) || normalize(row.dosage_form_fa),
    normalize(row.route_en || row.route_fa),
    String(pack),
    type,
  ];
  return `f:${createHash("sha1").update(parts.join("|")).digest("hex")}`;
}

function canonicalCompare(a: IdentitySourceRow, b: IdentitySourceRow): number {
  const aDate = dateRank(a.issuance_date);
  const bDate = dateRank(b.issuance_date);
  if (aDate !== bDate) return bDate.localeCompare(aDate);
  if (a.last_seen_at !== b.last_seen_at) return b.last_seen_at.localeCompare(a.last_seen_at);
  if (a.last_batch_id !== b.last_batch_id) return b.last_batch_id - a.last_batch_id;
  return a.irc.localeCompare(b.irc);
}

function observationCompare(a: PriceObservation, b: PriceObservation): number {
  if (a.observed_at !== b.observed_at) return b.observed_at.localeCompare(a.observed_at);
  const aDate = dateRank(a.issuance_date);
  const bDate = dateRank(b.issuance_date);
  if (aDate !== bDate) return bDate.localeCompare(aDate);
  if (a.batch_id !== b.batch_id) return b.batch_id - a.batch_id;
  return a.irc.localeCompare(b.irc);
}

function buildGroups(
  products: IdentitySourceRow[],
  historyByIrc: Map<string, PriceObservation[]>,
) {
  const groups = new Map<string, IdentitySourceRow[]>();
  for (const product of products) {
    const key = identityKeyFor(product);
    const list = groups.get(key);
    if (list) list.push(product);
    else groups.set(key, [product]);
  }

  const result: IdentityGroup[] = [];
  for (const [key, rows] of groups) {
    const sorted = [...rows].sort(canonicalCompare);
    const canonical = sorted[0];
    const firstSeen = sorted.reduce(
      (min, row) => (row.first_seen_at < min ? row.first_seen_at : min),
      sorted[0].first_seen_at,
    );
    const lastSeen = sorted.reduce(
      (max, row) => (row.last_seen_at > max ? row.last_seen_at : max),
      sorted[0].last_seen_at,
    );

    const observations = sorted
      .flatMap((row) => historyByIrc.get(row.irc) ?? [])
      .sort(observationCompare);
    const byDate = new Map<string, PriceObservation>();
    for (const observation of observations) {
      if (!byDate.has(observation.observed_at)) byDate.set(observation.observed_at, observation);
    }
    const history = [...byDate.values()].sort((a, b) =>
      a.observed_at.localeCompare(b.observed_at),
    );
    const latest = history.at(-1);

    const currentPriceRial = latest?.price_rial ?? canonical.price_rial;
    const currentPriceToman = latest?.price_toman ?? canonical.price_toman;

    result.push({
      key,
      canonical,
      rows: sorted,
      firstSeen,
      lastSeen,
      currentPriceRial,
      currentPriceToman,
      priceLastSeen: latest?.observed_at ?? null,
      priceMissingLatest: canonical.price_toman === null ? 1 : 0,
      confidence:
        new Set(rows.map((row) => normalizedGtin(row.gtin)).filter(Boolean)).size > 1
          ? "medium"
          : normalizedGtin(canonical.gtin)
            ? "high"
            : "medium",
      history,
    });
  }

  return result;
}

export function buildIdentityGroups(): IdentityGroup[] {
  const db = getDb();
  const products = db
    .prepare(
      `SELECT irc, gtin, generic_code, brand_owner_name, brand_owner_national_id,
              brand_name, display_name, dose, dosage_form_fa, dosage_form_en,
              route_fa, route_en, package_count, product_type, issuance_date,
              expiration_date, first_seen_at, last_seen_at, last_batch_id,
              price_rial, price_toman
       FROM products`,
    )
    .all() as unknown as IdentitySourceRow[];

  const historyRows = db
    .prepare(
      `SELECT h.irc, h.price_rial, h.price_toman, h.observed_at, h.batch_id,
              p.issuance_date
       FROM price_history h
       JOIN products p ON p.irc = h.irc
       WHERE h.price_toman IS NOT NULL
       ORDER BY h.observed_at ASC, h.batch_id ASC, h.id ASC`,
    )
    .all() as unknown as PriceObservation[];

  const historyByIrc = new Map<string, PriceObservation[]>();
  for (const row of historyRows) {
    const list = historyByIrc.get(row.irc);
    if (list) list.push(row);
    else historyByIrc.set(row.irc, [row]);
  }
  return buildGroups(products, historyByIrc);
}

export function rebuildIdentities({ dryRun = false } = {}): IdentityRebuildReport {
  const db = getDb();
  const groups = buildIdentityGroups();
  const aliases = groups.reduce((sum, group) => sum + group.rows.length, 0);
  const mergedGroups = groups.filter((group) => group.rows.length > 1);
  const withPrice = groups.filter((group) => group.currentPriceToman !== null).length;

  const report: IdentityRebuildReport = {
    dryRun,
    products: aliases,
    identities: groups.length,
    aliases,
    mergedGroups: mergedGroups.length,
    mergedRows: mergedGroups.reduce((sum, group) => sum + group.rows.length, 0),
    maxAliases: groups.reduce((max, group) => Math.max(max, group.rows.length), 0),
    noGtinIdentities: groups.filter((group) => !normalizedGtin(group.canonical.gtin)).length,
    multiGtinGroups: groups.filter(
      (group) => new Set(group.rows.map((row) => normalizedGtin(row.gtin)).filter(Boolean)).size > 1,
    ).length,
    withPrice,
    withoutPrice: groups.length - withPrice,
    priceObservations: groups.reduce((sum, group) => sum + group.history.length, 0),
    duplicates: mergedGroups.slice(0, 20).map((group) => ({
      key: group.key,
      aliases: group.rows.length,
      ircs: group.rows.slice(0, 8).map((row) => row.irc),
    })),
  };

  if (dryRun) return report;

  const now = new Date().toISOString();
  const insertIdentity = db.prepare(
    `INSERT INTO product_identity
       (identity_key, canonical_irc, gtin, generic_code, brand_owner_national_id,
        brand_norm, dose_norm, package_count, product_type, first_seen_at, last_seen_at,
        current_price_rial, current_price_toman, price_last_seen_at, price_missing_latest,
        aliases_count, confidence, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertAlias = db.prepare(
    `INSERT OR REPLACE INTO identity_alias
       (identity_id, irc, first_seen_at, last_seen_at, batch_id, is_current)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertHistory = db.prepare(
    `INSERT OR REPLACE INTO identity_price_history
       (identity_id, observed_at, irc, price_rial, price_toman, batch_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const setProduct = db.prepare(
    `UPDATE products
     SET identity_id = ?, is_current = ?, price_missing_latest = ?
     WHERE irc = ?`,
  );

  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec("DELETE FROM identity_alias");
    db.exec("DELETE FROM identity_price_history");
    db.exec("DELETE FROM product_identity");
    db.exec("UPDATE products SET identity_id = NULL, is_current = 1, price_missing_latest = 0");

    for (const group of groups) {
      const info = insertIdentity.run(
        group.key,
        group.canonical.irc,
        group.canonical.gtin,
        group.canonical.generic_code,
        group.canonical.brand_owner_national_id,
        normalize(group.canonical.brand_name),
        normalize(group.canonical.dose),
        group.canonical.package_count,
        group.canonical.product_type,
        group.firstSeen,
        group.lastSeen,
        group.currentPriceRial,
        group.currentPriceToman,
        group.priceLastSeen,
        group.priceMissingLatest,
        group.rows.length,
        group.confidence,
        now,
        now,
      );
      const identityId = Number(info.lastInsertRowid);
      for (const row of group.rows) {
        insertAlias.run(
          identityId,
          row.irc,
          row.first_seen_at,
          row.last_seen_at,
          row.last_batch_id,
          row.irc === group.canonical.irc ? 1 : 0,
        );
        setProduct.run(
          identityId,
          row.irc === group.canonical.irc ? 1 : 0,
          group.priceMissingLatest,
          row.irc,
        );
      }
      for (const observation of group.history) {
        insertHistory.run(
          identityId,
          observation.observed_at,
          observation.irc,
          observation.price_rial,
          observation.price_toman,
          observation.batch_id,
        );
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return report;
}

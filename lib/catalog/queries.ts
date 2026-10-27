import { getDb } from "@/lib/db";
import { faNum, faPrice } from "@/lib/format";
import { listBatches } from "@/lib/import/service";
import { normalizeSearch } from "@/lib/import/normalize";
import { CATEGORY_LIST, CATEGORY_BY_ID } from "./category-meta";
import type {
  CatalogAlias,
  CatalogCategory,
  CatalogCategoryDetail,
  CatalogCompany,
  CatalogCompanyDetail,
  CatalogHistoryPoint,
  CatalogHome,
  CatalogIngredient,
  CatalogIngredientDetail,
  CatalogProduct,
  CatalogProductDetail,
  CatalogSearchParams,
  CatalogSearchResult,
  CatalogSummary,
  ClassificationGroup,
  DrugIndexIngredient,
  DrugIndexRecord,
  MarketPrice,
} from "./types";

type SqlRow = Record<string, unknown>;

const SELECT = `
  p.irc, p.gtin, p.generic_code, p.generic_name_en, p.generic_name_fa,
  p.ingredient_key, p.ingredient_name_fa, p.ingredient_name_en,
  p.brand_name, p.display_name, p.brand_owner_name, p.brand_owner_national_id,
  p.producer_name, p.producer_country, p.dosage_form_fa, p.dosage_form_en,
  p.route_fa, p.route_en, p.drug_index_id, p.drug_index_fa, p.drug_index_en,
  p.dose, p.package_count, p.product_type, p.atc, p.category_id, p.category_name,
  p.issuance_date, p.expiration_date, p.first_seen_at, p.last_seen_at,
  p.is_current,
  i.id AS identity_id, i.canonical_irc,
  i.current_price_rial AS consumer_price_rial,
  i.current_price_toman AS consumer_price_toman,
  CASE WHEN p.package_count > 0 AND i.current_price_rial IS NOT NULL
       THEN i.current_price_rial * p.package_count END AS package_price_rial,
  CASE WHEN p.package_count > 0 AND i.current_price_toman IS NOT NULL
       THEN i.current_price_toman * p.package_count END AS package_price_toman,
  i.current_price_rial AS unit_price_rial,
  i.current_price_toman AS unit_price_toman,
  i.price_last_seen_at, i.price_missing_latest, i.aliases_count
`;

const PACKAGE_TOMAN =
  "CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapProduct(row: SqlRow): CatalogProduct {
  const consumerPriceRial = numberOrNull(row.consumer_price_rial);
  const consumerPriceToman = numberOrNull(row.consumer_price_toman);
  const packageCount = numberOrNull(row.package_count);
  const packagePriceRial = numberOrNull(row.package_price_rial);
  const packagePriceToman = numberOrNull(row.package_price_toman);

  return {
    identityId: Number(row.identity_id),
    irc: String(row.irc),
    canonicalIrc: String(row.canonical_irc),
    isCurrent: Number(row.is_current) === 1,
    aliasesCount: Number(row.aliases_count ?? 1),
    gtin: text(row.gtin),
    genericCode: text(row.generic_code),
    genericNameEn: text(row.generic_name_en),
    genericNameFa: text(row.generic_name_fa),
    ingredientKey: text(row.ingredient_key),
    ingredientNameFa: text(row.ingredient_name_fa),
    ingredientNameEn: text(row.ingredient_name_en),
    brandName: text(row.brand_name),
    displayName: text(row.display_name) ?? String(row.irc),
    brandOwnerName: text(row.brand_owner_name),
    brandOwnerNationalId: text(row.brand_owner_national_id),
    producerName: text(row.producer_name),
    producerCountry: text(row.producer_country),
    dosageFormFa: text(row.dosage_form_fa),
    dosageFormEn: text(row.dosage_form_en),
    routeFa: text(row.route_fa),
    routeEn: text(row.route_en),
    drugIndexId: text(row.drug_index_id),
    drugIndexFa: text(row.drug_index_fa),
    drugIndexEn: text(row.drug_index_en),
    dose: text(row.dose),
    packageCount,
    consumerPriceRial,
    consumerPriceToman,
    packagePriceRial,
    packagePriceToman,
    unitPriceRial: consumerPriceRial,
    unitPriceToman: consumerPriceToman,
    priceRial: packagePriceRial,
    priceToman: packagePriceToman,
    priceMissingLatest: Number(row.price_missing_latest) === 1,
    priceLastSeenAt: text(row.price_last_seen_at),
    productType: text(row.product_type),
    atc: text(row.atc),
    categoryId: text(row.category_id),
    categoryName: text(row.category_name),
    issuanceDate: text(row.issuance_date),
    expirationDate: text(row.expiration_date),
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
  };
}

function rows(sql: string, ...params: (string | number)[]): CatalogProduct[] {
  const db = getDb();
  return (db.prepare(sql).all(...params) as unknown as SqlRow[]).map(mapProduct);
}

export function getCatalogSummary(): CatalogSummary {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(CASE WHEN i.current_price_toman IS NOT NULL THEN 1 ELSE 0 END), 0) AS priced,
         COALESCE(SUM(CASE WHEN i.current_price_toman IS NULL THEN 1 ELSE 0 END), 0) AS noPrice,
         COALESCE(SUM(CASE WHEN p.product_type = '28' THEN 1 ELSE 0 END), 0) AS supplements,
         COUNT(DISTINCT p.ingredient_key) AS ingredients,
         COUNT(DISTINCT COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name)) AS companies,
         COUNT(DISTINCT p.category_id) AS categories,
         MAX(p.last_seen_at) AS lastSeen
       FROM products p
       JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1`,
    )
    .get() as {
    total: number;
    priced: number;
    noPrice: number;
    supplements: number;
    ingredients: number;
    companies: number;
    categories: number;
    lastSeen: string | null;
  };
  const records = (db.prepare(`SELECT COUNT(*) AS c FROM products`).get() as { c: number }).c;
  const aliases = (db.prepare(`SELECT COUNT(*) AS c FROM products WHERE is_current = 0`).get() as {
    c: number;
  }).c;
  const atcNodes = (db.prepare(`SELECT COUNT(*) AS c FROM atc_nodes`).get() as { c: number }).c;
  const lastBatch = listBatches(1)[0] ?? null;

  return {
    ...row,
    records,
    aliases,
    atcNodes,
    batches: listBatches(1).length
      ? (db.prepare(`SELECT COUNT(*) AS c FROM import_batches`).get() as { c: number }).c
      : 0,
    lastImportAt: lastBatch?.imported_at ?? null,
    lastFileName: lastBatch?.file_name ?? null,
  };
}

export function getCatalogCategories(): CatalogCategory[] {
  const db = getDb();
  const raw = db
    .prepare(
      `SELECT p.category_id AS id, MAX(p.category_name) AS name, COUNT(*) AS count,
              COUNT(DISTINCT p.ingredient_key) AS ingredients,
              MIN(i.current_price_toman) AS minPrice
       FROM products p
       JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.category_id IS NOT NULL
       GROUP BY p.category_id
       ORDER BY count DESC`,
    )
    .all() as unknown as {
    id: string;
    name: string | null;
    count: number;
    ingredients: number;
    minPrice: number | null;
  }[];

  return raw.map((row) => {
    const meta = CATEGORY_BY_ID.get(row.id);
    return {
      id: row.id,
      name: meta?.name ?? row.name ?? "سایر",
      shortName: meta?.shortName ?? row.name ?? "سایر",
      description: meta?.description ?? "طبقه‌بندی درمانی بر اساس ATC.",
      icon: meta?.icon ?? "pill",
      accent: meta?.accent ?? "blue",
      count: row.count,
      ingredients: row.ingredients,
      minPrice: row.minPrice,
    };
  });
}

export function getCatalogIngredients(limit = 16): CatalogIngredient[] {
  const db = getDb();
  const raw = db
    .prepare(
      `SELECT p.ingredient_key AS key, MAX(p.ingredient_name_fa) AS name,
              MAX(p.ingredient_name_en) AS nameEn, COUNT(*) AS count,
              COUNT(DISTINCT COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name)) AS brands,
              MIN(CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END) AS minPrice,
              MAX(CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END) AS maxPrice
       FROM products p
       JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.ingredient_key IS NOT NULL AND p.ingredient_key != ''
       GROUP BY p.ingredient_key
       ORDER BY count DESC, name ASC
       LIMIT ?`,
    )
    .all(limit) as unknown as CatalogIngredient[];
  return raw.map((row) => ({ ...row }));
}

export function getCatalogCompanies(limit = 8): CatalogCompany[] {
  const db = getDb();
  const raw = db
    .prepare(
      `SELECT COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name) AS id,
              MAX(p.brand_owner_name) AS name, COUNT(*) AS count,
              COUNT(DISTINCT p.producer_name) AS producerCount,
              COUNT(DISTINCT p.generic_code) AS genericCodes,
              SUM(CASE WHEN i.current_price_toman IS NOT NULL THEN 1 ELSE 0 END) AS pricedCount,
              MIN(CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END) AS minPrice,
              MAX(CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END) AS maxPrice
       FROM products p
       JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.brand_owner_name IS NOT NULL AND p.brand_owner_name != ''
       GROUP BY COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name)
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(limit) as unknown as CatalogCompany[];
  return raw.map((row) => ({ ...row }));
}

export function searchCatalog({
  q = "",
  category = "",
  company = "",
  productType = "",
  priced = "",
  form = "",
  min,
  max,
  page = 1,
  perPage = 12,
  sort = "default",
}: CatalogSearchParams): CatalogSearchResult {
  const db = getDb();
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(50, Math.max(5, perPage));
  const where = ["p.is_current = 1"];
  const params: (string | number)[] = [];

  const query = normalizeSearch(q);
  if (query) {
    where.push(`p.search_text LIKE ?`);
    params.push(`%${query}%`);
  }
  if (category) {
    where.push(`p.category_id = ?`);
    params.push(category);
  }
  if (company) {
    where.push(
      `COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name) = ?`,
    );
    params.push(company);
  }
  if (productType) {
    where.push(`p.product_type = ?`);
    params.push(productType);
  }
  if (priced === "1") {
    where.push(`i.current_price_toman IS NOT NULL`);
  }
  if (form) {
    where.push(`p.dosage_form_fa = ?`);
    params.push(form);
  }
  if (min !== undefined && Number.isFinite(min)) {
    where.push(`${PACKAGE_TOMAN} >= ?`);
    params.push(Math.floor(min));
  }
  if (max !== undefined && Number.isFinite(max)) {
    where.push(`${PACKAGE_TOMAN} <= ?`);
    params.push(Math.floor(max));
  }

  const whereSql = where.join(" AND ");
  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE ${whereSql}`,
    )
    .get(...params) as { count: number };
  const total = totalRow.count;
  const pages = Math.max(1, Math.ceil(total / safePerPage));
  const currentPage = Math.min(safePage, pages);

  const orderBy =
    sort === "price-asc"
      ? `${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC, p.display_name ASC`
      : sort === "price-desc"
        ? `${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} DESC, p.display_name ASC`
        : sort === "name"
          ? "p.display_name COLLATE NOCASE ASC"
          : sort === "newest"
            ? "p.first_seen_at DESC, p.last_seen_at DESC, p.display_name ASC"
            : `${PACKAGE_TOMAN} IS NULL, p.display_name ASC`;

  const data = rows(
    `SELECT ${SELECT}
     FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    ...params,
    safePerPage,
    (currentPage - 1) * safePerPage,
  );

  return { rows: data, total, page: currentPage, pages };
}

export function getCatalogProduct(irc: string): CatalogProductDetail | undefined {
  const db = getDb();
  const requested = rows(`SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id WHERE p.irc = ?`, irc)[0];
  if (!requested) return undefined;

  const archived = !requested.isCurrent;
  const product = archived
    ? rows(
        `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
         WHERE p.identity_id = ? AND p.is_current = 1`,
        requested.identityId,
      )[0] ?? requested
    : requested;

  const history = db
    .prepare(
      `SELECT observed_at, irc, price_rial, price_toman, batch_id
       FROM identity_price_history WHERE identity_id = ? ORDER BY observed_at ASC`,
    )
    .all(product.identityId) as unknown as {
    observed_at: string;
    irc: string;
    price_rial: number | null;
    price_toman: number;
    batch_id: number;
  }[];

  const alternatives = product.genericCode
    ? rows(
        `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
         WHERE p.is_current = 1 AND p.generic_code = ? AND p.identity_id != ?
         ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC
         LIMIT 8`,
        product.genericCode,
        product.identityId,
      )
    : rows(
        `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
         WHERE p.is_current = 1 AND p.ingredient_key = ? AND p.identity_id != ?
         ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC
         LIMIT 8`,
        product.ingredientKey ?? "",
        product.identityId,
      );

  const aliases = (
    db
      .prepare(
        `SELECT irc, is_current, first_seen_at, last_seen_at
         FROM identity_alias WHERE identity_id = ?
         ORDER BY is_current DESC, last_seen_at DESC`,
      )
      .all(product.identityId) as unknown as {
      irc: string;
      is_current: number;
      first_seen_at: string;
      last_seen_at: string;
    }[]
  ).map<CatalogAlias>((alias) => ({
    irc: alias.irc,
    isCurrent: Number(alias.is_current) === 1,
    firstSeenAt: alias.first_seen_at,
    lastSeenAt: alias.last_seen_at,
  }));

  return {
    product,
    requestedIrc: requested.irc,
    isArchived: archived,
    history: history.map((row) => {
      const packageCount = product.packageCount;
      const consumerRial = row.price_rial;
      const consumerToman = row.price_toman;
      const packageRial =
        packageCount && packageCount > 0 && consumerRial !== null
          ? consumerRial * packageCount
          : null;
      const packageToman =
        packageCount && packageCount > 0 && consumerToman !== null
          ? consumerToman * packageCount
          : null;
      return {
        observedAt: row.observed_at,
        irc: row.irc,
        consumerPriceRial: consumerRial,
        consumerPriceToman: consumerToman,
        packagePriceRial: packageRial,
        packagePriceToman: packageToman,
        unitPriceRial: consumerRial,
        unitPriceToman: consumerToman,
        priceRial: packageRial,
        priceToman: packageToman,
        batchId: row.batch_id,
      };
    }),
    alternatives,
    aliases,
  };
}

export function getCatalogHome(): CatalogHome {
  const db = getDb();
  const summary = getCatalogSummary();
  const topPriced = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE p.is_current = 1 AND ${PACKAGE_TOMAN} IS NOT NULL
     ORDER BY ${PACKAGE_TOMAN} DESC LIMIT 5`,
  );
  const topCheap = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE p.is_current = 1 AND ${PACKAGE_TOMAN} IS NOT NULL
     ORDER BY ${PACKAGE_TOMAN} ASC LIMIT 5`,
  );

  const observations = db
    .prepare(
      `SELECT identity_id, price_toman, observed_at
       FROM identity_price_history
       ORDER BY identity_id ASC, observed_at ASC`,
    )
    .all() as unknown as {
    identity_id: number;
    price_toman: number;
    observed_at: string;
  }[];
  const byIdentity = new Map<number, { previous: number; current: number }>();
  for (const observation of observations) {
    const item = byIdentity.get(observation.identity_id);
    if (!item) byIdentity.set(observation.identity_id, {
      previous: observation.price_toman,
      current: observation.price_toman,
    });
    else {
      item.previous = item.current;
      item.current = observation.price_toman;
    }
  }
  const changes = [...byIdentity.entries()]
    .filter(([, item]) => item.previous > 0 && item.current !== item.previous)
    .map(([identityId, item]) => ({
      identityId,
      previous: item.previous,
      current: item.current,
      changePct: ((item.current - item.previous) / item.previous) * 100,
    }))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5);

  const priceChanges = changes
    .map((change) => {
      const product = rows(
        `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
         WHERE p.identity_id = ? AND p.is_current = 1`,
        change.identityId,
      )[0];
      return product
        ? {
            product,
            previous: change.previous,
            current: change.current,
            changePct: change.changePct,
          }
        : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    summary,
    categories: getCatalogCategories(),
    ingredients: getCatalogIngredients(12),
    companies: getCatalogCompanies(5),
    topPriced,
    topCheap,
    priceChanges,
  };
}

export function getMarketPrice(irc: string): MarketPrice | undefined {
  const row = getDb()
    .prepare(
      `SELECT id, source, source_product_id, source_url, matched_irc,
              match_score, match_confidence, price_toman,
              original_price_toman, discount_percent, package_count,
              unit_price_toman, raw_name, raw_brand, raw_company, fetched_at
       FROM market_prices
       WHERE matched_irc = ?
       ORDER BY fetched_at DESC, id DESC
       LIMIT 1`,
    )
    .get(irc) as
    | {
        id: number;
        source: string;
        source_product_id: string;
        source_url: string | null;
        matched_irc: string;
        match_score: number;
        match_confidence: string;
        price_toman: number;
        original_price_toman: number | null;
        discount_percent: number | null;
        package_count: number | null;
        unit_price_toman: number | null;
        raw_name: string | null;
        raw_brand: string | null;
        raw_company: string | null;
        fetched_at: string;
      }
    | undefined;
  if (!row) return undefined;
  return {
    id: row.id,
    source: row.source,
    sourceProductId: row.source_product_id,
    sourceUrl: row.source_url,
    matchedIrc: row.matched_irc,
    matchScore: row.match_score,
    matchConfidence: row.match_confidence,
    priceToman: row.price_toman,
    originalPriceToman: row.original_price_toman,
    discountPercent: row.discount_percent,
    packageCount: row.package_count,
    unitPriceToman: row.unit_price_toman,
    rawName: row.raw_name,
    rawBrand: row.raw_brand,
    rawCompany: row.raw_company,
    fetchedAt: row.fetched_at,
  };
}

export function getDrugIndex(drugIndexId: string | null | undefined): DrugIndexRecord | undefined {
  const id = Number(drugIndexId);
  if (!Number.isFinite(id)) return undefined;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, en_name, fa_name, dosage_form_title, strength, route_title,
              atc_code, commission_date, persian_commission_date, canceled,
              cancellation_date, persian_cancellation_date, access_level,
              drug_type, narcotic_grade
       FROM drug_indexes WHERE id = ?`,
    )
    .get(id) as
    | {
        id: number;
        en_name: string | null;
        fa_name: string | null;
        dosage_form_title: string | null;
        strength: string | null;
        route_title: string | null;
        atc_code: string | null;
        commission_date: string | null;
        persian_commission_date: string | null;
        canceled: number;
        cancellation_date: string | null;
        persian_cancellation_date: string | null;
        access_level: string | null;
        drug_type: string | null;
        narcotic_grade: string | null;
      }
    | undefined;
  if (!row) return undefined;

  const ingredients = db
    .prepare(
      `SELECT id, substance_id, substance_name, cas_number, pubchem_cid,
              strength, strength_unit_en, molecule
       FROM drug_index_ingredients WHERE drug_index_id = ? ORDER BY id`,
    )
    .all(id) as unknown as {
    id: number;
    substance_id: number | null;
    substance_name: string | null;
    cas_number: string | null;
    pubchem_cid: number | null;
    strength: number | null;
    strength_unit_en: string | null;
    molecule: string | null;
  }[];

  return {
    id: row.id,
    enName: row.en_name,
    faName: row.fa_name,
    dosageFormTitle: row.dosage_form_title,
    strength: row.strength,
    routeTitle: row.route_title,
    atcCode: row.atc_code,
    commissionDate: row.commission_date,
    persianCommissionDate: row.persian_commission_date,
    canceled: Number(row.canceled) === 1,
    cancellationDate: row.cancellation_date,
    persianCancellationDate: row.persian_cancellation_date,
    accessLevel: row.access_level,
    drugType: row.drug_type,
    narcoticGrade: row.narcotic_grade,
    ingredients: ingredients.map<DrugIndexIngredient>((ingredient) => ({
      id: ingredient.id,
      substanceId: ingredient.substance_id,
      substanceName: ingredient.substance_name,
      casNumber: ingredient.cas_number,
      pubchemCid: ingredient.pubchem_cid,
      strength: ingredient.strength,
      strengthUnitEn: ingredient.strength_unit_en,
      molecule: ingredient.molecule,
    })),
  };
}

export function getDoseOptions(product: CatalogProduct): {
  drugIndexId: string;
  dose: string;
  irc: string;
  priceToman: number | null;
}[] {
  const db = getDb();
  const raw = db
    .prepare(
      `SELECT p.drug_index_id, p.dose, p.irc,
              CASE WHEN p.package_count > 0 THEN i.current_price_toman * p.package_count END AS package_price
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.ingredient_key = ? AND p.dosage_form_fa = ?
       ORDER BY p.dose ASC, package_price ASC`,
    )
    .all(product.ingredientKey ?? "", product.dosageFormFa ?? "") as unknown as {
    drug_index_id: string | null;
    dose: string | null;
    irc: string;
    package_price: number | null;
  }[];
  const seen = new Set<string>();
  return raw
    .filter((row) => {
      const key = row.drug_index_id || row.dose || row.irc;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((row) => ({
      drugIndexId: row.drug_index_id ?? "",
      dose: row.dose ?? "",
      irc: row.irc,
      priceToman: row.package_price,
    }));
}

export function getOtherDosageForms(product: CatalogProduct): {
  form: string;
  count: number;
  irc: string;
}[] {
  const db = getDb();
  const raw = db
    .prepare(
      `SELECT p.dosage_form_fa AS form, COUNT(*) AS count, MIN(p.irc) AS irc
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.ingredient_key = ?
         AND p.dosage_form_fa != ?
       GROUP BY p.dosage_form_fa
       ORDER BY count DESC`,
    )
    .all(product.ingredientKey ?? "", product.dosageFormFa ?? "") as unknown as {
    form: string;
    count: number;
    irc: string;
  }[];
  return raw;
}

export function getClassIngredients(product: CatalogProduct): {
  key: string;
  name: string;
  count: number;
  irc: string;
}[] {
  if (!product.atc) return [];
  const db = getDb();
  const prefix = product.atc.slice(0, 4);
  return db
    .prepare(
      `SELECT p.ingredient_key AS key, MAX(p.ingredient_name_fa) AS name,
              COUNT(*) AS count, MIN(p.irc) AS irc
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.atc LIKE ?
       GROUP BY p.ingredient_key
       ORDER BY count DESC
       LIMIT 20`,
    )
    .all(`${prefix}%`) as unknown as { key: string; name: string; count: number; irc: string }[];
}

export function getCatalogIngredient(
  key: string,
  atcPrefix = "",
): CatalogIngredientDetail | undefined {
  const decoded = decodeURIComponent(key);
  const where = ["p.is_current = 1", "p.ingredient_key = ?"];
  const params: (string | number)[] = [decoded];
  if (atcPrefix) {
    where.push("p.atc LIKE ?");
    params.push(`${atcPrefix.toUpperCase()}%`);
  }
  const products = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE ${where.join(" AND ")}
     ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC, p.display_name ASC`,
    ...params,
  );
  if (products.length === 0) {
    const exists = getDb()
      .prepare(`SELECT 1 FROM products WHERE ingredient_key = ? LIMIT 1`)
      .get(decoded);
    if (!exists) return undefined;
  }

  const owners = new Set(products.map((product) => product.brandOwnerNationalId ?? product.brandOwnerName).filter(Boolean));
  const producers = new Set(products.map((product) => product.producerName).filter(Boolean));
  const genericCodes = new Set(products.map((product) => product.genericCode).filter(Boolean));
  const drugIndexes = new Set(products.map((product) => product.drugIndexId).filter(Boolean));
  const prices = products.map((product) => product.packagePriceToman).filter((value): value is number => value !== null);
  const units = products.map((product) => product.unitPriceToman).filter((value): value is number => value !== null);
  const categories = [...new Set(products.map((product) => product.categoryName).filter(Boolean))] as string[];
  const first = products[0];

  const historyRows = getDb()
    .prepare(
      `SELECT p.irc, p.display_name, p.package_count, h.observed_at, h.price_toman
       FROM products p
       JOIN identity_price_history h ON h.identity_id = p.identity_id
       WHERE p.is_current = 1 AND p.ingredient_key = ?
       ${atcPrefix ? "AND p.atc LIKE ?" : ""}
       ORDER BY p.irc, h.observed_at ASC`,
    )
    .all(...(atcPrefix ? [decoded, `${atcPrefix.toUpperCase()}%`] : [decoded])) as unknown as {
    irc: string;
    display_name: string;
    package_count: number | null;
    observed_at: string;
    price_toman: number;
  }[];
  const historyByIrc = new Map<string, { irc: string; name: string; points: { observedAt: string; packagePriceToman: number }[] }>();
  for (const row of historyRows) {
    if (!row.package_count || row.package_count <= 0) continue;
    const entry = historyByIrc.get(row.irc) ?? {
      irc: row.irc,
      name: row.display_name,
      points: [],
    };
    entry.points.push({
      observedAt: row.observed_at,
      packagePriceToman: row.price_toman * row.package_count,
    });
    historyByIrc.set(row.irc, entry);
  }

  return {
    key: decoded,
    name: first?.ingredientNameFa ?? decoded,
    nameEn: first?.ingredientNameEn ?? null,
    products,
    history: [...historyByIrc.values()]
      .filter((item) => item.points.length > 1)
      .sort((a, b) => b.points.length - a.points.length)
      .slice(0, 6),
    stats: {
      count: products.length,
      brandOwners: owners.size,
      producers: producers.size,
      genericCodes: genericCodes.size,
      drugIndexes: drugIndexes.size,
      branded: products.filter((product) => Boolean(product.brandName)).length,
      unbranded: products.filter((product) => !product.brandName).length,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      minUnitPrice: units.length ? Math.min(...units) : null,
      maxUnitPrice: units.length ? Math.max(...units) : null,
      categories,
      firstSeen: products.reduce<string | null>((min, product) => (!min || product.firstSeenAt < min ? product.firstSeenAt : min), null),
      lastSeen: products.reduce<string | null>((max, product) => (!max || product.lastSeenAt > max ? product.lastSeenAt : max), null),
    },
  };
}

export function getClassificationGroups(): ClassificationGroup[] {
  const db = getDb();
  const roots = db
    .prepare(`SELECT code, name_fa, name_en FROM atc_nodes WHERE level = 1 ORDER BY code`)
    .all() as unknown as { code: string; name_fa: string | null; name_en: string | null }[];
  const categories = db
    .prepare(
      `SELECT code, parent_code, name_fa, name_en, path_codes
       FROM atc_nodes WHERE level = 3 ORDER BY code`,
    )
    .all() as unknown as {
    code: string;
    parent_code: string | null;
    name_fa: string | null;
    name_en: string | null;
    path_codes: string | null;
  }[];
  const counts = db
    .prepare(
      `SELECT substr(atc, 1, 4) AS code, COUNT(*) AS count,
              COUNT(DISTINCT ingredient_key) AS ingredients,
              MIN(CASE WHEN package_count > 0 THEN price_toman * package_count END) AS minPrice,
              MAX(CASE WHEN package_count > 0 THEN price_toman * package_count END) AS maxPrice
       FROM products
       WHERE is_current = 1 AND atc IS NOT NULL AND length(atc) >= 4
       GROUP BY substr(atc, 1, 4)`,
    )
    .all() as unknown as {
    code: string;
    count: number;
    ingredients: number;
    minPrice: number | null;
    maxPrice: number | null;
  }[];
  const countByCode = new Map(counts.map((row) => [row.code, row]));

  return roots.map((root) => ({
    code: root.code,
    name: root.name_fa ?? root.name_en ?? root.code,
    nameEn: root.name_en ?? root.code,
    categories: categories
      .filter((category) => (category.path_codes ?? "").split("/")[0] === root.code)
      .map((category) => {
        const count = countByCode.get(category.code);
        return {
          code: category.code,
          name: category.name_fa ?? category.name_en ?? category.code,
          nameEn: category.name_en ?? category.code,
          rootCode: root.code,
          rootName: root.name_fa ?? root.name_en ?? root.code,
          count: count?.count ?? 0,
          ingredients: count?.ingredients ?? 0,
          minPrice: count?.minPrice ?? null,
          maxPrice: count?.maxPrice ?? null,
        };
      }),
  }));
}

export function getCatalogCategoryDetail(code: string): CatalogCategoryDetail | undefined {
  const db = getDb();
  const node = db
    .prepare(`SELECT code, name_fa, name_en, path_codes FROM atc_nodes WHERE code = ?`)
    .get(code.toUpperCase()) as
    | { code: string; name_fa: string | null; name_en: string | null; path_codes: string | null }
    | undefined;
  if (!node) return undefined;
  const rootCode = (node.path_codes ?? node.code).split("/")[0];
  const root = db
    .prepare(`SELECT name_fa, name_en FROM atc_nodes WHERE code = ?`)
    .get(rootCode) as { name_fa: string | null; name_en: string | null } | undefined;
  const products = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE p.is_current = 1 AND p.atc LIKE ?
     ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC, p.display_name ASC`,
    `${node.code}%`,
  );
  const prices = products.map((product) => product.packagePriceToman).filter((value): value is number => value !== null);
  const ingredients = new Set(products.map((product) => product.ingredientKey).filter(Boolean));

  return {
    code: node.code,
    name: node.name_fa ?? node.name_en ?? node.code,
    nameEn: node.name_en ?? node.code,
    rootCode,
    rootName: root?.name_fa ?? root?.name_en ?? rootCode,
    count: products.length,
    ingredients: ingredients.size,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    products,
  };
}

export function getCatalogCompanyDetail(id: string): CatalogCompanyDetail | undefined {
  const db = getDb();
  const decoded = decodeURIComponent(id);
  const owner = db
    .prepare(
      `SELECT MAX(brand_owner_name) AS name FROM products
       WHERE is_current = 1 AND COALESCE(NULLIF(brand_owner_national_id, ''), brand_owner_name) = ?`,
    )
    .get(decoded) as { name: string | null } | undefined;
  const ownerName = owner?.name ?? decoded;
  const ownerProducts = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE p.is_current = 1 AND COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name) = ?
     ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC, p.display_name ASC`,
    decoded,
  );
  const producedProducts = rows(
    `SELECT ${SELECT} FROM products p JOIN product_identity i ON i.id = p.identity_id
     WHERE p.is_current = 1 AND p.producer_name = ?
     ORDER BY ${PACKAGE_TOMAN} IS NULL, ${PACKAGE_TOMAN} ASC, p.display_name ASC`,
    ownerName,
  );
  if (ownerProducts.length === 0 && producedProducts.length === 0) return undefined;

  const products = ownerProducts.length ? ownerProducts : producedProducts;
  const prices = products.map((product) => product.packagePriceToman).filter((value): value is number => value !== null);
  const ingredients = new Set(products.map((product) => product.ingredientKey).filter(Boolean));
  const genericCodes = new Set(products.map((product) => product.genericCode).filter(Boolean));

  return {
    id: decoded,
    name: ownerName,
    ownerProducts,
    producedProducts,
    stats: {
      total: products.length,
      ingredients: ingredients.size,
      genericCodes: genericCodes.size,
      priced: products.filter((product) => product.priceToman !== null).length,
      noPrice: products.filter((product) => product.priceToman === null).length,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
    },
  };
}

export function getCatalogSearchHits(query: string, limit = 3) {
  const q = normalizeSearch(query);
  if (!q) {
    return { drugs: [], ingredients: [], companies: [], categories: [] };
  }
  const products = searchCatalog({ q, perPage: Math.max(3, limit) });
  const drugs = products.rows.slice(0, limit).map((product) => ({
    kind: "drug" as const,
    id: product.irc,
    title: product.displayName,
    subtitle: [product.ingredientNameFa, product.brandOwnerName].filter(Boolean).join(" · "),
    meta: product.priceToman !== null ? faPrice(product.priceToman) : product.dosageFormFa ?? undefined,
    href: `/drug/${product.irc}`,
  }));

  const db = getDb();
  const ingredients = db
    .prepare(
      `SELECT p.ingredient_key AS id, MAX(p.ingredient_name_fa) AS name, COUNT(*) AS count,
              MIN(${PACKAGE_TOMAN}) AS minPrice
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.search_text LIKE ?
       GROUP BY p.ingredient_key ORDER BY count DESC LIMIT ?`,
    )
    .all(`%${q}%`, limit) as unknown as {
    id: string;
    name: string;
    count: number;
    minPrice: number | null;
  }[];
  const companies = db
    .prepare(
      `SELECT COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name) AS id,
              MAX(p.brand_owner_name) AS name, COUNT(*) AS count,
              MIN(${PACKAGE_TOMAN}) AS minPrice
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1 AND p.search_text LIKE ?
       GROUP BY COALESCE(NULLIF(p.brand_owner_national_id, ''), p.brand_owner_name)
       ORDER BY count DESC LIMIT ?`,
    )
    .all(`%${q}%`, limit) as unknown as {
    id: string;
    name: string;
    count: number;
    minPrice: number | null;
  }[];

  // When the query is a drug/ingredient, show categories of the matched
  // products with their minimum package price. This makes category results
  // useful for searches like "متفورمین" without requiring the user to know
  // the ATC category name.
  const matchedCategories = db
    .prepare(
      `SELECT p.category_id AS id, MAX(p.category_name) AS name, COUNT(*) AS count,
              MIN(${PACKAGE_TOMAN}) AS minPrice
       FROM products p JOIN product_identity i ON i.id = p.identity_id
       WHERE p.is_current = 1
         AND p.category_id IS NOT NULL AND p.category_id != ''
         AND p.search_text LIKE ?
       GROUP BY p.category_id
       HAVING MIN(${PACKAGE_TOMAN}) IS NOT NULL
       ORDER BY count DESC LIMIT ?`,
    )
    .all(`%${q}%`, limit) as unknown as {
    id: string;
    name: string;
    count: number;
    minPrice: number | null;
  }[];

  const staticCategoryHits = CATEGORY_LIST.filter((category) => {
    const haystack = normalizeSearch(`${category.name} ${category.shortName} ${category.description}`);
    return haystack.includes(q);
  }).map((category) => ({
    kind: "category" as const,
    id: category.id,
    title: category.name,
    subtitle: `${faCount(category.id)}`,
    meta: undefined,
    href: `/search?category=${category.id}`,
  }));

  const categoryHits = [
    ...matchedCategories.map((item) => ({
      kind: "category" as const,
      id: item.id,
      title: item.name || faCount(item.id),
      subtitle: `${faNum(item.count)} محصول`,
      meta: item.minPrice !== null ? `از ${faPrice(item.minPrice)}` : undefined,
      href: `/search?category=${item.id}`,
    })),
    ...staticCategoryHits.filter(
      (item) => !matchedCategories.some((matched) => matched.id === item.id),
    ),
  ]
    .sort((a, b) => {
      const aExact = normalizeSearch(a.title) === q ? 1 : 0;
      const bExact = normalizeSearch(b.title) === q ? 1 : 0;
      return bExact - aExact;
    })
    .slice(0, limit);

  return {
    drugs,
    categories: categoryHits,
    ingredients: ingredients.map((item) => ({
      kind: "ingredient" as const,
      id: item.id,
      title: item.name || item.id,
      subtitle: `${faNum(item.count)} محصول`,
      meta: item.minPrice !== null ? `از ${faPrice(item.minPrice)}` : undefined,
      href: `/search?q=${encodeURIComponent(item.name || item.id)}`,
    })),
    companies: companies.map((item) => ({
      kind: "company" as const,
      id: item.id,
      title: item.name,
      subtitle: `${faNum(item.count)} محصول`,
      meta: item.minPrice !== null ? `از ${faPrice(item.minPrice)}` : undefined,
      href: `/search?company=${encodeURIComponent(item.id)}`,
    })),
  };
}

function faCount(value: string): string {
  const category = CATEGORY_BY_ID.get(value);
  return category?.shortName ?? "دسته";
}

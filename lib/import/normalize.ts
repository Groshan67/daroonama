import { createHash } from "node:crypto";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";
import { faDigits, formatDose, productTypeLabel } from "@/lib/format";
import { mapAtcToCategory } from "./categories";

export type PriceUnit = "rial" | "toman";

export type RawCsvRow = Record<string, string>;

export type NormalizedProduct = {
  irc: string;
  gtin: string;
  fingerprint: string;
  rowHash: string;
  genericCode: string;
  genericNameEn: string;
  genericNameFa: string;
  ingredientKey: string;
  ingredientNameFa: string;
  ingredientNameEn: string;
  brandName: string;
  displayName: string;
  enName: string;
  brandOwnerName: string;
  brandOwnerNationalId: string;
  producerName: string;
  producerCountry: string;
  dosageFormFa: string;
  dosageFormEn: string;
  routeFa: string;
  routeEn: string;
  drugIndexId: string;
  drugIndexFa: string;
  drugIndexEn: string;
  dose: string;
  packageCount: number | null;
  priceRial: number | null;
  priceToman: number | null;
  unitPriceToman: number | null;
  status: number | null;
  statusLabel: string;
  issuanceDate: string;
  expirationDate: string;
  productType: string;
  atc: string;
  categoryId: string;
  categoryName: string;
  erx: string;
  sourceResponseAt: string;
  searchText: string;
  rawJson: string;
};

export type HeaderMap = {
  actual: Record<string, string>;
  missing: string[];
};

export type ParsedCsv = {
  rows: RawCsvRow[];
  headers: string[];
  delimiter: "," | ";" | "\t";
  repairedRows: number;
};

const FIELD_ALIASES: Record<string, string[]> = {
  irc: ["irc", "irccode"],
  enName: ["enname", "englishname", "nameen"],
  faName: ["faname", "persianname", "namefa"],
  genericCode: ["genericcode", "genericid"],
  genericEnName: ["genericenname", "genericnameen"],
  erx: ["erx"],
  erxTitle: ["erxtitle"],
  gtin: ["gtin"],
  atc: ["atc", "atccode"],
  brandOwnerCompanyName: ["brandownercompanyname", "brandowner"],
  brandOwnerNationalId: ["brandownernationalid", "brandownernationalcode"],
  producerCompanyName: ["producercompanyname", "producer", "manufacturer"],
  producerCountryName: ["producercountryname", "producercountry"],
  dosageFormId: ["dosageformid"],
  dosageFormFaName: ["dosageformfaname"],
  dosageFormEnName: ["dosageformenname"],
  routOfAdminId: ["routofadminid", "routeofadminid"],
  routOfAdminEnName: ["routofadminenname", "routeofadminenname"],
  routOfAdminFaName: ["routofadminfaname", "routeofadminfaname"],
  drugIndexId: ["drugindexid"],
  drugIndexEnName: ["drugindexenname"],
  drugIndexFaName: ["drugindexfaname"],
  dose: ["dose", "strength"],
  packageCount: ["packagecount", "packcount"],
  consumerPrice: ["consumerprice", "price"],
  status: ["status"],
  issuanceDate: ["issuancedate"],
  expirationDate: ["expirationdate"],
  productType: ["producttype"],
  responseDateTime: ["responsedatetime", "responsedate"],
};

export const REQUIRED_FIELDS = ["irc", "faName", "genericEnName"];

export const FIELD_ROLES: {
  key: string;
  label: string;
  role: string;
  note: string;
}[] = [
  { key: "irc", label: "IRC", role: "کلید یکتای بسته", note: "شناسه ۱۶ رقمی هر بسته/ثبت؛ کلید اصلی محصول." },
  { key: "gtin", label: "GTIN", role: "بارکد بسته", note: "یکتا نیست؛ برای جستجوی بارکد، نه کلید اصلی." },
  { key: "genericCode", label: "GenericCode", role: "کد خانواده ژنریک", note: "ترکیب ماده مؤثره + دوز + حجم + شکل؛ بدون بسته و برند." },
  { key: "genericEnName", label: "GenericEnName", role: "ماده مؤثره (انگلیسی)", note: "کلید اصلی Ingredient در نسخه واقعی." },
  { key: "drugIndexFaName", label: "DrugIndexFaName", role: "نام فارسی ماده مؤثره", note: "برای نمایش فارسی؛ در نمونه هم‌ارز GenericEnName است." },
  { key: "drugIndexId", label: "DrugIndexId", role: "خانواده دوز", note: "در نمونه به ازای دوزهای مختلف تغییر می‌کند؛ جایگزین Ingredient نیست." },
  { key: "atc", label: "ATC", role: "دسته درمانی", note: "برای گروه‌بندی و اتصال به دسته‌های فعلی استفاده می‌شود." },
  { key: "brandOwnerCompanyName", label: "BrandOwnerCompanyName", role: "صاحب برند / پروانه", note: "شرکت اصلی برای صفحه سازنده و جستجو." },
  { key: "brandOwnerNationalId", label: "BrandOwnerNationalId", role: "شناسه حقوقی برند", note: "کلید پایدار شرکت صاحب برند." },
  { key: "producerCompanyName", label: "ProducerCompanyName", role: "تولیدکننده", note: "کارخانه سازنده؛ جدا از صاحب برند نمایش داده شود." },
  { key: "dosageFormFaName", label: "DosageFormFaName", role: "شکل دارویی", note: "نمایش و فیلتر." },
  { key: "routOfAdminFaName", label: "RoutofAdminFaName", role: "مسیر مصرف", note: "خواص و فیلتر." },
  { key: "dose", label: "Dose", role: "دوز / غلظت", note: "برای گروه‌بندی خانواده محصول." },
  { key: "packageCount", label: "PackageCount", role: "تعداد در بسته", note: "برای قیمت هر واحد و مقایسه بسته‌ها." },
  { key: "consumerPrice", label: "ConsumerPrice", role: "قیمت مصرف‌کننده", note: "در نمونه به ریال؛ تبدیل به تومان با تقسیم بر ۱۰." },
  { key: "status", label: "Status", role: "وضعیت خام", note: "کد خام ذخیره می‌شود؛ معنای فعال/غیرفعال تأیید نشده و فعلاً تفسیر نمی‌شود." },
  { key: "productType", label: "ProductType", role: "نوع محصول", note: "22 دارو، 28 مکمل." },
  { key: "issuanceDate", label: "IssuanceDate", role: "تاریخ صدور", note: "تاریخ اعتبار ثبت؛ تاریخ بازنگری قیمت نیست." },
  { key: "expirationDate", label: "ExpirationDate", role: "تاریخ انقضا", note: "اعتبار ثبت/پروانه." },
  { key: "responseDateTime", label: "responseDateTime", role: "تاریخ استخراج", note: "مبنای snapshot ورودی، نه لزوماً تاریخ تغییر قیمت." },
  { key: "erx", label: "ERX", role: "کد نسخه الکترونیک", note: "در نمونه ۳۱ ردیف خالی؛ کلید اصلی نیست." },
];

function normalizeHeader(value: string): string {
  return value
    .replace(/\uFEFF/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function buildHeaderMap(headers: string[]): HeaderMap {
  const actual: Record<string, string> = {};
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    const found = headers.find((header) => aliases.includes(normalizeHeader(header)));
    if (found) actual[canonical] = found;
  }
  const missing = REQUIRED_FIELDS.filter((field) => !actual[field]);
  return { actual, missing };
}

function pick(row: RawCsvRow, headers: HeaderMap, canonical: string): string {
  const actual = headers.actual[canonical];
  if (!actual) return "";
  return clean(row[actual] ?? "");
}

function decodeBytes(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buffer);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return iconv.decode(buffer, "windows-1256");
  }
}

function detectDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  if (counts["\t"] > counts[","] && counts["\t"] >= counts[";"]) return "\t";
  if (counts[";"] > counts[","]) return ";";
  return ",";
}

export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const text = decodeBytes(buffer).replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const rows = parse(text, {
    columns: true,
    bom: true,
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as RawCsvRow[];
  let headers = rows.length ? Object.keys(rows[0]) : [];
  let repairedRows = 0;

  /**
   * Some weekly exports (e.g. A14050601.csv) contain an extra internal row-id
   * before IRC and a trailing empty header cell. csv-parse maps the values one
   * column to the left, so every field would otherwise be misread.
   */
  if (headers.length > 1 && headers[headers.length - 1] === "") {
    const named = headers.slice(0, -1);
    const repaired = rows.map((row) => {
      const firstValue = row[named[0]] ?? "";
      const trailingValue = row[""] ?? "";
      if (!trailingValue || !firstValue || /^\d{16}$/.test(firstValue)) return row;
      const fixed: RawCsvRow = {};
      named.forEach((key, index) => {
        const nextKey = named[index + 1];
        fixed[key] = clean(nextKey ? row[nextKey] : row[""]);
      });
      repairedRows += 1;
      return fixed;
    });
    headers = named;
    return { rows: repaired, headers, delimiter, repairedRows };
  }

  return { rows, headers, delimiter, repairedRows };
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function clean(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function digits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[^\d]/g, "");
}

function numberOrNull(value: string): number | null {
  const number = decimalOrNull(value);
  return number === null ? null : Math.trunc(number);
}

/**
 * ConsumerPrice may be exported as "75000.0". Stripping the decimal point
 * would inflate the price by 10x, so prices use a decimal-aware parser.
 */
function decimalOrNull(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isoDate(value: string): string {
  const cleaned = clean(value);
  if (!cleaned) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) return cleaned.slice(0, 10);
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  }
  return cleaned;
}

function statusMeta(value: string): { status: number | null; label: string } {
  const number = numberOrNull(value);
  // Status semantics are not confirmed by the source; keep the raw code and
  // do not interpret it as active/inactive.
  return { status: number, label: number === null ? "—" : `کد ${faDigits(number)}` };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const UNIT_BRACKETS = new Set([
  "iu",
  "u",
  "unit",
  "units",
  "mg",
  "mcg",
  "µg",
  "g",
  "kg",
  "ml",
  "l",
  "%",
  "mmol",
  "meq",
]);

function brandFrom(value: string): string {
  // The export puts the brand in the last bracket, immediately before the
  // manufacturer in angle brackets. Dose units such as [iU] also use brackets,
  // so we must not take the first one.
  const tail = /\[([^\]]+)\]\s*<[^>]*>\s*$/.exec(value);
  if (tail?.[1]) return clean(tail[1]);

  const brackets = [...value.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => clean(match[1]))
    .filter(Boolean)
    .filter((item) => !UNIT_BRACKETS.has(item.toLowerCase()))
    .filter((item) => !/^\d+([.,]\d+)?$/.test(item));

  return brackets.at(-1) ?? "";
}

function extractBrand(faName: string, enName: string): string {
  return brandFrom(faName) || brandFrom(enName);
}

function baseFaName(faName: string, ingredientFa: string, dose: string): string {
  const doseLabel = formatDose(dose);
  if (ingredientFa) return doseLabel ? `${ingredientFa} ${doseLabel}` : ingredientFa;
  const withoutBrand = faName.replace(/\[[^\]]*\]/g, "").replace(/<[^>]*>/g, "").trim();
  return withoutBrand || faName;
}

function hashProduct(product: Omit<NormalizedProduct, "rowHash">): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        irc: product.irc,
        priceToman: product.priceToman,
        status: product.status,
        displayName: product.displayName,
        brandOwner: product.brandOwnerName,
        producer: product.producerName,
        dose: product.dose,
        pack: product.packageCount,
        atc: product.atc,
        expiration: product.expirationDate,
        category: product.categoryId,
      }),
    )
    .digest("hex");
}

export function normalizeProduct(
  row: RawCsvRow,
  headers: HeaderMap,
  priceUnit: PriceUnit,
): NormalizedProduct {
  const irc = pick(row, headers, "irc");
  const faName = pick(row, headers, "faName");
  const enName = pick(row, headers, "enName");
  const genericEn = pick(row, headers, "genericEnName");
  const drugIndexFa = pick(row, headers, "drugIndexFaName");
  const drugIndexEn = pick(row, headers, "drugIndexEnName");
  const dose = pick(row, headers, "dose");
  const genericCode = pick(row, headers, "genericCode");
  const packageCountRaw = numberOrNull(pick(row, headers, "packageCount"));
  const packageCount = packageCountRaw && packageCountRaw > 0 ? packageCountRaw : null;
  const rawPrice = decimalOrNull(pick(row, headers, "consumerPrice"));
  // A zero price in the weekly export means "no price available", not a free drug.
  const validPrice = rawPrice !== null && rawPrice > 0 ? rawPrice : null;
  const priceRial = validPrice === null ? null : priceUnit === "rial" ? validPrice : validPrice * 10;
  const priceToman =
    validPrice === null
      ? null
      : priceUnit === "rial"
        ? Math.round(validPrice / 10)
        : validPrice;
  const unitPriceToman =
    priceToman !== null && packageCount ? Math.round(priceToman / packageCount) : null;
  const status = statusMeta(pick(row, headers, "status"));
  const productTypeNumber = decimalOrNull(pick(row, headers, "productType"));
  const productType =
    productTypeNumber === null ? "" : String(Math.trunc(productTypeNumber));
  const atc = pick(row, headers, "atc").toUpperCase();
  const category = mapAtcToCategory(atc);
  const ingredientFa = drugIndexFa || genericEn;
  const ingredientEn = genericEn || drugIndexEn;
  const ingredientKey =
    slugify(ingredientEn) ||
    (pick(row, headers, "drugIndexId") ? `drug-index-${pick(row, headers, "drugIndexId")}` : "") ||
    slugify(ingredientFa) ||
    `product-${irc}`;
  const brand = extractBrand(faName, enName);
  const brandOwnerName =
    pick(row, headers, "brandOwnerCompanyName") || pick(row, headers, "producerCompanyName");
  const brandOwnerNationalId = pick(row, headers, "brandOwnerNationalId");
  const producerName = pick(row, headers, "producerCompanyName") || brandOwnerName;
  // Supplements often carry a category-like Persian name (e.g. "آقایان").
  // Their real product name is EnName; show it together with the brand owner.
  const supplementDisplayName =
    productType === "28" && enName
      ? [enName, brandOwnerName].filter(Boolean).join(" · ")
      : "";
  const displayName =
    supplementDisplayName || brand || baseFaName(faName, ingredientFa, dose) || `محصول ${irc}`;
  const producerCountry = pick(row, headers, "producerCountryName");
  const fingerprintParts = [
    genericCode,
    packageCount ?? "",
    brandOwnerNationalId,
    brand || dose,
  ].filter(Boolean);
  const fingerprint = fingerprintParts.join("|") || irc;
  const sourceResponseAt = isoDate(pick(row, headers, "responseDateTime"));
  const searchText = normalizeSearch(
    [
      faName,
      enName,
      ingredientFa,
      ingredientEn,
      brand,
      brandOwnerName,
      producerName,
      atc,
      irc,
      pick(row, headers, "gtin"),
    ].join(" "),
  );

  const base: Omit<NormalizedProduct, "rowHash"> = {
    irc,
    gtin: pick(row, headers, "gtin"),
    fingerprint,
    genericCode,
    genericNameEn: ingredientEn,
    genericNameFa: ingredientFa,
    ingredientKey,
    ingredientNameFa: ingredientFa || "نامشخص",
    ingredientNameEn: ingredientEn,
    brandName: brand,
    displayName,
    enName,
    brandOwnerName,
    brandOwnerNationalId,
    producerName,
    producerCountry,
    dosageFormFa: pick(row, headers, "dosageFormFaName"),
    dosageFormEn: pick(row, headers, "dosageFormEnName"),
    routeFa: pick(row, headers, "routOfAdminFaName"),
    routeEn: pick(row, headers, "routOfAdminEnName"),
    drugIndexId: pick(row, headers, "drugIndexId"),
    drugIndexFa,
    drugIndexEn,
    dose,
    packageCount,
    priceRial,
    priceToman,
    unitPriceToman,
    status: status.status,
    statusLabel: status.label,
    issuanceDate: isoDate(pick(row, headers, "issuanceDate")),
    expirationDate: isoDate(pick(row, headers, "expirationDate")),
    productType,
    atc,
    categoryId: category.id,
    categoryName: category.name,
    erx: pick(row, headers, "erx"),
    sourceResponseAt,
    searchText,
    rawJson: JSON.stringify(row),
  };

  return { ...base, rowHash: hashProduct(base) };
}

export type NormalizeResult = {
  products: NormalizedProduct[];
  headers: HeaderMap;
  invalidRows: number;
  missingPrice: number;
};

export function normalizeRows(
  rows: RawCsvRow[],
  headers: HeaderMap,
  priceUnit: PriceUnit,
): NormalizeResult {
  const products: NormalizedProduct[] = [];
  let invalidRows = 0;
  let missingPrice = 0;
  for (const row of rows) {
    const product = normalizeProduct(row, headers, priceUnit);
    if (!product.irc) {
      invalidRows += 1;
      continue;
    }
    if (product.priceToman === null) missingPrice += 1;
    products.push(product);
  }
  return { products, headers, invalidRows, missingPrice };
}

export type ImportAnalysis = {
  rows: number;
  validRows: number;
  invalidRows: number;
  uniqueIrc: number;
  duplicateIrc: number;
  uniqueFingerprints: number;
  missingPrice: number;
  priceUnit: PriceUnit;
  price: { min: number; max: number; median: number } | null;
  ingredientCount: number;
  genericCodeCount: number;
  brandOwnerCount: number;
  producerCount: number;
  atcCount: number;
  statuses: { label: string; count: number }[];
  productTypes: { value: string; label: string; count: number }[];
  categories: { id: string; name: string; count: number }[];
  sourceDateRange: { from: string; to: string } | null;
  warnings: string[];
  samples: {
    irc: string;
    name: string;
    ingredient: string;
    company: string;
    producer: string;
    price: number | null;
    pack: number | null;
    status: string;
    category: string;
  }[];
  grouping: { title: string; field: string; use: string }[];
  headers: { key: string; label: string; role: string; note: string; detected: string | null }[];
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function analyzeProducts(
  products: NormalizedProduct[],
  priceUnit: PriceUnit,
  invalidRows: number,
  headers: HeaderMap,
): ImportAnalysis {
  const ircCounts = new Map<string, number>();
  const ingredients = new Set<string>();
  const genericCodes = new Set<string>();
  const brandOwners = new Set<string>();
  const producers = new Set<string>();
  const atcs = new Set<string>();
  const categories = new Map<string, { id: string; name: string; count: number }>();
  const statuses = new Map<string, number>();
  const productTypes = new Map<string, number>();
  const prices: number[] = [];
  const dates = new Set<string>();

  for (const product of products) {
    ircCounts.set(product.irc, (ircCounts.get(product.irc) ?? 0) + 1);
    ingredients.add(product.ingredientKey);
    if (product.genericCode) genericCodes.add(product.genericCode);
    if (product.brandOwnerName) brandOwners.add(product.brandOwnerNationalId || product.brandOwnerName);
    if (product.producerName) producers.add(product.producerName);
    if (product.atc) atcs.add(product.atc);
    const category = categories.get(product.categoryId) ?? {
      id: product.categoryId,
      name: product.categoryName,
      count: 0,
    };
    category.count += 1;
    categories.set(product.categoryId, category);
    statuses.set(product.statusLabel, (statuses.get(product.statusLabel) ?? 0) + 1);
    if (product.productType) {
      productTypes.set(product.productType, (productTypes.get(product.productType) ?? 0) + 1);
    }
    if (product.priceToman !== null) prices.push(product.priceToman);
    if (product.sourceResponseAt) dates.add(product.sourceResponseAt);
  }

  const duplicateIrc = [...ircCounts.values()].filter((count) => count > 1).length;
  const warnings: string[] = [];
  if (invalidRows > 0) warnings.push(`${invalidRows} ردیف بدون IRC معتبر کنار گذاشته می‌شود.`);
  if (duplicateIrc > 0) warnings.push(`${duplicateIrc} IRC تکراری در فایل وجود دارد؛ آخرین ردیف جایگزین می‌شود.`);
  if (products.length > 0 && products.every((product) => product.priceToman === null)) {
    warnings.push("هیچ قیمتی در فایل پیدا نشد؛ ورود قیمت و تاریخچه ممکن نیست.");
  } else if (products.filter((product) => product.priceToman === null).length > 0) {
    warnings.push(
      `${products.filter((product) => product.priceToman === null).length} ردیف قیمت خالی دارد و بدون قیمت ذخیره می‌شود.`,
    );
  }
  if (ingredients.size === 1 && products.length > 20) {
    warnings.push("این فایل فقط یک ماده مؤثره دارد؛ احتمالاً خروجی فیلترشده است، نه کل پایگاه.");
  }
  if (priceUnit === "rial") {
    warnings.push("قیمت‌ها با فرض «ریال» به تومان تبدیل می‌شوند (تقسیم بر ۱۰).");
  }
  if (categories.size === 1 && categories.has("other")) {
    warnings.push("ATC موجود با دسته‌های فعلی تطبیق داده نشد؛ همه در «سایر» قرار می‌گیرند.");
  }

  const sortedDates = [...dates].sort();
  return {
    rows: products.length + invalidRows,
    validRows: products.length,
    invalidRows,
    uniqueIrc: ircCounts.size,
    duplicateIrc,
    uniqueFingerprints: new Set(products.map((product) => product.fingerprint)).size,
    missingPrice: products.filter((product) => product.priceToman === null).length,
    priceUnit,
    price: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices), median: median(prices) }
      : null,
    ingredientCount: ingredients.size,
    genericCodeCount: genericCodes.size,
    brandOwnerCount: brandOwners.size,
    producerCount: producers.size,
    atcCount: atcs.size,
    statuses: [...statuses.entries()].map(([label, count]) => ({ label, count })),
    productTypes: [...productTypes.entries()].map(([value, count]) => ({
      value,
      label: productTypeLabel(value),
      count,
    })),
    categories: [...categories.values()].sort((a, b) => b.count - a.count),
    sourceDateRange:
      sortedDates.length > 0
        ? { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] }
        : null,
    warnings,
    samples: products.slice(0, 6).map((product) => ({
      irc: product.irc,
      name: product.displayName,
      ingredient: product.ingredientNameFa,
      company: product.brandOwnerName,
      producer: product.producerName,
      price: product.priceToman,
      pack: product.packageCount,
      status: product.statusLabel,
      category: product.categoryName,
    })),
    grouping: [
      {
        title: "Ingredient",
        field: "GenericEnName + DrugIndexFaName",
        use: "گروه اصلی برای صفحه ماده مؤثره؛ کلید یکسان‌سازی نام انگلیسی.",
      },
      {
        title: "خانواده محصول",
        field: "GenericCode",
        use: "مقایسه محصولات هم‌دوز و هم‌شکل، مستقل از برند و بسته.",
      },
      {
        title: "شرکت",
        field: "BrandOwnerCompanyName + BrandOwnerNationalId",
        use: "صاحب برند/پروانه؛ شرکت اصلی برای صفحه سازنده.",
      },
      {
        title: "تولیدکننده",
        field: "ProducerCompanyName",
        use: "کارخانه سازنده؛ فیلد جداگانه برای نمایش و فیلتر.",
      },
      {
        title: "دسته درمانی",
        field: "ATC",
        use: "اتصال به دسته‌های فعلی با نگاشت پیشوند ATC.",
      },
      {
        title: "کلید یکتا",
        field: "IRC",
        use: "کلید بسته؛ برای تاریخچه قیمت نسخه واقعی.",
      },
    ],
    headers: FIELD_ROLES.map((item) => ({
      ...item,
      detected: headers.actual[item.key] ?? null,
    })),
  };
}

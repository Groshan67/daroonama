import { faDigits } from "../format";
import { jalaliParts, jalaliYear, formatJalaliNumeric } from "../jalali";
import { CATEGORIES, COMPANIES, INGREDIENTS, REVISION_EVENTS } from "./seed";
import type {
  CategoryStats,
  CompanyStats,
  Drug,
  DrugSummary,
  Ingredient,
  PricePoint,
  Revision,
} from "./types";

const MONTHLY_DATES: string[] = (() => {
  const dates: string[] = [];
  const start = Date.UTC(2016, 3, 15);
  for (let i = 0; i <= 120; i += 1) {
    const d = new Date(start);
    d.setUTCMonth(d.getUTCMonth() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
})();

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundTo(value: number, step: number): number {
  return Math.max(step, Math.round(value / step) * step);
}

export function revisionLabel(iso: string): string {
  const { jy, jm } = jalaliParts(iso);
  return `${faDigits(jy)}.${faDigits(String(jm).padStart(2, "0"))}`;
}

function buildHistory(seed: number, finalPrice: number): { history: PricePoint[]; revisions: Revision[] } {
  const random = makeRandom(seed);
  const raw: number[] = [100];
  for (let i = 1; i <= 120; i += 1) {
    let next = raw[i - 1] * (1.006 + random() * 0.011);
    if (i % 12 === 0) {
      next *= 1.13 + random() * 0.23;
    }
    raw.push(next);
  }
  const scale = finalPrice / raw[raw.length - 1];
  const history: PricePoint[] = raw.map((value, index) => ({
    date: MONTHLY_DATES[index],
    price:
      index === raw.length - 1
        ? finalPrice
        : roundTo(value * scale, finalPrice >= 1_000_000 ? 1000 : 100),
  }));

  const revisions: Revision[] = [];
  for (let i = 12; i <= 120; i += 12) {
    const from = history[i - 1].price;
    const to = history[i].price;
    revisions.push({
      date: history[i].date,
      from,
      to,
      change: ((to - from) / from) * 100,
      note: i === 120 ? "بازنگری سالانه ۱۴۰۵" : "بازنگری سالانه قیمت",
    });
  }
  return { history, revisions };
}

const CODE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function buildDrug(ingredientId: string, indexInIngredient: number, globalIndex: number): Drug {
  const ingredient = INGREDIENTS.find((item) => item.id === ingredientId)!;
  const seed = hashString(`${ingredientId}-${indexInIngredient}`);
  const random = makeRandom(seed);
  const companyId = ingredient.makers[indexInIngredient % ingredient.makers.length] ?? "sina";
  const company = COMPANIES.find((item) => item.id === companyId) ?? COMPANIES[0];
  const strength = ingredient.strengths[indexInIngredient % ingredient.strengths.length];
  const strengthIndex = ingredient.strengths.indexOf(strength);
  const brand = ingredient.brands[indexInIngredient % ingredient.brands.length] || ingredient.name;
  const name = brand === ingredient.name ? `${ingredient.name} ${strength}` : brand;
  const baseCode = 1_000_000 + globalIndex * 7919;
  const code = `${baseCode}${CODE_LETTERS[globalIndex % CODE_LETTERS.length]}${1000 + ((globalIndex * 37) % 9000)}`;
  const strengthFactor = 1 + strengthIndex * 0.52;
  const companyFactor = 0.9 + ((indexInIngredient + globalIndex) % 4) * 0.05;
  const jitter = 0.94 + random() * 0.12;
  const price = roundTo(
    ingredient.basePrice * strengthFactor * companyFactor * jitter,
    ingredient.basePrice >= 300_000 ? 1000 : 100,
  );
  const { history, revisions } = buildHistory(seed, price);
  const lastRevision = revisions[revisions.length - 1];
  const prevPrice = lastRevision ? lastRevision.from : price;
  const statusRoll = random();
  const status: Drug["status"] =
    statusRoll < 0.045 ? "discontinued" : statusRoll < 0.13 ? "transitional" : "active";
  const unitPrice = price / ingredient.unitsPerPack;
  const monthlyCost = roundTo(unitPrice * ingredient.dailyDose * 30, 1000);
  const isOtc = ingredient.categoryId === "pain" || ingredient.categoryId === "vitamin";
  const views = Math.round(90 + random() * (globalIndex < 32 ? 16_000 : 5_400));

  return {
    code,
    name,
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    ingredientEn: ingredient.en,
    categoryId: ingredient.categoryId,
    companyId: company.id,
    companyName: company.name,
    form: ingredient.form,
    strength,
    pack: ingredient.pack,
    price,
    prevPrice,
    changePct: ((price - prevPrice) / prevPrice) * 100,
    unitPrice: Math.round(unitPrice),
    monthlyCost,
    unitsPerPack: ingredient.unitsPerPack,
    unit: ingredient.unit,
    status,
    isOtc,
    isGeneric: brand === ingredient.name || ingredient.brands.length < 2 || random() > 0.62,
    views,
    revisionDate: lastRevision?.date ?? MONTHLY_DATES[MONTHLY_DATES.length - 1],
    revisionLabel: revisionLabel(lastRevision?.date ?? MONTHLY_DATES[MONTHLY_DATES.length - 1]),
    atc: ingredient.atc,
    description: ingredient.description,
    history,
    revisions,
  };
}

export const DRUGS: Drug[] = (() => {
  const drugs: Drug[] = [];
  for (const ingredient of INGREDIENTS) {
    for (let i = 0; i < 4; i += 1) {
      drugs.push(buildDrug(ingredient.id, i, drugs.length));
    }
  }
  return drugs;
})();

export const DATASET_SIZE = DRUGS.length;

const drugByCode = new Map(DRUGS.map((drug) => [drug.code.toUpperCase(), drug]));
const ingredientById = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]));
const companyById = new Map(COMPANIES.map((company) => [company.id, company]));
const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export const PLATFORM = {
  name: "دارونما",
  totalItems: 12_315,
  datasetSize: DATASET_SIZE,
  updatedAt: "2026-04-15",
  updatedLabel: "۱۵ آوریل ۲۰۲۶",
  latestRevision: "۱۴۰۵.۰۱",
  eligibleNew: 726,
  transitional: 404,
  yearRange: "۱۳۹۵ تا ۱۴۰۵",
  source: "اسناد رسمی فهرست کدهای دارویی",
};

export const INGREDIENTS_WITH_STATS: Ingredient[] = INGREDIENTS.map((ingredient) => {
  const drugs = DRUGS.filter((drug) => drug.ingredientId === ingredient.id);
  const prices = drugs.map((drug) => drug.price);
  const latest = drugs.reduce(
    (acc, drug) => (drug.revisionDate > acc ? drug.revisionDate : acc),
    "2016-04-15",
  );
  return {
    ...ingredient,
    drugCount: drugs.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    brandCount: new Set(drugs.map((drug) => drug.name)).size,
    latestRevision: revisionLabel(latest),
  };
});

export const CATEGORIES_WITH_STATS: CategoryStats[] = CATEGORIES.map((category) => {
  const drugs = DRUGS.filter((drug) => drug.categoryId === category.id);
  const ingredients = INGREDIENTS.filter((ingredient) => ingredient.categoryId === category.id);
  return {
    ...category,
    drugCount: drugs.length,
    ingredientCount: ingredients.length,
    minPrice: drugs.length ? Math.min(...drugs.map((drug) => drug.price)) : 0,
  };
});

export const COMPANIES_WITH_STATS: CompanyStats[] = COMPANIES.map((company) => {
  const drugs = DRUGS.filter((drug) => drug.companyId === company.id);
  const prices = drugs.map((drug) => drug.price);
  return {
    ...company,
    drugCount: drugs.length,
    views: drugs.reduce((sum, drug) => sum + drug.views, 0),
    minPrice: prices.length ? Math.min(...prices) : 0,
    avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
  };
}).filter((company) => company.drugCount > 0);

export const TOP_DRUGS = [...DRUGS].sort((a, b) => b.views - a.views).slice(0, 6);
export const TOP_COMPANIES = [...COMPANIES_WITH_STATS].sort((a, b) => b.views - a.views).slice(0, 6);

export const HOME_CATEGORIES = CATEGORIES_WITH_STATS.filter((category) =>
  [
    "diabetes",
    "hypertension",
    "neuro",
    "respiratory",
    "cephalosporin",
    "oncology",
    "immuno",
    "gi",
  ].includes(category.id),
);

export const KEY_INGREDIENT_IDS = [
  "amlodipine",
  "losartan",
  "metformin",
  "atorvastatin",
  "omeprazole",
  "pantoprazole",
  "sertraline",
  "montelukast",
  "cefixime",
  "letrozole",
  "methotrexate",
  "levothyroxine",
];

export const KEY_INGREDIENTS = KEY_INGREDIENT_IDS.map(
  (id) => INGREDIENTS_WITH_STATS.find((ingredient) => ingredient.id === id)!,
);

export function getDrugByCode(code: string): Drug | undefined {
  return drugByCode.get(decodeURIComponent(code).toUpperCase());
}

export function getIngredient(id: string): Ingredient | undefined {
  return INGREDIENTS_WITH_STATS.find((ingredient) => ingredient.id === decodeURIComponent(id));
}

export function getCompany(id: string): CompanyStats | undefined {
  return COMPANIES_WITH_STATS.find((company) => company.id === decodeURIComponent(id));
}

export function getCategory(id: string): CategoryStats | undefined {
  return CATEGORIES_WITH_STATS.find((category) => category.id === decodeURIComponent(id));
}

export function getCategoryName(id: string): string {
  return categoryById.get(id)?.name ?? "دسته‌بندی";
}

export function getDrugsByIngredient(ingredientId: string): Drug[] {
  return DRUGS.filter((drug) => drug.ingredientId === ingredientId).sort(
    (a, b) => a.unitPrice - b.unitPrice,
  );
}

export function getDrugsByCompany(companyId: string): Drug[] {
  return DRUGS.filter((drug) => drug.companyId === companyId).sort((a, b) => b.views - a.views);
}

export function getDrugsByCategory(categoryId: string): Drug[] {
  return DRUGS.filter((drug) => drug.categoryId === categoryId).sort((a, b) => a.price - b.price);
}

export function getIngredientsByCategory(categoryId: string): Ingredient[] {
  return INGREDIENTS_WITH_STATS.filter((ingredient) => ingredient.categoryId === categoryId);
}

export function getRelatedIngredients(categoryId: string, excludeId: string, limit = 5): Ingredient[] {
  return INGREDIENTS_WITH_STATS.filter(
    (ingredient) => ingredient.categoryId === categoryId && ingredient.id !== excludeId,
  ).slice(0, limit);
}

export function getAlternativeDrugs(drug: Drug, limit = 5): Drug[] {
  return DRUGS.filter(
    (item) => item.ingredientId === drug.ingredientId && item.code !== drug.code,
  )
    .sort((a, b) => a.price - b.price)
    .slice(0, limit);
}

export function toSummary(drug: Drug): DrugSummary {
  const { history: _history, revisions: _revisions, ...summary } = drug;
  return summary;
}

export function getDrugSummaries(codes: string[]): DrugSummary[] {
  return codes
    .map((code) => getDrugByCode(code))
    .filter((drug): drug is Drug => Boolean(drug))
    .map(toSummary);
}

export function getPriceIndexSeries(): { year: number; index: number }[] {
  const byYear = new Map<number, number[]>();
  for (const drug of DRUGS) {
    const first = drug.history[0].price;
    const seen = new Set<number>();
    for (const point of drug.history) {
      const year = jalaliYear(point.date);
      if (seen.has(year)) continue;
      seen.add(year);
      const values = byYear.get(year) ?? [];
      values.push((point.price / first) * 100);
      byYear.set(year, values);
    }
  }
  return [...byYear.entries()]
    .map(([year, values]) => ({
      year,
      index: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => a.year - b.year);
}

export function getRevisionArchive() {
  const buckets = new Map<
    number,
    { year: number; revisions: number; drugs: Set<string>; changeSum: number; maxChange: number; latest: string }
  >();
  for (const drug of DRUGS) {
    for (const revision of drug.revisions) {
      const year = jalaliYear(revision.date);
      const bucket =
        buckets.get(year) ??
        {
          year,
          revisions: 0,
          drugs: new Set<string>(),
          changeSum: 0,
          maxChange: 0,
          latest: revision.date,
        };
      bucket.revisions += 1;
      bucket.drugs.add(drug.code);
      bucket.changeSum += revision.change;
      bucket.maxChange = Math.max(bucket.maxChange, revision.change);
      if (revision.date > bucket.latest) bucket.latest = revision.date;
      buckets.set(year, bucket);
    }
  }
  return [...buckets.values()]
    .map((bucket) => ({
      year: bucket.year,
      revisions: bucket.revisions,
      items: bucket.drugs.size,
      avgChange: bucket.changeSum / bucket.revisions,
      maxChange: bucket.maxChange,
      latest: bucket.latest,
      latestLabel: formatJalaliNumeric(bucket.latest),
    }))
    .sort((a, b) => b.year - a.year);
}

export { REVISION_EVENTS };

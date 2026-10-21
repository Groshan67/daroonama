import {
  CATEGORIES_WITH_STATS,
  COMPANIES_WITH_STATS,
  DRUGS,
  getCategoryName,
  INGREDIENTS_WITH_STATS,
} from "./data";
import type { Drug, SearchHit, SearchResults } from "./data/types";
import { faNum } from "./format";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/[ؤئ]/g, "ی")
    .replace(/[\u064b-\u0652\u0670]/g, "")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreDrug(drug: Drug, query: string, tokens: string[]): number {
  const code = drug.code.toLowerCase();
  const name = normalize(drug.name);
  const ingredient = normalize(drug.ingredientName);
  const ingredientEn = normalize(drug.ingredientEn);
  const company = normalize(drug.companyName);
  const category = normalize(getCategoryName(drug.categoryId));
  const form = normalize(`${drug.form} ${drug.strength} ${drug.pack}`);
  const haystack = `${name} ${ingredient} ${ingredientEn} ${company} ${category} ${form} ${code}`;

  if (code === query) return 1200;
  if (!tokens.every((token) => haystack.includes(token))) return 0;

  let score = 20;
  if (name === query) score += 560;
  else if (name.startsWith(query)) score += 420;
  else if (name.includes(query)) score += 320;

  if (ingredient === query) score += 300;
  else if (ingredient.startsWith(query)) score += 250;
  else if (ingredient.includes(query)) score += 190;

  if (ingredientEn.startsWith(query)) score += 170;
  if (code.includes(query)) score += 210;
  if (company.includes(query)) score += 120;
  if (category.includes(query)) score += 80;
  for (const token of tokens) {
    if (name.includes(token)) score += 16;
    if (ingredient.includes(token)) score += 10;
  }
  score += Math.min(60, Math.log10(drug.views + 1) * 14);
  return score;
}

export function searchAll(rawQuery: string, limitPerGroup = 5): SearchResults {
  const query = normalize(rawQuery);
  const tokens = query.split(" ").filter(Boolean);
  if (!query) {
    return {
      query: rawQuery,
      total: 0,
      drugs: [],
      ingredients: [],
      companies: [],
      categories: [],
    };
  }

  const scored = DRUGS.map((drug) => ({ drug, score: scoreDrug(drug, query, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.drug.views - a.drug.views);

  const drugs: SearchHit[] = scored.slice(0, limitPerGroup).map(({ drug }) => ({
    kind: "drug",
    id: drug.code,
    title: drug.name,
    subtitle: `${drug.ingredientName} · ${drug.strength}`,
    meta: `${drug.companyName} · ${drug.form}`,
    href: `/drug/${drug.code}`,
  }));

  const ingredients: SearchHit[] = INGREDIENTS_WITH_STATS.filter((ingredient) => {
    const haystack = `${normalize(ingredient.name)} ${normalize(ingredient.en)}`;
    return tokens.every((token) => haystack.includes(token));
  })
    .slice(0, limitPerGroup)
    .map((ingredient) => ({
      kind: "ingredient",
      id: ingredient.id,
      title: ingredient.name,
      subtitle: `${ingredient.en} · ${faNum(ingredient.drugCount)} قلم`,
      meta: getCategoryName(ingredient.categoryId),
      href: `/ingredient/${ingredient.id}`,
    }));

  const companies: SearchHit[] = COMPANIES_WITH_STATS.filter((company) => {
    const haystack = `${normalize(company.name)} ${normalize(company.nameEn)}`;
    return tokens.every((token) => haystack.includes(token));
  })
    .slice(0, limitPerGroup)
    .map((company) => ({
      kind: "company",
      id: company.id,
      title: company.name,
      subtitle: `${company.nameEn} · ${faNum(company.drugCount)} قلم`,
      meta: company.country,
      href: `/company/${company.id}`,
    }));

  const categories: SearchHit[] = CATEGORIES_WITH_STATS.filter((category) => {
    const haystack = normalize(`${category.name} ${category.description}`);
    return tokens.every((token) => haystack.includes(token));
  })
    .slice(0, limitPerGroup)
    .map((category) => ({
      kind: "category",
      id: category.id,
      title: category.name,
      subtitle: `${faNum(category.drugCount)} قلم · ${faNum(category.ingredientCount)} ماده مؤثره`,
      meta: "طبقه‌بندی اثر دارویی",
      href: `/category/${category.id}`,
    }));

  return {
    query: rawQuery,
    total: scored.length,
    drugs,
    ingredients,
    companies,
    categories,
  };
}

export type DrugFilters = {
  category?: string;
  company?: string;
  status?: string;
  form?: string;
  otc?: string;
  min?: number;
  max?: number;
  sort?: string;
};

export function filterDrugs(rawQuery: string, filters: DrugFilters = {}): Drug[] {
  const query = normalize(rawQuery);
  const tokens = query.split(" ").filter(Boolean);
  let results = query
    ? DRUGS.map((drug) => ({ drug, score: scoreDrug(drug, query, tokens) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.drug.views - a.drug.views)
        .map((item) => item.drug)
    : [...DRUGS].sort((a, b) => b.views - a.views);

  if (filters.category) results = results.filter((drug) => drug.categoryId === filters.category);
  if (filters.company) results = results.filter((drug) => drug.companyId === filters.company);
  if (filters.status) results = results.filter((drug) => drug.status === filters.status);
  if (filters.form) results = results.filter((drug) => drug.form === filters.form);
  if (filters.otc === "1") results = results.filter((drug) => drug.isOtc);
  if (filters.otc === "0") results = results.filter((drug) => !drug.isOtc);
  if (typeof filters.min === "number" && Number.isFinite(filters.min)) {
    results = results.filter((drug) => drug.price >= filters.min!);
  }
  if (typeof filters.max === "number" && Number.isFinite(filters.max)) {
    results = results.filter((drug) => drug.price <= filters.max!);
  }

  if (!query || filters.sort) {
    const sort = filters.sort ?? "views";
    results.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "change") return b.changePct - a.changePct;
      if (sort === "newest") return b.revisionDate.localeCompare(a.revisionDate);
      return b.views - a.views;
    });
  }
  return results;
}

export const DRUG_FORMS = [...new Set(DRUGS.map((drug) => drug.form))].sort((a, b) =>
  a.localeCompare(b, "fa"),
);

export const SEARCH_STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  transitional: "انتقالی",
  discontinued: "توقف تولید",
};

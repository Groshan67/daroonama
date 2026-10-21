import { getDb } from "@/lib/db";
import {
  getCatalogCategories,
  getCatalogCompanies,
  getCatalogCompanyDetail,
  getCatalogIngredient,
  getCatalogIngredients,
  getCatalogProduct,
  getCatalogSummary,
  searchCatalog,
} from "./catalog/queries";
import type { CatalogProduct } from "./catalog/types";
import { faNum, faPercent, faPrice, formatDose } from "./format";

export type AssistantDrug = {
  code: string;
  name: string;
  companyName: string;
  price: number;
  ingredientName: string;
};

export type AssistantAnswer = {
  answer: string;
  bullets?: string[];
  drugs?: AssistantDrug[];
  suggestions?: string[];
  links?: { label: string; href: string }[];
};

const MEDICAL_WORDS = [
  "مصرف",
  "عوارض",
  "دوز",
  "بخورم",
  "تجویز",
  "نسخه من",
  "بارداری",
  "شیردهی",
  "مصرف کنم",
];

const STOP_WORDS = new Set([
  "قیمت",
  "چقدر",
  "چنده",
  "چند",
  "است",
  "هست",
  "دارو",
  "داروی",
  "محصول",
  "محصولات",
  "بسته",
  "واحد",
  "تومان",
  "ریال",
  "ارزان",
  "ارزانترین",
  "ارزان‌ترین",
  "گران",
  "گرانترین",
  "گران‌ترین",
  "کدام",
  "کن",
  "بکن",
  "مقایسه",
  "لیست",
  "بده",
  "نمایش",
  "بیشترین",
  "کمترین",
  "افزایش",
  "کاهش",
  "اخیر",
  "آخرین",
  "روند",
  "تاریخچه",
  "برای",
  "از",
  "در",
  "به",
  "با",
  "و",
  "یا",
  "می",
  "خواهم",
  "میخوام",
  "لطفا",
  "لطفاً",
  "سلام",
  "خوبی",
  "تشکر",
  "ممنون",
  "قرص",
  "کپسول",
  "ترین",
  "هم",
  "ماده",
  "موثره",
  "مؤثره",
  "میلی",
  "گرم",
  "میلیگرم",
  "میلی‌گرم",
  "میلی لیتر",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function englishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function cleanQuery(question: string): string {
  return normalizeText(question)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token))
    .join(" ")
    .trim();
}

function toDrug(product: CatalogProduct): AssistantDrug | null {
  if (product.priceToman === null) return null;
  return {
    code: product.canonicalIrc,
    name: product.displayName,
    companyName: product.brandOwnerName ?? product.producerName ?? "—",
    price: product.priceToman,
    ingredientName: product.ingredientNameFa ?? "—",
  };
}

function toDrugs(products: CatalogProduct[], limit = 4): AssistantDrug[] {
  return products
    .map(toDrug)
    .filter((drug): drug is AssistantDrug => drug !== null)
    .slice(0, limit);
}

function findIngredient(question: string) {
  const q = normalizeText(question);
  const terms = q.split(" ").filter((term) => term.length >= 4 && !STOP_WORDS.has(term));
  let best: { ingredient: ReturnType<typeof getCatalogIngredients>[number]; score: number } | null = null;

  for (const ingredient of getCatalogIngredients(3000)) {
    const name = normalizeText(ingredient.name);
    const en = normalizeText(ingredient.nameEn ?? "");
    const base = name.split(/[/(]/)[0].trim();
    const names = [name, en, base].filter((value) => value.length >= 3);
    let score = 0;

    if (names.some((value) => value === q)) score = 1000;
    else if (names.some((value) => q.includes(value))) score = 700 + Math.max(...names.map((value) => value.length));
    else if (names.some((value) => value.includes(q))) score = 600 - Math.min(200, name.length);
    else {
      const match = terms
        .filter((term) => names.some((value) => value.includes(term)))
        .sort((a, b) => b.length - a.length)[0];
      if (match) score = 300 + match.length;
    }

    if (score > 0 && (!best || score > best.score)) best = { ingredient, score };
  }

  return best?.ingredient;
}

function findCompany(question: string) {
  const q = normalizeText(question);
  return [...getCatalogCompanies(3000)]
    .filter((company) => {
      const name = normalizeText(company.name);
      return name.length > 2 && q.includes(name);
    })
    .sort((a, b) => b.name.length - a.name.length)[0];
}

function findCategory(question: string) {
  const q = normalizeText(question);
  return [...getCatalogCategories()]
    .filter((category) => {
      const name = normalizeText(category.name);
      const short = normalizeText(category.shortName);
      return (name.length > 2 && q.includes(name)) || (short.length > 2 && q.includes(short));
    })
    .sort((a, b) => b.name.length - a.name.length)[0];
}

function findProducts(term: string): CatalogProduct[] {
  if (!term) return [];
  const candidates = [
    term,
    ...term
      .split(" ")
      .filter((token) => token.length >= 3)
      .sort((a, b) => b.length - a.length),
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    const priced = searchCatalog({ q: candidate, priced: "1", perPage: 10, sort: "default" }).rows;
    if (priced.length > 0) return priced;
    const all = searchCatalog({ q: candidate, perPage: 10, sort: "default" }).rows;
    if (all.length > 0) return all;
  }
  return [];
}

function summaryAnswer(): AssistantAnswer {
  const summary = getCatalogSummary();
  return {
    answer: `در پایگاه فعلی ${faNum(summary.total)} محصول جاری از ${faNum(summary.records)} رکورد خام وجود دارد. ${faNum(summary.priced)} محصول قیمت بسته معتبر دارند و ${faNum(summary.noPrice)} محصول بدون قیمت‌اند.`,
    bullets: [
      `${faNum(summary.ingredients)} ماده مؤثره`,
      `${faNum(summary.companies)} صاحب برند/تولیدکننده`,
      `${faNum(summary.supplements)} مکمل`,
      `${faNum(summary.atcNodes)} کد ATC`,
      summary.lastImportAt
        ? `آخرین ورود داده: ${summary.lastImportAt.slice(0, 10)}`
        : "تاریخ آخرین ورود داده ثبت نشده است.",
    ],
    links: [
      { label: "جستجوی دارو", href: "/search" },
      { label: "مواد مؤثره", href: "/ingredients" },
    ],
    suggestions: ["ارزان‌ترین متفورمین کدام است؟", "بیشترین افزایش قیمت اخیر", "چند محصول بدون قیمت داریم؟"],
  };
}

function priceConceptAnswer(): AssistantAnswer {
  return {
    answer:
      "در این پایگاه `ConsumerPrice` قیمت هر واحد است. قیمت بسته از حاصل‌ضرب آن در `PackageCount` به دست می‌آید و قیمت واحد همان `ConsumerPrice` است.",
    bullets: [
      "قیمت بسته = ConsumerPrice × PackageCount",
      "قیمت واحد = ConsumerPrice",
      "اگر PackageCount صفر یا نامشخص باشد، قیمت بسته «نامشخص» است.",
      "همه قیمت‌ها به تومان نمایش داده می‌شوند.",
    ],
    links: [{ label: "راهنمای داده‌ها", href: "/about" }],
  };
}

type ChangeRow = {
  code: string;
  name: string;
  company_name: string | null;
  package_count: number;
  old_price: number;
  new_price: number;
  pct: number;
  observed_at: string;
};

function recentChanges(direction: "up" | "down"): ChangeRow[] {
  const db = getDb();
  return db
    .prepare(
      `WITH ranked AS (
         SELECT identity_id, observed_at, price_toman,
                ROW_NUMBER() OVER (PARTITION BY identity_id ORDER BY observed_at DESC, irc DESC) AS rn
         FROM identity_price_history
       ),
       pairs AS (
         SELECT latest.identity_id, latest.observed_at,
                previous.price_toman AS old_price,
                latest.price_toman AS new_price,
                ((latest.price_toman - previous.price_toman) * 100.0 / previous.price_toman) AS pct
         FROM ranked latest
         JOIN ranked previous ON previous.identity_id = latest.identity_id AND previous.rn = 2
         WHERE latest.rn = 1 AND previous.price_toman > 0
           AND latest.price_toman <> previous.price_toman
       )
       SELECT p.irc AS code, p.display_name AS name, p.brand_owner_name AS company_name,
              p.package_count AS package_count, pairs.old_price, pairs.new_price, pairs.pct,
              pairs.observed_at
       FROM pairs
       JOIN products p ON p.identity_id = pairs.identity_id AND p.is_current = 1
       WHERE p.package_count > 0
       ORDER BY pairs.pct ${direction === "up" ? "DESC" : "ASC"}
       LIMIT 5`,
    )
    .all() as unknown as ChangeRow[];
}

function changeAnswer(direction: "up" | "down"): AssistantAnswer {
  const rows = recentChanges(direction);
  const label = direction === "up" ? "افزایش" : "کاهش";
  if (rows.length === 0) {
    return {
      answer: `در تاریخچه فعلی، تغییر قیمت قابل‌مقایسه‌ای برای ${label} ثبت نشده است.`,
      links: [{ label: "صفحه دارو", href: "/search" }],
    };
  }

  const bullets = rows.map((row) => {
    const oldPackage = row.old_price * row.package_count;
    const newPackage = row.new_price * row.package_count;
    return `${row.name} (${row.company_name ?? "—"}): از ${faPrice(oldPackage)} به ${faPrice(newPackage)} · ${faPercent(row.pct, true)}`;
  });

  return {
    answer: `بیشترین ${label} قیمت ثبت‌شده بین دو مشاهده اخیر: ${faNum(rows.length)} مورد برتر را می‌بینید.`,
    bullets,
    drugs: rows.map((row) => ({
      code: row.code,
      name: row.name,
      companyName: row.company_name ?? "—",
      price: row.new_price * row.package_count,
      ingredientName: "",
    })),
    links: [{ label: "تاریخچه و تغییرات", href: "/insights" }],
    suggestions: direction === "up" ? ["بیشترین کاهش قیمت اخیر"] : ["بیشترین افزایش قیمت اخیر"],
  };
}

function ingredientAnswer(question: string, key: string): AssistantAnswer {
  const detail = getCatalogIngredient(key);
  if (!detail) return fallbackAnswer();
  const priced = detail.products.filter((product) => product.priceToman !== null);
  const cheapest = priced[0];
  const expensive = priced[priced.length - 1];
  const wantsComparison = normalizeText(question).includes("مقایسه");

  const bullets = [
    `${faNum(detail.stats.count)} محصول جاری · ${faNum(detail.stats.brandOwners)} صاحب برند · ${faNum(detail.stats.genericCodes)} کد ژنریک`,
    detail.stats.minPrice !== null
      ? `کمترین قیمت بسته: ${faPrice(detail.stats.minPrice)}`
      : "قیمت بسته‌ای برای این ماده ثبت نشده است.",
    detail.stats.maxPrice !== null ? `بیشترین قیمت بسته: ${faPrice(detail.stats.maxPrice)}` : "",
    cheapest
      ? `ارزان‌ترین گزینه: ${cheapest.displayName} (${cheapest.brandOwnerName ?? "—"}) — ${faPrice(cheapest.priceToman!)}`
      : "",
    expensive && priced.length > 1
      ? `گران‌ترین گزینه: ${expensive.displayName} (${expensive.brandOwnerName ?? "—"}) — ${faPrice(expensive.priceToman!)}`
      : "",
  ].filter(Boolean);

  return {
    answer: wantsComparison
      ? `مقایسه ${detail.name}: ${faNum(detail.stats.count)} محصول، از ${detail.stats.minPrice !== null ? faPrice(detail.stats.minPrice) : "نامشخص"} تا ${detail.stats.maxPrice !== null ? faPrice(detail.stats.maxPrice) : "نامشخص"}.`
      : `درباره ${detail.name}: ${faNum(detail.stats.count)} محصول و ${faNum(detail.stats.brandOwners)} صاحب برند در پایگاه ثبت شده است. ارزان‌ترین قیمت بسته ${detail.stats.minPrice !== null ? faPrice(detail.stats.minPrice) : "نامشخص"} است.`,
    bullets,
    drugs: toDrugs(priced),
    links: [
      { label: `صفحه ${detail.name}`, href: `/ingredient/${encodeURIComponent(detail.key)}` },
      { label: "جستجوی همین ماده", href: `/search?q=${encodeURIComponent(detail.name)}` },
    ],
    suggestions: ["ارزان‌ترین گزینه این ماده", "بیشترین افزایش قیمت اخیر", "قیمت واحد چیست؟"],
  };
}

function productAnswer(product: CatalogProduct, candidates: CatalogProduct[]): AssistantAnswer {
  const detail = getCatalogProduct(product.canonicalIrc);
  const current = detail?.product ?? product;
  const packagePrice = current.priceToman;
  const unitPrice = current.unitPriceToman;
  const priceLine =
    packagePrice !== null
      ? `قیمت بسته ${faPrice(packagePrice)}${unitPrice !== null ? ` و قیمت هر واحد ${faPrice(unitPrice)}` : ""}.`
      : "قیمت بسته معتبری برای این محصول ثبت نشده است.";

  return {
    answer: `${current.displayName} از ${current.brandOwnerName ?? current.producerName ?? "—"}: ${priceLine}`,
    bullets: [
      `ماده مؤثره: ${current.ingredientNameFa ?? "—"}`,
      `دوز و شکل: ${formatDose(current.dose)} ${current.dosageFormFa ?? ""}`.trim(),
      `تعداد بسته: ${current.packageCount !== null ? faNum(current.packageCount) : "نامشخص"}`,
      `کد ATC: ${current.atc ?? "—"} · IRC: ${current.canonicalIrc}`,
    ],
    drugs: toDrugs(candidates.length > 1 ? candidates : [current]),
    links: [
      { label: "صفحه دارو", href: `/drug/${current.canonicalIrc}` },
      ...(current.ingredientKey
        ? [{ label: "محصولات هم‌ماده", href: `/ingredient/${encodeURIComponent(current.ingredientKey)}` }]
        : []),
    ],
    suggestions: ["محصولات هم‌ماده را مقایسه کن", "بیشترین افزایش قیمت اخیر", "قیمت واحد چیست؟"],
  };
}

function companyAnswer(question: string): AssistantAnswer | null {
  const company = findCompany(question);
  if (!company) return null;
  const detail = getCatalogCompanyDetail(company.id);
  if (!detail) return null;
  const products = (detail.ownerProducts.length ? detail.ownerProducts : detail.producedProducts).filter(
    (product) => product.priceToman !== null,
  );

  return {
    answer: `${detail.name}: ${faNum(detail.stats.total)} محصول، ${faNum(detail.stats.ingredients)} ماده مؤثره و ${faNum(detail.stats.priced)} محصول قیمت‌دار.`,
    bullets: [
      detail.stats.minPrice !== null ? `کمترین قیمت بسته: ${faPrice(detail.stats.minPrice)}` : "قیمت بسته ثبت نشده است.",
      detail.stats.maxPrice !== null ? `بیشترین قیمت بسته: ${faPrice(detail.stats.maxPrice)}` : "",
      `تعداد کد ژنریک: ${faNum(detail.stats.genericCodes)}`,
    ].filter(Boolean),
    drugs: toDrugs(products),
    links: [{ label: `صفحه ${detail.name}`, href: `/company/${encodeURIComponent(detail.id)}` }],
  };
}

function categoryAnswer(question: string): AssistantAnswer | null {
  const category = findCategory(question);
  if (!category) return null;
  const products = searchCatalog({
    category: category.id,
    priced: "1",
    perPage: 4,
    sort: "price-asc",
  }).rows;

  return {
    answer: `دسته ${category.name}: ${faNum(category.count)} محصول و ${faNum(category.ingredients)} ماده مؤثره.`,
    bullets: [
      category.minPrice !== null ? `کمترین قیمت بسته: ${faPrice(category.minPrice)}` : "قیمت بسته ثبت نشده است.",
      `دسته‌بندی: ${category.shortName}`,
    ].filter(Boolean),
    drugs: toDrugs(products),
    links: [
      { label: `جستجو در ${category.name}`, href: `/search?category=${encodeURIComponent(category.id)}` },
      { label: "همه دسته‌ها", href: "/categories" },
    ],
  };
}

function fallbackAnswer(): AssistantAnswer {
  return {
    answer:
      "نتیجه مشخصی پیدا نکردم. نام دارو، ماده مؤثره، شرکت یا کد IRC را بنویسید؛ یا از نمونه‌سؤال‌های پیشنهادی استفاده کنید.",
    suggestions: [
      "ارزان‌ترین متفورمین کدام است؟",
      "قیمت استراموکس ۱۸ میلی‌گرم",
      "بیشترین افزایش قیمت اخیر",
      "چند محصول بدون قیمت داریم؟",
    ],
    links: [{ label: "جستجوی دارو", href: "/search" }],
  };
}

export function answerQuestion(question: string): AssistantAnswer {
  const raw = normalizeText(question);
  if (!raw) {
    return {
      answer: "سؤال خود را بنویسید تا بر اساس داده‌های واقعی قیمت، محصولات هم‌ماده و آمار پایگاه پاسخ دهم.",
      suggestions: getAssistantSuggestions(),
    };
  }

  if (["سلام", "درود", "خوبی", "ممنون", "تشکر"].some((word) => raw.includes(word))) {
    return {
      answer: "سلام! آماده‌ام درباره قیمت بسته و واحد، محصولات هم‌ماده، شرکت‌ها و آمار پایگاه پاسخ دهم. چه دارویی مد نظرتان است؟",
      suggestions: getAssistantSuggestions(),
    };
  }

  if (MEDICAL_WORDS.some((word) => raw.includes(normalizeText(word)))) {
    return {
      answer:
        "این دستیار فقط داده‌های قیمت و اطلاعات پایگاه را تحلیل می‌کند و درباره مصرف، دوز، عوارض یا انتخاب درمان نظر نمی‌دهد. برای تصمیم درمانی با پزشک یا داروساز مشورت کنید.",
      suggestions: ["قیمت این دارو چقدر است؟", "محصولات هم‌ماده را مقایسه کن", "ارزان‌ترین گزینه چیست؟"],
    };
  }

  if (
    (raw.includes("چند") || raw.includes("تعداد") || raw.includes("آمار")) &&
    (raw.includes("محصول") || raw.includes("دارو") || raw.includes("ماده") || raw.includes("شرکت") || raw.includes("مکمل") || raw.includes("بدون قیمت"))
  ) {
    return summaryAnswer();
  }

  if (
    (raw.includes("قیمت بسته") || raw.includes("قیمت واحد")) &&
    (raw.includes("چیست") || raw.includes("چگونه") || raw.includes("فرمول") || raw.includes("محاسبه"))
  ) {
    return priceConceptAnswer();
  }

  if (raw.includes("قیمت") && (raw.includes("افزایش") || raw.includes("کاهش") || raw.includes("تغییر"))) {
    return changeAnswer(raw.includes("کاهش") ? "down" : "up");
  }

  if (raw.includes("شرکت") || raw.includes("سازنده") || raw.includes("صاحب برند")) {
    const answer = companyAnswer(question);
    if (answer) return answer;
  }

  if (raw.includes("دسته") || raw.includes("طبقه") || raw.includes("گروه درمانی")) {
    const answer = categoryAnswer(question);
    if (answer) return answer;
  }

  const ingredient = findIngredient(question);
  if (ingredient) {
    return ingredientAnswer(question, ingredient.key);
  }

  const irc = englishDigits(question).match(/\b\d{10,}\b/)?.[0];
  if (irc) {
    const detail = getCatalogProduct(irc);
    if (detail) return productAnswer(detail.product, detail.alternatives);
  }

  const term = cleanQuery(question);
  const products = findProducts(term);
  if (products.length > 0) {
    return productAnswer(products[0], products);
  }

  if (term) {
    return {
      answer: `برای «${term}» محصولی در دیتابیس پیدا نکردم. املای نام دارو یا ماده مؤثره را بررسی کنید یا از جستجوی کامل استفاده کنید.`,
      links: [{ label: `جستجوی «${term}»`, href: `/search?q=${encodeURIComponent(term)}` }],
      suggestions: getAssistantSuggestions(),
    };
  }

  return fallbackAnswer();
}

export function getAssistantSuggestions(): string[] {
  return [
    "ارزان‌ترین متفورمین کدام است؟",
    "قیمت استراموکس ۱۸ میلی‌گرم",
    "محصولات هم‌ماده آتورواستاتین",
    "بیشترین افزایش قیمت اخیر",
    "چند محصول بدون قیمت داریم؟",
  ];
}

export function getAssistantMeta() {
  const summary = getCatalogSummary();
  return {
    datasetSize: summary.total,
    categoryCount: summary.categories,
    companyCount: summary.companies,
    pricedCount: summary.priced,
    lastSeen: summary.lastSeen,
  };
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductTable } from "@/components/catalog/product-table";
import {
  getCatalogCategories,
  getCatalogSummary,
  searchCatalog,
} from "@/lib/catalog/queries";
import { faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type RawParams = Record<string, string | string[] | undefined>;

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Boolean(
    param(params.q) || param(params.type) || param(params.category) || Number(param(params.page)) > 1,
  );
  return seoMetadata({
    title: "نرخ دارو ۱۴۰۵ | استعلام قیمت داروهای ایرانی و خارجی",
    description:
      "نرخ دارو و استعلام قیمت بیش از ۲۱ هزار محصول قیمت‌دار؛ جستجوی قیمت بسته و واحد، مقایسه داروهای ایرانی و خارجی و مشاهده تاریخ آخرین به‌روزرسانی.",
    path: "/drug-prices",
    keywords: [
      "نرخ دارو",
      "نرخ دارو ۱۴۰۵",
      "استعلام قیمت دارو",
      "قیمت دارو",
      "قیمت داروهای ایرانی",
      "قیمت داروهای خارجی",
      "لیست قیمت دارو",
    ],
    noindex: filtered,
  });
}

export default async function DrugPricesPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const q = param(params.q).slice(0, 80);
  const typeParam = param(params.type);
  const productType = typeParam === "drug" ? "22" : typeParam === "supplement" ? "28" : "";
  const category = param(params.category);
  const sortParam = param(params.sort);
  const sort =
    sortParam === "price-asc" || sortParam === "price-desc" || sortParam === "newest"
      ? sortParam
      : "default";
  const page = Math.max(1, Number(param(params.page)) || 1);

  const summary = getCatalogSummary();
  const categories = getCatalogCategories();
  const result = searchCatalog({
    q,
    category,
    productType,
    priced: "1",
    page,
    perPage: 24,
    sort,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / 24));
  const lastUpdate = summary.lastImportAt ? formatJalali(summary.lastImportAt) : "—";

  const faq = [
    {
      question: "نرخ دارو در این صفحه چگونه به‌دست می‌آید؟",
      answer:
        "قیمت بسته از ضرب ConsumerPrice در PackageCount و قیمت واحد از ConsumerPrice محاسبه می‌شود. منبع، آخرین فایل رسمی واردشده به دیتابیس است.",
    },
    {
      question: "تفاوت قیمت رسمی و قیمت بازار چیست؟",
      answer:
        "قیمت رسمی از فایل فهرست دارویی می‌آید. قیمت بازار داروکده فقط برای برخی مکمل‌ها و در صورت نبود قیمت رسمی با برچسب جداگانه نمایش داده می‌شود.",
    },
    {
      question: "چطور قیمت یک داروی خاص را استعلام کنم؟",
      answer:
        "نام دارو، ماده مؤثره یا کد IRC را در جستجوی همین صفحه وارد کنید؛ نتیجه شامل قیمت بسته، قیمت واحد و صفحه جزئیات محصول است.",
    },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: "https://groshan.ir" },
      { "@type": "ListItem", position: 2, name: "نرخ دارو", item: "https://groshan.ir/drug-prices" },
    ],
  };

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": "https://groshan.ir/#drug-price-dataset",
    name: "فهرست قیمت داروهای ایران",
    alternateName: "Iran Drug Price Database",
    description:
      "داده‌های قیمت بسته و واحد محصولات دارویی ایران بر پایه فهرست رسمی کدهای دارویی (IRC)، شامل ماده مؤثره، کد ژنریک، ATC و تاریخچه قیمت.",
    url: "https://groshan.ir/drug-prices",
    license: "https://groshan.ir/about",
    keywords: [
      "قیمت دارو",
      "نرخ دارو",
      "فهرست دارویی ایران",
      "کد IRC",
      "ATC",
      "ماده مؤثره",
    ],
    inLanguage: "fa-IR",
    spatialCoverage: { "@type": "Place", name: "Iran" },
    temporalCoverage: "2026-01-01/2026-12-31",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "دارونما",
      url: "https://groshan.ir",
    },
    variableMeasured: ["ConsumerPrice", "PackageCount", "قیمت بسته", "قیمت واحد"],
    distribution: {
      "@type": "DataDownload",
      name: "CSV قیمت بسته و واحد داروها",
      contentUrl: "https://groshan.ir/data/drug-prices",
      encodingFormat: "text/csv",
    },
  };

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "نرخ دارو" }]} />

      <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-brand" />
            {faNum(summary.priced)} محصول قیمت‌دار · آخرین به‌روزرسانی {lastUpdate}
          </p>
          <h1 className="mt-2 text-balance text-[27px] font-extrabold leading-[1.5] tracking-tight text-ink sm:text-[34px]">
            نرخ دارو و استعلام قیمت داروهای ایران
          </h1>
          <p className="mt-2 max-w-[780px] text-[12px] leading-6 text-muted sm:text-[12.5px]">
            قیمت بسته و واحد داروهای ایرانی و خارجی را جستجو و مقایسه کنید. این صفحه فهرست
            قیمت‌های واقعی دیتابیس است؛ برای مقایسه دقیق‌تر از ابزار مقایسه استفاده کنید.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="کل محصولات" value={faNum(summary.total)} />
          <Stat label="قیمت‌دار" value={faNum(summary.priced)} />
          <Stat label="مواد مؤثره" value={faNum(summary.ingredients)} />
          <Stat label="شرکت‌ها" value={faNum(summary.companies)} />
        </div>
      </div>

      <form action="/drug-prices" className="surface-card mt-5 flex flex-col gap-2 p-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            name="q"
            defaultValue={q}
            placeholder="نام دارو، ماده مؤثره، شرکت یا کد IRC…"
            className="h-11 w-full rounded-lg border border-line bg-white ps-10 pe-3 text-[12px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
          />
        </label>
        <select name="category" defaultValue={category} className="field h-11 sm:w-[190px]">
          <option value="">همه دسته‌ها</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input type="hidden" name="type" value={typeParam} />
        <button type="submit" className="btn-primary h-11 justify-center">
          استعلام قیمت
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "", label: "همه" },
            { value: "drug", label: "دارو" },
            { value: "supplement", label: "مکمل" },
          ].map((item) => (
            <Link
              key={item.value}
              href={`/drug-prices?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(category ? { category } : {}),
                ...(item.value ? { type: item.value } : {}),
                ...(sort !== "default" ? { sort } : {}),
              }).toString()}`}
              className={`rounded-full border px-3 py-1.5 text-[10px] transition ${
                typeParam === item.value
                  ? "border-[#b7d3f3] bg-[#eef5fe] font-semibold text-brand-dark"
                  : "border-line bg-white text-muted hover:border-[#c8dcf2]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: "default", label: "پیش‌فرض" },
            { value: "price-asc", label: "ارزان‌ترین" },
            { value: "price-desc", label: "گران‌ترین" },
            { value: "newest", label: "جدیدترین" },
          ].map((item) => (
            <Link
              key={item.value}
              href={`/drug-prices?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(category ? { category } : {}),
                ...(typeParam ? { type: typeParam } : {}),
                ...(item.value !== "default" ? { sort: item.value } : {}),
              }).toString()}`}
              className={`rounded-full border px-2.5 py-1 text-[9.5px] ${
                sort === item.value
                  ? "border-[#c8dcf2] bg-[#f5f9ff] font-semibold text-brand"
                  : "border-line bg-white text-faint"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
            <div>
              <h2 className="text-[13px] font-bold text-ink">فهرست نرخ دارو</h2>
              <p className="mt-0.5 text-[9.5px] text-faint">
                {faNum(result.total)} نتیجه · صفحه {faNum(page)} از {faNum(totalPages)}
              </p>
            </div>
            <Link href="/compare" className="inline-flex items-center gap-1 text-[10px] font-medium text-brand">
              مقایسه قیمت دارو
              <ChevronLeft className="h-3 w-3" />
            </Link>
          </div>
          <ProductTable products={result.rows} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-line/70 px-4 py-3 text-[10px]">
              <PageLink
                disabled={page <= 1}
                href={pageHref({ q, type: typeParam, category, sort, page: page - 1 })}
                label="قبلی"
              />
              <span className="text-faint">
                {faNum(page)} / {faNum(totalPages)}
              </span>
              <PageLink
                disabled={page >= totalPages}
                href={pageHref({ q, type: typeParam, category, sort, page: page + 1 })}
                label="بعدی"
              />
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="text-[12px] font-bold text-ink">دسته‌های پرجستجو</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {categories.slice(0, 10).map((item) => (
                <Link
                  key={item.id}
                  href={`/drug-prices?category=${encodeURIComponent(item.id)}`}
                  className="rounded-full border border-line bg-white px-2 py-1 text-[9px] text-muted hover:border-[#c8dcf2] hover:text-brand"
                >
                  {item.shortName}
                </Link>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-[#dce9f7] bg-[#f5f9ff] p-4">
            <h2 className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              مقایسه هوشمند
            </h2>
            <p className="mt-1.5 text-[9.5px] leading-5 text-muted">
              دو ماده مؤثره را انتخاب کنید و قیمت بسته و واحد محصولاتشان را کنار هم ببینید.
            </p>
            <Link href="/compare" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-brand">
              رفتن به مقایسه
              <ChevronLeft className="h-3 w-3" />
            </Link>
          </section>
          <section className="rounded-xl border border-line bg-white/70 p-4">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1b8663]" />
              منبع و روش
            </h2>
            <p className="mt-1 text-[9px] leading-5 text-faint">
              قیمت‌ها از فایل رسمی فهرست دارویی خوانده می‌شوند. قیمت بسته = ConsumerPrice ×
              PackageCount و قیمت واحد = ConsumerPrice.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Link href="/about" className="text-[9px] font-medium text-brand">
                درباره داده‌ها
              </Link>
              <a
                href="/data/drug-prices"
                className="text-[9px] font-medium text-brand"
                download
              >
                دریافت CSV
              </a>
            </div>
          </section>
        </aside>
      </div>

      <section className="surface-card mt-5 p-5">
        <h2 className="text-[16px] font-bold text-ink">پرسش‌های متداول نرخ دارو</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-xl border border-line bg-surface-soft p-3">
              <summary className="cursor-pointer text-[10.5px] font-semibold text-ink-soft">
                {item.question}
              </summary>
              <p className="mt-2 text-[9.5px] leading-5 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            breadcrumbSchema,
            datasetSchema,
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]),
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-2.5">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num mt-1 text-[14px] font-extrabold text-ink">{value}</p>
    </div>
  );
}

function pageHref({
  q,
  type,
  category,
  sort,
  page,
}: {
  q: string;
  type: string;
  category: string;
  sort: string;
  page: number;
}) {
  return `/drug-prices?${new URLSearchParams({
    ...(q ? { q } : {}),
    ...(type ? { type } : {}),
    ...(category ? { category } : {}),
    ...(sort !== "default" ? { sort } : {}),
    page: String(page),
  }).toString()}`;
}

function PageLink({ href, label, disabled }: { href: string; label: string; disabled: boolean }) {
  if (disabled) return <span className="text-faint/40">{label}</span>;
  return (
    <Link href={href} className="text-brand hover:underline">
      {label}
    </Link>
  );
}

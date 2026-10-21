import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RealTypeBadge } from "@/components/home/real-sections";
import {
  getCatalogCategories,
  getCatalogCompanies,
  getCatalogSummary,
  searchCatalog,
} from "@/lib/catalog/queries";
import { faNum, faPrice, formatDose } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "جستجوی دارو | جستجو بر اساس نام، ماده مؤثره، IRC و ATC",
  description:
    "جستجوی سریع در بیش از ۴۴٬۶۰۰ محصول دارویی و مکمل؛ بر اساس نام تجاری، ماده مؤثره، شرکت، کد IRC، کد ژنریک یا ATC.",
  path: "/search",
  keywords: ["جستجوی دارو", "جستجوی قیمت دارو", "کد IRC", "کد ژنریک", "ATC"],
  noindex: true,
});

const PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "default", label: "پیش‌فرض" },
  { value: "price-asc", label: "ارزان‌ترین" },
  { value: "price-desc", label: "گران‌ترین" },
  { value: "newest", label: "جدیدترین" },
  { value: "name", label: "نام" },
];

type RawParams = Record<string, string | string[] | undefined>;

function param(params: RawParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildHref(values: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "" && value !== 0) search.set(key, String(value));
  }
  const query = search.toString();
  return `/search${query ? `?${query}` : ""}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const q = param(params, "q").trim();
  const category = param(params, "category");
  const company = param(params, "company");
  const productType = param(params, "type");
  const priced = param(params, "priced");
  const min = Number(param(params, "min")) || undefined;
  const max = Number(param(params, "max")) || undefined;
  const sort = param(params, "sort") || "default";
  const page = Math.max(1, Number(param(params, "page")) || 1);

  const summary = getCatalogSummary();
  const categories = getCatalogCategories();
  const companies = getCatalogCompanies(8);
  const results = searchCatalog({
    q,
    category,
    company,
    productType,
    priced,
    min,
    max,
    page,
    perPage: PER_PAGE,
    sort,
  });

  const activeFilters: { key: string; label: string; value: string }[] = [];
  if (category) {
    activeFilters.push({
      key: "category",
      label: categories.find((item) => item.id === category)?.name ?? "دسته",
      value: category,
    });
  }
  if (company) {
    activeFilters.push({ key: "company", label: companies.find((item) => item.id === company)?.name ?? "شرکت", value: company });
  }
  if (productType) {
    activeFilters.push({ key: "type", label: productType === "28" ? "مکمل" : "دارو", value: productType });
  }
  if (priced) activeFilters.push({ key: "priced", label: "فقط دارای قیمت", value: priced });
  if (min) activeFilters.push({ key: "min", label: `از ${faPrice(min)} تومان`, value: String(min) });
  if (max) activeFilters.push({ key: "max", label: `تا ${faPrice(max)} تومان`, value: String(max) });

  const values = {
    q,
    category,
    company,
    type: productType,
    priced,
    min: min ? String(min) : "",
    max: max ? String(max) : "",
    sort,
  };

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "جستجو" }]} />
      <div className="max-w-[860px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-teal" />
          جستجو در {faNum(summary.total)} محصول جاری
        </p>
        <h1 className="mt-1.5 text-[24px] font-extrabold tracking-tight text-ink sm:text-[28px]">
          جستجوی دارو
        </h1>
        <p className="mt-1.5 max-w-[720px] text-[12px] leading-6 text-muted">
          با نام محصول، ماده مؤثره، شرکت، کد IRC یا ATC جستجو کنید. نتایج بر اساس هویت محصول
          یکتاسازی شده‌اند؛ IRCهای قدیمی به محصول جاری متصل می‌شوند.
        </p>

        <form action="/search" method="get" role="search" className="relative mt-4 max-w-[680px]">
          {company && <input type="hidden" name="company" value={company} />}
          {category && <input type="hidden" name="category" value={category} />}
          {productType && <input type="hidden" name="type" value={productType} />}
          {priced && <input type="hidden" name="priced" value={priced} />}
          {min && <input type="hidden" name="min" value={min} />}
          {max && <input type="hidden" name="max" value={max} />}
          {sort !== "default" && <input type="hidden" name="sort" value={sort} />}
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="نام دارو، ماده مؤثره، شرکت یا کد IRC…"
            aria-label="جستجوی دارو"
            className="h-11 w-full rounded-xl border border-line bg-white ps-10 pe-[92px] text-[13px] text-ink shadow-[0_1px_2px_rgba(17,42,74,0.03)] outline-none transition placeholder:text-faint focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
          />
          <button
            type="submit"
            className="absolute end-1.5 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-brand-dark"
          >
            <Search className="h-3.5 w-3.5" />
            جستجو
          </button>
        </form>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="surface-card sticky top-[84px] p-4">
            <div className="mb-3.5 flex items-center gap-2 border-b border-line/70 pb-2.5">
              <SlidersHorizontal className="h-4 w-4 text-brand" strokeWidth={1.9} />
              <h2 className="text-[12px] font-bold text-ink">فیلترها</h2>
              <span className="ms-auto text-[9px] text-faint">{faNum(results.total)} نتیجه</span>
            </div>
            <FilterForm values={values} categories={categories} />
          </div>
        </aside>

        <div className="min-w-0">
          <details className="surface-card mb-4 p-3 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[12px] font-semibold text-ink-soft">
              <SlidersHorizontal className="h-4 w-4 text-brand" />
              فیلتر و مرتب‌سازی
              <span className="ms-auto text-[10px] font-normal text-faint">{faNum(activeFilters.length)} فیلتر فعال</span>
            </summary>
            <div className="mt-3 border-t border-line/70 pt-3">
              <FilterForm values={values} categories={categories} />
            </div>
          </details>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-[11.5px] text-muted">
              {q ? (
                <>
                  <strong className="num font-semibold text-ink">{faNum(results.total)}</strong> نتیجه برای «
                  <span className="font-semibold text-ink-soft">{q}</span>»
                </>
              ) : (
                <>
                  <strong className="num font-semibold text-ink">{faNum(results.total)}</strong> محصول
                </>
              )}
            </p>
            <div className="ms-auto flex items-center gap-1">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref({ ...values, sort: option.value, page: undefined })}
                  className={`rounded-md px-2 py-1 text-[10px] transition-colors ${
                    sort === option.value
                      ? "bg-[#eaf2fe] font-semibold text-brand-dark"
                      : "text-faint hover:bg-surface-tint hover:text-ink-soft"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={buildHref({ ...values, [filter.key]: undefined, page: undefined })}
                  className="inline-flex items-center gap-1 rounded-full border border-[#cfe0f5] bg-[#f3f8ff] py-1 pe-1.5 ps-2.5 text-[10px] text-brand-dark transition hover:border-[#aac9ea]"
                >
                  {filter.label}
                  <X className="h-3 w-3 opacity-60" />
                </Link>
              ))}
              <Link href="/search" className="px-1.5 text-[10px] text-faint underline decoration-dotted underline-offset-4 hover:text-ink">
                پاک کردن همه
              </Link>
            </div>
          )}

          {results.rows.length === 0 ? (
            <div className="surface-card flex flex-col items-center px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tint text-faint">
                <Search className="h-5 w-5" />
              </span>
              <h2 className="mt-3 text-[14px] font-bold text-ink">نتیجه‌ای پیدا نشد</h2>
              <p className="mt-1 max-w-sm text-[11.5px] leading-6 text-muted">
                عبارت دیگری را امتحان کنید یا فیلترها را بردارید. جستجو با نام ماده مؤثره معمولاً
                نتایج کامل‌تری دارد.
              </p>
              <Link href="/search" className="mt-3 text-[11.5px] font-medium text-brand hover:text-brand-dark">
                حذف فیلترها
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.rows.map((product) => (
                <article
                  key={product.irc}
                  className="surface-card group p-3.5 transition-all duration-200 hover:border-[#cfe0f2] hover:shadow-lift sm:p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/drug/${product.canonicalIrc}`}
                          className="text-[14px] font-bold leading-6 text-ink transition-colors hover:text-brand-dark"
                        >
                          {product.displayName}
                        </Link>
                        <RealTypeBadge value={product.productType} />
                        {product.priceMissingLatest && product.priceToman !== null && (
                          <span className="rounded bg-[#fff7e8] px-1.5 py-[1px] text-[8px] text-[#9a6b1e] ring-1 ring-[#f0dfbd]">
                            قیمت جدید نیامده
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-5 text-muted">
                        {product.ingredientNameFa || "بدون ماده مؤثره"}
                        {product.brandOwnerName ? ` · ${product.brandOwnerName}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] leading-4 text-faint">
                        <span>
                          {[product.dosageFormFa, formatDose(product.dose), product.packageCount ? `بسته ${faNum(product.packageCount)}` : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {product.atc && (
                          <>
                            <span className="text-line-strong">|</span>
                            <span dir="ltr" className="font-mono">ATC {product.atc}</span>
                          </>
                        )}
                        {product.genericCode && (
                          <>
                            <span className="text-line-strong">|</span>
                            <span dir="ltr" className="font-mono">GenericCode {product.genericCode}</span>
                          </>
                        )}
                        <span className="text-line-strong">|</span>
                        <span dir="ltr" className="font-mono tracking-tight">{product.irc}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="text-end">
                        <div className="num whitespace-nowrap text-[14px] font-extrabold leading-6 text-ink">
                          {product.priceToman !== null ? faNum(product.priceToman) : "—"}
                          <span className="ms-1 text-[8.5px] font-medium text-faint">تومان</span>
                        </div>
                        <div className="mt-0.5 text-[8.5px] text-faint">
                          {product.unitPriceToman !== null
                            ? `هر واحد ${faNum(product.unitPriceToman)} تومان`
                            : product.productType === "28"
                              ? "مکمل بدون قیمت"
                              : "قیمت ثبت نشده"}
                        </div>
                      </div>
                      <Link
                        href={`/drug/${product.canonicalIrc}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#f3f8ff] px-2 text-[10px] font-medium text-brand transition hover:bg-[#e8f2fe]"
                      >
                        جزئیات
                        <ChevronLeft className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start gap-1.5 rounded-lg border border-dashed border-line-strong/70 bg-white/40 px-3 py-2 text-[9.5px] leading-5 text-faint">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {faNum(summary.total)} محصول جاری از {faNum(summary.records)} رکورد خام؛ {faNum(summary.aliases)} IRC قدیمی/تکراری در هویت محصول ادغام شده‌اند.
          </div>

          {results.pages > 1 && (
            <nav aria-label="صفحه‌بندی نتایج" className="mt-4 flex items-center justify-between gap-3">
              <Link
                href={buildHref({ ...values, page: Math.max(1, results.page - 1) })}
                aria-disabled={results.page === 1}
                className={`inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-[10.5px] transition ${
                  results.page === 1
                    ? "pointer-events-none border-line text-faint/50"
                    : "border-line text-ink-soft hover:border-[#bdd7f4] hover:text-brand"
                }`}
              >
                <ChevronRight className="h-3 w-3" />
                قبلی
              </Link>
              <span className="text-[10.5px] text-faint">
                صفحه <strong className="num text-ink-soft">{faNum(results.page)}</strong> از{" "}
                <span className="num">{faNum(results.pages)}</span>
              </span>
              <Link
                href={buildHref({ ...values, page: Math.min(results.pages, results.page + 1) })}
                aria-disabled={results.page === results.pages}
                className={`inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-[10.5px] transition ${
                  results.page === results.pages
                    ? "pointer-events-none border-line text-faint/50"
                    : "border-line text-ink-soft hover:border-[#bdd7f4] hover:text-brand"
                }`}
              >
                بعدی
                <ChevronLeft className="h-3 w-3" />
              </Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterForm({
  values,
  categories,
}: {
  values: Record<string, string>;
  categories: { id: string; name: string; count: number }[];
}) {
  return (
    <form action="/search" method="get" className="space-y-3.5">
      {values.company && <input type="hidden" name="company" value={values.company} />}
      {values.sort && values.sort !== "default" && <input type="hidden" name="sort" value={values.sort} />}
      <div>
        <label className="mb-1.5 block text-[9.5px] font-medium text-faint" htmlFor="filter-q">عبارت جستجو</label>
        <input
          id="filter-q"
          name="q"
          defaultValue={values.q}
          placeholder="نام، ماده مؤثره، IRC…"
          className="h-9 w-full rounded-lg border border-line bg-white px-2.5 text-[10.5px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-[9.5px] font-medium text-faint" htmlFor="filter-category">دسته درمانی</label>
        <select
          id="filter-category"
          name="category"
          defaultValue={values.category}
          className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[10.5px] outline-none focus:border-[#a7c9ee]"
        >
          <option value="">همه دسته‌ها</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.count})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-[9.5px] font-medium text-faint" htmlFor="filter-type">نوع محصول</label>
        <select
          id="filter-type"
          name="type"
          defaultValue={values.type}
          className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[10.5px] outline-none focus:border-[#a7c9ee]"
        >
          <option value="">همه</option>
          <option value="22">دارو</option>
          <option value="28">مکمل</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1.5 block text-[9.5px] font-medium text-faint" htmlFor="filter-min">از (تومان)</label>
          <input id="filter-min" name="min" inputMode="numeric" defaultValue={values.min} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[10.5px] outline-none focus:border-[#a7c9ee]" />
        </div>
        <div>
          <label className="mb-1.5 block text-[9.5px] font-medium text-faint" htmlFor="filter-max">تا (تومان)</label>
          <input id="filter-max" name="max" inputMode="numeric" defaultValue={values.max} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-[10.5px] outline-none focus:border-[#a7c9ee]" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[10px] text-ink-soft">
        <input type="checkbox" name="priced" value="1" defaultChecked={values.priced === "1"} className="h-3.5 w-3.5 rounded border-line text-brand" />
        فقط دارای قیمت
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-[10.5px] font-semibold text-white hover:bg-brand-dark">
          اعمال فیلتر
        </button>
        <Link href="/search" className="rounded-lg border border-line px-3 py-2 text-center text-[10.5px] text-muted hover:bg-surface-soft">
          حذف فیلترها
        </Link>
      </div>
    </form>
  );
}

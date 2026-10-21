import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Info,
  Search,
  Upload,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  getImportedCategoryCounts,
  searchImported,
} from "@/lib/import/queries";
import { getImportSummary } from "@/lib/import/service";
import { faNum, formatDose, productTypeLabel } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "داده‌های واردشده",
  description: "کاوش محصولات واردشده از فایل CSV سازمان غذا و دارو.",
};

const PER_PAGE = 20;

type RawParams = Record<string, string | string[] | undefined>;

function param(params: RawParams, key: string): string {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function buildHref(values: {
  q: string;
  category: string;
  type: string;
  priced: string;
  sort: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  if (values.q) search.set("q", values.q);
  if (values.category) search.set("category", values.category);
  if (values.type) search.set("type", values.type);
  if (values.priced) search.set("priced", values.priced);
  if (values.sort && values.sort !== "recent") search.set("sort", values.sort);
  if (values.page && values.page > 1) search.set("page", String(values.page));
  const query = search.toString();
  return `/imported${query ? `?${query}` : ""}`;
}

function productTypeBadge(value: string | null) {
  const label = productTypeLabel(value);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] ring-1 ${
        String(value) === "28"
          ? "bg-[#f0ecfd] text-[#6144c2] ring-[#ddd5f8]"
          : "bg-[#eef5fe] text-[#2f5f9f] ring-[#d5e4f5]"
      }`}
    >
      {label}
    </span>
  );
}

export default async function ImportedPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const q = param(params, "q").trim();
  const category = param(params, "category");
  const type = param(params, "type");
  const priced = param(params, "priced");
  const sort = param(params, "sort") || "recent";
  const page = Math.max(1, Number(param(params, "page")) || 1);

  const summary = getImportSummary();
  const categories = getImportedCategoryCounts();
  const results = searchImported({
    q,
    category,
    productType: type,
    priced,
    page,
    perPage: PER_PAGE,
    sort,
  });

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "داده" }, { label: "کاوش داده‌های واردشده" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-teal" />
            داده واقعی · CSV سازمان غذا و دارو
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            کاوش داده‌های واردشده
          </h1>
          <p className="mt-1.5 max-w-[680px] text-[12px] leading-6 text-muted">
            {summary.total > 0
              ? `${faNum(summary.total)} محصول از فایل‌های واردشده، با کلید IRC و قیمت مصرف‌کننده.`
              : "هنوز داده‌ای وارد نشده است. فایل CSV سازمان غذا و دارو را در صفحه ورود داده بارگذاری کنید."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/import" className="btn-primary">
            <Upload className="h-3.5 w-3.5" />
            ورود داده جدید
          </Link>
        </div>
      </div>

      {summary.total === 0 ? (
        <div className="surface-card mt-6 flex flex-col items-center px-5 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf2fe] to-[#e8f7f3] text-brand ring-1 ring-[#dbe8f6]">
            <Database className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h2 className="mt-3 text-[14px] font-bold text-ink">دیتابیس خالی است</h2>
          <p className="mt-1.5 max-w-md text-[11px] leading-6 text-muted">
            اولین فایل CSV را وارد کنید. تحلیل ستون‌ها قبل از ثبت انجام می‌شود و می‌توانید نمونه
            داده‌ها را ببینید.
          </p>
          <Link href="/import" className="btn-primary mt-4">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            ورود داده CSV
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Stat label="محصولات" value={faNum(summary.total)} />
            <Stat label="مواد مؤثره" value={faNum(summary.ingredients)} />
            <Stat label="شرکت‌ها" value={faNum(summary.companies)} />
            <Stat
              label="آخرین ورود"
              value={summary.lastBatch ? formatJalali(summary.lastBatch.imported_at) : "—"}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[8.5px] text-faint">
            <span className="inline-flex items-center gap-1 text-[#1b8663]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2ba57c]" />
              <span className="num">{faNum(summary.priced)}</span> دارای قیمت
            </span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>
              <span className="num">{faNum(summary.noPrice)}</span> بدون قیمت
            </span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>
              <span className="num">{faNum(summary.supplements)}</span> مکمل (بدون قیمت در فایل منبع)
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[9px] text-faint">
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal" />
            {summary.lastBatch ? (
              <span>
                آخرین فایل:{" "}
                <span className="font-medium text-ink-soft">{summary.lastBatch.file_name}</span> ·{" "}
                {faNum(summary.lastBatch.row_count)} ردیف ·{" "}
                {summary.lastBatch.status === "completed" ? "ثبت‌شده" : summary.lastBatch.status}
              </span>
            ) : (
              <span>داده‌ای ثبت نشده است.</span>
            )}
            <span className="ms-auto inline-flex items-center gap-1">
              <Info className="h-3 w-3" />
              قیمت‌ها به تومان · تاریخچه پس از دومین ورود ساخته می‌شود
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="surface-card h-fit p-3.5">
              <h2 className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
                <Database className="h-3.5 w-3.5 text-brand" />
                دسته‌های درمانی
              </h2>
              <div className="max-h-[520px] space-y-0.5 overflow-y-auto pe-1">
                <Link
                  href={buildHref({ q, category: "", type, priced, sort })}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-[9.5px] transition ${
                    !category ? "bg-[#eef5fe] font-semibold text-brand-dark" : "text-muted hover:bg-surface-soft"
                  }`}
                >
                  <span>همه دسته‌ها</span>
                  <span className="num text-[8.5px] text-faint">{faNum(summary.total)}</span>
                </Link>
                {categories.map((item) => (
                  <Link
                    key={item.id}
                    href={buildHref({ q, category: item.id, type, priced, sort })}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[9.5px] transition ${
                      category === item.id
                        ? "bg-[#eef5fe] font-semibold text-brand-dark"
                        : "text-muted hover:bg-surface-soft"
                    }`}
                  >
                    <span className="line-clamp-1">{item.name}</span>
                    <span className="num text-[8.5px] text-faint">{faNum(item.count)}</span>
                  </Link>
                ))}
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <form action="/imported" method="get" role="search" className="relative min-w-[200px] flex-1">
                  {category && <input type="hidden" name="category" value={category} />}
                  {type && <input type="hidden" name="type" value={type} />}
                  {priced && <input type="hidden" name="priced" value={priced} />}
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    placeholder="جستجوی نام، ماده مؤثره، شرکت، IRC یا ATC…"
                    className="h-9 w-full rounded-lg border border-line bg-white ps-9 pe-3 text-[10.5px] text-ink outline-none transition placeholder:text-faint focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
                    aria-label="جستجو در داده‌های واردشده"
                  />
                </form>
                <div className="flex items-center gap-1">
                  {[
                    { key: "recent", label: "پیش‌فرض" },
                    { key: "price-asc", label: "ارزان‌ترین" },
                    { key: "price-desc", label: "گران‌ترین" },
                  ].map((option) => (
                    <Link
                      key={option.key}
                      href={buildHref({ q, category, type, priced, sort: option.key })}
                      className={`rounded-md px-2 py-1 text-[9px] transition ${
                        sort === option.key
                          ? "bg-[#eaf2fe] font-semibold text-brand-dark"
                          : "text-faint hover:bg-surface-tint hover:text-ink-soft"
                      }`}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-faint">نوع:</span>
                {[
                  { key: "", label: "همه" },
                  { key: "22", label: "دارو" },
                  { key: "28", label: "مکمل" },
                ].map((option) => (
                  <Link
                    key={option.key || "all"}
                    href={buildHref({ q, category, type: option.key, priced, sort })}
                    className={`rounded-md border px-2 py-0.5 text-[9px] transition ${
                      type === option.key
                        ? "border-[#c9ddf5] bg-[#eef5fe] font-semibold text-brand-dark"
                        : "border-line bg-white text-muted hover:border-[#c8dcf2] hover:text-brand"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
                <Link
                  href={buildHref({ q, category, type, priced: priced ? "" : "1", sort })}
                  className={`rounded-md border px-2 py-0.5 text-[9px] transition ${
                    priced
                      ? "border-[#c9ddf5] bg-[#eef5fe] font-semibold text-brand-dark"
                      : "border-line bg-white text-muted hover:border-[#c8dcf2] hover:text-brand"
                  }`}
                >
                  فقط دارای قیمت
                </Link>
                {(type || category || q || priced) && (
                  <Link href="/imported" className="ms-1 text-[8.5px] text-faint underline decoration-dotted underline-offset-4 hover:text-brand">
                    پاک کردن فیلترها
                  </Link>
                )}
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-[10.5px] text-muted">
                  <strong className="num font-semibold text-ink">{faNum(results.total)}</strong> نتیجه
                  {q && <> برای «{q}»</>}
                </p>
                {(q || category) && (
                  <Link href="/imported" className="text-[9px] text-brand hover:text-brand-dark">
                    حذف فیلترها
                  </Link>
                )}
              </div>

              <div className="surface-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10.5px] md:min-w-[820px]">
                    <thead>
                      <tr className="border-b border-line/70 bg-surface-soft/60 text-[8.5px] text-faint">
                        <th className="px-3 py-2.5 text-start font-medium sm:px-4">محصول</th>
                        <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">ماده مؤثره</th>
                        <th className="hidden px-3 py-2.5 text-start font-medium lg:table-cell">شرکت</th>
                        <th className="px-2 py-2.5 text-start font-medium sm:px-3">قیمت</th>
                        <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">هر واحد</th>
                        <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">نوع</th>
                        <th className="px-2 py-2.5 text-start font-medium sm:px-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/50">
                      {results.rows.map((product) => (
                        <tr key={product.irc} className="transition-colors hover:bg-surface-soft">
                          <td className="px-3 py-2.5 sm:px-4">
                            <Link
                              href={`/imported/${product.irc}`}
                              className="font-semibold text-ink transition-colors hover:text-brand"
                            >
                              {product.display_name}
                            </Link>
                            <span className="mt-0.5 block text-[8.5px] text-faint">
                              {[
                                formatDose(product.dose),
                                product.dosage_form_fa,
                                product.package_count ? `بسته ${faNum(product.package_count)}` : "",
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                            <span className="mt-0.5 block text-[8px] text-faint md:hidden">
                              {product.ingredient_name_fa} · {product.brand_owner_name}
                            </span>
                          </td>
                          <td className="hidden px-3 py-2.5 md:table-cell">
                            <span className="block text-muted">{product.ingredient_name_fa}</span>
                            <span className="block text-[8px] text-faint">{product.generic_code || "—"}</span>
                          </td>
                          <td className="hidden px-3 py-2.5 lg:table-cell">
                            <span className="line-clamp-1 text-muted">{product.brand_owner_name}</span>
                            <span className="line-clamp-1 text-[8px] text-faint">{product.producer_name}</span>
                          </td>
                          <td className="num whitespace-nowrap px-2 py-2.5 font-semibold text-ink sm:px-3">
                            {product.price_toman !== null ? faNum(product.price_toman) : "—"}
                            <span className="ms-1 text-[7.5px] font-normal text-faint">تومان</span>
                          </td>
                          <td className="num hidden px-3 py-2.5 text-muted md:table-cell">
                            {product.unit_price_toman !== null ? faNum(product.unit_price_toman) : "—"}
                          </td>
                          <td className="hidden px-3 py-2.5 md:table-cell">{productTypeBadge(product.product_type)}</td>
                          <td className="px-2 py-2.5 sm:px-4">
                            <Link
                              href={`/imported/${product.irc}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-faint transition hover:border-[#bdd7f4] hover:text-brand"
                              aria-label={`جزئیات ${product.display_name}`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.rows.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Search className="h-5 w-5 text-faint" />
                    <p className="mt-2 text-[11px] font-medium text-ink">نتیجه‌ای پیدا نشد</p>
                    <Link href="/imported" className="mt-1.5 text-[9.5px] text-brand hover:text-brand-dark">
                      حذف فیلترها
                    </Link>
                  </div>
                )}
              </div>

              {results.pages > 1 && (
                <nav className="mt-3 flex items-center justify-between gap-3" aria-label="صفحه‌بندی">
                  <Link
                    href={buildHref({ q, category, type, priced, sort, page: Math.max(1, results.page - 1) })}
                    className={`inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-[9.5px] ${
                      results.page === 1
                        ? "pointer-events-none border-line text-faint/50"
                        : "border-line text-ink-soft hover:border-[#bdd7f4] hover:text-brand"
                    }`}
                  >
                    <ChevronRight className="h-3 w-3" />
                    قبلی
                  </Link>
                  <span className="text-[9.5px] text-faint">
                    صفحه <strong className="num text-ink-soft">{faNum(results.page)}</strong> از{" "}
                    <span className="num">{faNum(results.pages)}</span>
                  </span>
                  <Link
                    href={buildHref({ q, category, type, priced, sort, page: Math.min(results.pages, results.page + 1) })}
                    className={`inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-[9.5px] ${
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

              <p className="mt-3 flex items-start gap-1.5 text-[8.5px] leading-5 text-faint">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                این فهرست مستقیماً از دیتابیس SQLite خوانده می‌شود. صفحه خانه و جستجوی عمومی فعلاً
                از داده نمونه استفاده می‌کنند؛ اتصال کامل در مرحله بعد انجام می‌شود.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num mt-0.5 text-[12px] font-bold text-ink-soft">{value}</p>
    </div>
  );
}

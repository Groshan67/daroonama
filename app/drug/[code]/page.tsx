import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  Copy,
  FileText,
  FlaskConical,
  Layers,
  MapPin,
  Network,
  Pill,
  ShieldAlert,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RealPriceChart } from "@/components/charts/real-price-chart";
import { CopyButton } from "@/components/copy-button";
import { WatchlistButton } from "@/components/watchlist-button";
import { getAtcPath } from "@/lib/atc";
import {
  getCatalogProduct,
  getClassIngredients,
  getDoseOptions,
  getDrugIndex,
  getMarketPrice,
  getOtherDosageForms,
} from "@/lib/catalog/queries";
import { faDigits, faNum, faPercent, faPrice, formatDose, productTypeLabel } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const detail = getCatalogProduct(code);
  if (!detail) return { title: "محصول پیدا نشد" };
  const product = detail.product;
  const price =
    product.priceToman !== null
      ? `قیمت بسته ${faPrice(product.priceToman)}${product.unitPriceToman !== null ? ` و قیمت واحد ${faPrice(product.unitPriceToman)}` : ""}`
      : "قیمت ثبت‌شده‌ای برای این محصول موجود نیست";
  return seoMetadata({
    title: `${[product.displayName, formatDose(product.dose)].filter(Boolean).join(" ")} | قیمت و تاریخچه`,
    description: `${product.displayName} از ${product.brandOwnerName ?? product.producerName ?? "شرکت ثبت‌شده"}؛ ${price}. کد IRC ${product.canonicalIrc}، کد ژنریک ${product.genericCode ?? "—"} و ATC ${product.atc ?? "—"}.`,
    path: `/drug/${encodeURIComponent(product.canonicalIrc)}`,
    keywords: [
      product.displayName,
      product.ingredientNameFa ?? "",
      product.brandOwnerName ?? "",
      product.genericCode ? `کد ژنریک ${product.genericCode}` : "",
      product.atc ? `ATC ${product.atc}` : "",
      `قیمت ${product.displayName}`,
      "قیمت بسته دارو",
      "قیمت واحد دارو",
    ].filter(Boolean),
  });
}

export default async function DrugPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const query = await searchParams;
  const detail = getCatalogProduct(code);
  if (!detail) notFound();

  if (detail.isArchived) {
    redirect(`/drug/${detail.product.canonicalIrc}?from=${encodeURIComponent(detail.requestedIrc)}`);
  }

  const product = detail.product;
  const atcPath = product.atc ? getAtcPath(product.atc) : [];
  const previousIrc = typeof query.from === "string" ? query.from : null;
  const history = detail.history;
  const last = history.at(-1);
  const doseOptions = getDoseOptions(product);
  const otherForms = getOtherDosageForms(product);
  const classIngredients = getClassIngredients(product);
  const drugIndex = getDrugIndex(product.drugIndexId);
  const marketPrice = getMarketPrice(product.canonicalIrc);
  const displayPrice = product.priceToman ?? marketPrice?.priceToman ?? null;
  const displayUnitPrice = product.unitPriceToman ?? marketPrice?.unitPriceToman ?? null;
  const displayPackageCount = product.packageCount ?? marketPrice?.packageCount ?? null;
  const usingMarketPrice = product.priceToman === null && marketPrice !== undefined;
  const lowestGeneric = detail.alternatives
    .map((item) => item.priceToman)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)[0] ?? null;
  const priceOf = (point: (typeof history)[number] | undefined) =>
    point ? point.packagePriceToman ?? point.unitPriceToman : null;

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "جستجو", href: "/search" },
          {
            label: product.categoryName ?? "دسته‌بندی",
            href: `/search?category=${encodeURIComponent(product.categoryId ?? "")}`,
          },
          { label: product.displayName },
        ]}
      />

      {previousIrc && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#f0dfbd] bg-[#fffbf1] px-3.5 py-2.5 text-[10px] text-[#8f6d34]">
          <FileText className="h-3.5 w-3.5" />
          IRC <span dir="ltr" className="font-mono">{previousIrc}</span> در فایل جدید دیده نشده و به
          محصول جاری با IRC <span dir="ltr" className="font-mono">{product.canonicalIrc}</span> منتقل شد.
        </div>
      )}

      <section className="surface-card overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="relative p-5 sm:p-6">
            <span className="pointer-events-none absolute -end-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(91,147,232,0.1),transparent)]" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#eef5fe] px-2 py-1 text-[9.5px] font-medium text-brand-dark">
                <Pill className="h-3 w-3" />
                {productTypeLabel(product.productType)}
              </span>
              <span className="rounded-md bg-surface-tint px-1.5 py-1 text-[9px] text-muted ring-1 ring-line">
                {product.priceMissingLatest ? "قیمت جدید نیامده" : "داده رسمی"}
              </span>
              {product.atc && (
                <span dir="ltr" className="rounded-md border border-line bg-white px-1.5 py-1 font-mono text-[9px] text-muted">
                  ATC {product.atc}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
                {product.displayName}
              </h1>
              <span className="mb-1 text-[13px] font-medium text-muted">
                {[formatDose(product.dose), product.dosageFormFa].filter(Boolean).join(" · ")}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-6 text-muted">
              {product.ingredientNameFa || "بدون ماده مؤثره"}
              {product.packageCount ? ` · بسته ${faNum(product.packageCount)}` : ""}
              {product.brandOwnerName ? ` · ${product.brandOwnerName}` : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-faint">
              {product.brandOwnerName && (
                <Link
                  href={`/search?company=${encodeURIComponent(product.brandOwnerNationalId ?? product.brandOwnerName)}`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-brand"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-surface-tint">
                    <Layers className="h-3 w-3" />
                  </span>
                  {product.brandOwnerName}
                </Link>
              )}
              <Link
                href={`/search?q=${encodeURIComponent(product.ingredientNameFa ?? product.displayName)}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-brand"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {product.ingredientNameFa || "جستجوی ماده مؤثره"}
              </Link>
              <span className="inline-flex items-center gap-2">
                <span className="text-faint">IRC:</span>
                <span dir="ltr" className="font-mono text-[10px] tracking-tight text-ink-soft">
                  {product.irc}
                </span>
                <CopyButton value={product.irc} />
              </span>
            </div>

            {doseOptions.length > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-faint">دوزها:</span>
                {doseOptions.map((option) => (
                  <Link
                    key={option.irc}
                    href={`/drug/${option.irc}`}
                    className={`rounded-full border px-2.5 py-1 text-[9.5px] transition ${
                      option.drugIndexId && option.drugIndexId === product.drugIndexId
                        ? "border-[#bdd7f4] bg-[#eaf2fe] font-semibold text-brand-dark"
                        : "border-line bg-white text-muted hover:border-[#bdd7f4] hover:text-brand"
                    }`}
                  >
                    {formatDose(option.dose) || "—"}
                    <span className="num ms-1 text-[8px] text-faint">
                      {option.priceToman !== null ? `${faNum(option.priceToman)} ت` : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {atcPath.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line/60 pt-3 text-[8.5px] text-faint">
                <span className="inline-flex items-center gap-1 font-medium text-ink-soft">
                  <Network className="h-3 w-3" />
                  مسیر ATC:
                </span>
                {atcPath.map((item, index) => (
                  <span key={item.code} className="inline-flex items-center gap-1">
                    {index > 0 && <ChevronLeft className="h-2.5 w-2.5 text-faint/50" />}
                    <Link href={`/atc/${item.code}`} className="rounded px-1 py-0.5 transition hover:bg-surface-tint hover:text-brand">
                      {item.name_fa || item.name_en}
                    </Link>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line bg-gradient-to-b from-[#f8fbff] to-[#fbfdff] p-5 lg:border-s lg:border-t-0">
            <p className="text-[10px] font-medium text-faint">
              {usingMarketPrice ? "قیمت بازار (داروکده)" : "آخرین قیمت مصرف‌کننده"}
            </p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="num text-[30px] font-extrabold leading-[1.3] tracking-tight text-ink">
                {displayPrice !== null ? faNum(displayPrice) : "—"}
              </span>
              <span className="mb-1.5 text-[11px] font-medium text-muted">تومان</span>
            </div>
            <div className="mt-1.5 text-[9px] leading-4 text-faint">
              {last
                ? `آخرین مشاهده: ${formatJalali(last.observedAt)} · قیمت واحد ${faPrice(
                    last.unitPriceToman,
                  )} تومان`
                : usingMarketPrice
                  ? "قیمت رسمی ثبت نشده؛ قیمت بازار داروکده نمایش داده می‌شود."
                  : "قیمتی در فایل منبع ثبت نشده است"}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/80 pt-3">
              <div>
                <p className="text-[9px] text-faint">قیمت هر واحد</p>
                <p className="num mt-0.5 text-[12px] font-bold text-ink-soft">
                  {displayUnitPrice !== null ? faNum(displayUnitPrice) : "—"}
                  <span className="ms-1 text-[8.5px] font-normal text-faint">تومان</span>
                </p>
              </div>
              <div>
                <p className="text-[9px] text-faint">تعداد بسته</p>
                <p className="num mt-0.5 text-[12px] font-bold text-ink-soft">
                  {displayPackageCount !== null ? faNum(displayPackageCount) : "—"}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-line/70 bg-white/70 p-2.5 text-[9px] leading-5 text-faint">
              {product.priceMissingLatest && product.priceToman !== null
                ? "در فایل جدید قیمت این محصول نیامده؛ آخرین قیمت معتبر نمایش داده می‌شود."
                : product.priceToman === null
                  ? "در فایل منبع برای این محصول قیمت مصرف‌کننده ثبت نشده است."
                  : "قیمت از آخرین فایل رسمی واردشده خوانده شده است."}
            </div>

            {marketPrice && usingMarketPrice && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8.5px] text-faint">
                {marketPrice.originalPriceToman !== null && (
                  <span className="num line-through">{faNum(marketPrice.originalPriceToman)} تومان</span>
                )}
                {marketPrice.discountPercent !== null && (
                  <span className="text-[#a96a18]">{faNum(marketPrice.discountPercent)}٪ تخفیف</span>
                )}
                {marketPrice.sourceUrl && (
                  <a
                    href={`https://darukade.com${marketPrice.sourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="font-medium text-[#a96a18] hover:underline"
                  >
                    منبع: داروکده
                  </a>
                )}
              </div>
            )}

            {marketPrice && !usingMarketPrice && (
              <div className="mt-3 rounded-lg border border-[#efd7b4] bg-[#fff7e8] p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-medium text-[#8f6d34]">قیمت بازار داروکده</p>
                  {marketPrice.discountPercent !== null && (
                    <span className="num rounded bg-[#c47a20] px-1.5 py-0.5 text-[8px] font-bold text-white">
                      {faNum(marketPrice.discountPercent)}٪ تخفیف
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="num text-[16px] font-extrabold text-[#8f6d34]">
                    {faPrice(marketPrice.priceToman)}
                  </span>
                  {marketPrice.originalPriceToman !== null && (
                    <span className="num text-[9px] text-faint line-through">
                      {faNum(marketPrice.originalPriceToman)}
                    </span>
                  )}
                </div>
                {marketPrice.sourceUrl && (
                  <a
                    href={`https://darukade.com${marketPrice.sourceUrl}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1 inline-block text-[8.5px] font-medium text-[#a96a18] hover:underline"
                  >
                    مشاهده صفحه داروکده
                  </a>
                )}
              </div>
            )}

            <div className="mt-3">
              <WatchlistButton
                drug={{
                  code: product.canonicalIrc,
                  name: product.displayName,
                  ingredientName: product.ingredientNameFa ?? "",
                  companyName: product.brandOwnerName ?? "",
                  price: product.priceToman ?? 0,
                }}
                withShortcut
                fullWidth
              />
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(product.ingredientNameFa ?? product.displayName)}`}
              className="btn-secondary mt-2 w-full !justify-center"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              مقایسه با محصولات هم‌ماده
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile label="آخرین مشاهده" value={last ? formatJalali(last.observedAt) : "—"} hint={`${faNum(history.length)} نقطه ثبت‌شده`} />
        <StatTile label="تغییر آخرین قیمت" value={last && history.length > 1 && priceOf(history[history.length - 2]) ? faPercent(((priceOf(last)! - priceOf(history[history.length - 2])!) / priceOf(history[history.length - 2])!) * 100) : "—"} hint="نسبت به مشاهده قبلی" tone="rose" />
        <StatTile label="IRCهای متصل" value={`${faNum(product.aliasesCount)} IRC`} hint="شامل IRCهای قدیمی/تکراری" />
        <StatTile label="کد ATC" value={product.atc ?? "—"} hint={atcPath.at(-1)?.name_fa ?? "بدون مسیر ATC"} />
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        <div className="surface-card flex items-center justify-between gap-3 p-3.5">
          <div>
            <p className="text-[9px] text-faint">GenericCode · خانواده دقیق</p>
            <p dir="ltr" className="num mt-1 font-mono text-[15px] font-bold text-ink">{product.genericCode ?? "—"}</p>
            <p className="mt-0.5 text-[8px] text-faint">ماده مؤثره + دوز/غلظت + حجم/ارائه</p>
          </div>
          {product.genericCode && <CopyButton value={product.genericCode} />}
        </div>
        <div className="surface-card flex items-center justify-between gap-3 p-3.5">
          <div>
            <p className="text-[9px] text-faint">DrugIndexId · سطح هم‌دوز</p>
            <p dir="ltr" className="num mt-1 font-mono text-[15px] font-bold text-ink">{product.drugIndexId ?? "—"}</p>
            <p className="mt-0.5 text-[8px] text-faint">ماده مؤثره + دوز، بدون حجم ویال</p>
          </div>
          {product.drugIndexId && <CopyButton value={product.drugIndexId} />}
        </div>
        <div className="surface-card p-3.5">
          <p className="text-[9px] text-faint">کمترین قیمت ژنریک در همان GenericCode</p>
          <p className="num mt-1 text-[17px] font-extrabold text-ink">
            {lowestGeneric !== null ? `${faNum(lowestGeneric)} تومان` : "—"}
          </p>
          <p className="mt-0.5 text-[8px] text-faint">
            {detail.alternatives.length > 0 ? `${faNum(detail.alternatives.length)} محصول مقایسه‌شده` : "محصول دیگری ثبت نشده"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <section className="surface-card p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-bold text-ink">تاریخچه قیمت</h2>
                <p className="mt-0.5 text-[10px] text-faint">مشاهده‌های واقعی ثبت‌شده برای این هویت محصول</p>
              </div>
              <span className="hidden items-center gap-1.5 text-[9px] text-faint sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                قیمت بسته (تومان)
              </span>
            </div>
            <RealPriceChart
              history={history
                .filter((point) => point.packagePriceToman !== null)
                .map((point) => ({
                  observedAt: point.observedAt,
                  priceToman: point.packagePriceToman!,
                  irc: point.irc,
                }))}
            />
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-ink">مشاهده‌های قیمت</h2>
                <p className="mt-0.5 text-[10px] text-faint">هر ردیف یک فایل هفتگی است</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] sm:min-w-[520px]">
                <thead>
                  <tr className="border-b border-line/60 text-[9px] text-faint">
                    <th className="px-3 py-2 text-start font-medium sm:px-4">تاریخ</th>
                    <th className="px-2 py-2 text-start font-medium sm:px-3">IRC منبع</th>
                    <th className="px-2 py-2 text-start font-medium sm:px-3">قیمت</th>
                    <th className="px-2 py-2 text-start font-medium sm:px-3">تغییر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {history.map((point, index) => {
                    const previous = index > 0 ? priceOf(history[index - 1]) : null;
                    const current = priceOf(point);
                    const change = previous && current ? ((current - previous) / previous) * 100 : null;
                    return (
                      <tr key={`${point.observedAt}-${point.irc}`} className={index === history.length - 1 ? "bg-[#f8fbff]" : undefined}>
                        <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft sm:px-4">
                          {formatJalali(point.observedAt)}
                          {index === history.length - 1 && (
                            <span className="ms-1.5 rounded bg-[#eaf2fe] px-1 py-0.5 text-[8px] text-brand">آخرین</span>
                          )}
                        </td>
                        <td dir="ltr" className="px-2 py-2.5 font-mono text-[8.5px] text-faint sm:px-3">{point.irc}</td>
                        <td className="num px-2 py-2.5 font-semibold text-ink sm:px-3">
                          {current !== null ? `${faNum(current)} تومان` : "—"}
                        </td>
                        <td className="px-2 py-2.5 sm:px-3">
                          {change === null ? <span className="text-faint">—</span> : (
                            <span className={`num ${change >= 0 ? "text-[#b84d64]" : "text-[#1b8663]"}`}>
                              {change >= 0 ? "+" : ""}{faNum(Number(change.toFixed(1)))}٪
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-[10px] text-faint">قیمتی ثبت نشده است.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-ink">مقایسه با محصولات هم‌خانواده</h2>
                <p className="mt-0.5 text-[10px] text-faint">بر اساس GenericCode {product.genericCode ?? "—"}</p>
              </div>
              <Link href={`/search?q=${encodeURIComponent(product.ingredientNameFa ?? product.displayName)}`} className="inline-flex items-center gap-1 text-[10px] text-brand hover:text-brand-dark">
                همه نتایج
                <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10.5px] sm:min-w-[560px]">
                <thead>
                  <tr className="border-b border-line/60 text-[9px] text-faint">
                    <th className="px-3 py-2 text-start font-medium sm:px-4">محصول</th>
                    <th className="hidden px-3 py-2 text-start font-medium sm:table-cell">شرکت</th>
                    <th className="px-2 py-2 text-start font-medium sm:px-3">قیمت بسته</th>
                    <th className="hidden px-3 py-2 text-start font-medium sm:table-cell">هر واحد</th>
                    <th className="px-2 py-2 text-start font-medium sm:px-4">اختلاف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  <tr className="bg-[#f8fbff]">
                    <td className="px-3 py-2.5 sm:px-4">
                      <span className="font-semibold text-ink">{product.displayName}</span>
                      <span className="ms-1.5 rounded bg-[#eaf2fe] px-1 py-0.5 text-[8px] text-brand">این محصول</span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{product.brandOwnerName ?? "—"}</td>
                    <td className="num px-2 py-2.5 font-semibold text-ink sm:px-3">{product.priceToman !== null ? faNum(product.priceToman) : "—"}</td>
                    <td className="num hidden px-3 py-2.5 text-muted sm:table-cell">{product.unitPriceToman !== null ? faNum(product.unitPriceToman) : "—"}</td>
                    <td className="px-2 py-2.5 text-faint sm:px-4">—</td>
                  </tr>
                  {detail.alternatives.map((alternative) => {
                    const diff = product.priceToman && alternative.priceToman
                      ? ((alternative.priceToman - product.priceToman) / product.priceToman) * 100
                      : null;
                    return (
                      <tr key={alternative.identityId} className="transition-colors hover:bg-surface-soft">
                        <td className="px-3 py-2.5 sm:px-4">
                          <Link href={`/drug/${alternative.canonicalIrc}`} className="font-medium text-ink hover:text-brand">
                            {alternative.displayName}
                          </Link>
                          <span className="ms-1 text-[8.5px] text-faint">
                            {alternative.packageCount ? `بسته ${faNum(alternative.packageCount)}` : ""}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{alternative.brandOwnerName ?? "—"}</td>
                        <td className="num px-2 py-2.5 text-ink-soft sm:px-3">{alternative.priceToman !== null ? faNum(alternative.priceToman) : "—"}</td>
                        <td className="num hidden px-3 py-2.5 text-muted sm:table-cell">{alternative.unitPriceToman !== null ? faNum(alternative.unitPriceToman) : "—"}</td>
                        <td className="px-2 py-2.5 sm:px-4">
                          {diff === null ? <span className="text-faint">—</span> : (
                            <span className={`num ${diff >= 0 ? "text-[#b84d64]" : "text-[#1b8663]"}`}>
                              {diff >= 0 ? "+" : ""}{faNum(Number(diff.toFixed(1)))}٪
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {classIngredients.length > 1 && (
            <details className="surface-card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-line/70 px-4 py-3 text-[11px] font-semibold text-ink-soft">
                <span>مقایسه {faNum(classIngredients.length)} ماده مؤثره در همین دسته</span>
                <ChevronLeft className="h-3.5 w-3.5 text-faint" />
              </summary>
              <div className="grid gap-1 p-3 sm:grid-cols-2">
                {classIngredients.map((item) => (
                  <Link
                    key={item.key}
                    href={`/ingredient/${encodeURIComponent(item.key)}?category=${product.atc?.slice(0, 4) ?? ""}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="num shrink-0 text-[8.5px] text-faint">{faNum(item.count)}</span>
                  </Link>
                ))}
              </div>
            </details>
          )}

          {otherForms.length > 0 && (
            <details className="surface-card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-line/70 px-4 py-3 text-[11px] font-semibold text-ink-soft">
                <span>نمایش {faNum(otherForms.length)} شکل/دوز دیگر</span>
                <ChevronLeft className="h-3.5 w-3.5 text-faint" />
              </summary>
              <div className="flex flex-wrap gap-1.5 p-3">
                {otherForms.map((form) => (
                  <Link
                    key={form.form}
                    href={`/search?q=${encodeURIComponent(product.ingredientNameFa ?? product.displayName)}`}
                    className="rounded-full border border-line bg-white px-2.5 py-1 text-[9.5px] text-muted hover:border-[#bdd7f4] hover:text-brand"
                  >
                    {form.form} <span className="num text-[8px] text-faint">{faNum(form.count)}</span>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">مشخصات محصول</h2>
            <dl className="space-y-2.5 text-[10.5px]">
              <SpecRow label="نام نمایشی" value={product.displayName} />
              <SpecRow label="ماده مؤثره" value={product.ingredientNameFa || "—"} />
              <SpecRow label="دوز / غلظت" value={formatDose(product.dose) || "—"} />
              <SpecRow label="شکل دارویی" value={product.dosageFormFa || "—"} />
              <SpecRow label="مسیر مصرف" value={product.routeFa || "—"} />
              <SpecRow label="تعداد بسته" value={product.packageCount !== null ? faNum(product.packageCount) : "—"} />
              <SpecRow label="نوع محصول" value={productTypeLabel(product.productType)} />
              <SpecRow label="صاحب برند" value={product.brandOwnerName || "—"} />
              <SpecRow label="تولیدکننده" value={product.producerName || "—"} />
              <SpecRow label="کد ATC" value={product.atc || "—"} mono />
              <SpecRow label="کد IRC" value={product.irc} mono />
            </dl>
          </section>

          {drugIndex && (
            <section className="surface-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-line/70 pb-2">
                <h2 className="text-[12px] font-bold text-ink">اطلاعات رسمی DrugIndex</h2>
                <span dir="ltr" className="num rounded bg-surface-tint px-1.5 py-0.5 text-[9px] text-faint">
                  #{drugIndex.id}
                </span>
              </div>
              <p className="text-[11px] font-semibold leading-6 text-ink-soft">
                {drugIndex.faName || drugIndex.enName || "—"}
              </p>
              <p dir="ltr" className="mt-0.5 text-start text-[8.5px] text-faint">
                {drugIndex.enName ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[8.5px] ring-1 ${
                  drugIndex.accessLevel === "OTC"
                    ? "bg-[#e6f7f3] text-[#158d7d] ring-[#cdeee6]"
                    : drugIndex.accessLevel === "Hospital Only"
                      ? "bg-[#fdf3e2] text-[#b9751d] ring-[#f0dfbd]"
                      : "bg-surface-tint text-faint ring-line"
                }`}>
                  {drugIndex.accessLevel === "OTC"
                    ? "بدون نسخه"
                    : drugIndex.accessLevel === "Hospital Only"
                      ? "فقط بیمارستانی"
                      : "دسترسی نامشخص"}
                </span>
                {drugIndex.drugType && (
                  <span className="rounded-full bg-[#eef5fe] px-2 py-0.5 text-[8.5px] text-[#2f5f9f] ring-1 ring-[#d5e4f5]">
                    {drugIndex.drugType === "Biologic" ? "بیولوژیک" : "غیربیولوژیک"}
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[8.5px] ring-1 ${
                  drugIndex.canceled
                    ? "bg-[#fdeef1] text-[#b84a63] ring-[#f3d7de]"
                    : "bg-[#eaf7f0] text-[#1c825f] ring-[#d3eee2]"
                }`}>
                  {drugIndex.canceled ? "لغو شده" : "لغو نشده"}
                </span>
              </div>
              <dl className="mt-3 space-y-2 text-[10px]">
                <SpecRow label="شکل رسمی" value={drugIndex.dosageFormTitle || "—"} />
                <SpecRow label="دوز رسمی" value={drugIndex.strength || "—"} />
                <SpecRow label="مسیر رسمی" value={drugIndex.routeTitle || "—"} />
                <SpecRow label="ATC رسمی" value={drugIndex.atcCode || "—"} mono />
                <SpecRow label="تاریخ ثبت" value={drugIndex.persianCommissionDate || "—"} />
                {drugIndex.canceled && <SpecRow label="تاریخ لغو" value={drugIndex.persianCancellationDate || "—"} />}
                {drugIndex.narcoticGrade && <SpecRow label="درجه کنترل" value={drugIndex.narcoticGrade} />}
              </dl>
              {drugIndex.ingredients.length > 0 && (
                <div className="mt-3 border-t border-line/60 pt-2">
                  <p className="mb-1 text-[8.5px] font-medium text-faint">مواد مؤثره رسمی</p>
                  <ul className="space-y-1">
                    {drugIndex.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="flex items-center justify-between gap-2 text-[9px]">
                        <span className="truncate text-ink-soft">{ingredient.substanceName ?? "—"}</span>
                        <span dir="ltr" className="num shrink-0 text-faint">
                          {ingredient.strength !== null
                            ? formatIngredientStrength(ingredient.strength, ingredient.strengthUnitEn)
                            : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section className="surface-card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <CalendarDays className="h-3.5 w-3.5 text-brand" />
              IRCهای متصل
            </h2>
            <p className="mb-2 text-[9px] leading-5 text-faint">
              این محصول با {faNum(detail.aliases.length)} IRC در فایل‌های مختلف دیده شده است.
            </p>
            <ul className="space-y-1.5">
              {detail.aliases.slice(0, 6).map((alias) => (
                <li key={alias.irc} className="flex items-center justify-between gap-2 rounded-lg bg-surface-soft px-2 py-1.5">
                  <span dir="ltr" className="font-mono text-[8.5px] text-ink-soft">{alias.irc}</span>
                  <span className={`text-[8px] ${alias.isCurrent ? "text-[#1b8663]" : "text-faint"}`}>
                    {alias.isCurrent ? "جاری" : "قدیمی"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="rounded-xl border border-[#f0e2c8] bg-[#fffbf3] p-3.5">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b7812c]" />
              <p className="text-[9px] leading-5 text-[#8f6d34]">
                قیمت‌ها از فایل رسمی واردشده خوانده شده‌اند و جایگزین نسخه، مشاوره داروساز یا پزشک
                نیستند. برای خرید و مصرف به مراجع رسمی مراجعه کنید.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatIngredientStrength(value: number, unit: string | null): string {
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(value);
  const normalized = (unit ?? "").toUpperCase();
  const unitFa = normalized.includes("MILLIGRAM")
    ? "میلی‌گرم"
    : normalized.includes("MICROGRAM")
      ? "میکروگرم"
      : normalized.includes("GRAM")
        ? "گرم"
        : unit ?? "";
  return `${faDigits(formatted)} ${unitFa}`.trim();
}

function StatTile({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "rose" }) {
  return (
    <div className="surface-card p-3.5">
      <p className="text-[9px] text-faint">{label}</p>
      <p className={`num mt-1 text-[14px] font-extrabold ${tone === "rose" ? "text-[#b84d64]" : "text-ink"}`}>{value}</p>
      <p className="num mt-0.5 truncate text-[9px] text-faint">{hint}</p>
    </div>
  );
}

function SpecRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className={`text-end leading-5 ${mono ? "font-mono text-[10px] text-ink-soft" : "font-medium text-ink-soft"}`}>{value}</dd>
    </div>
  );
}

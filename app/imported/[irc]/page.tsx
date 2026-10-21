import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronLeft,
  Database,
  FileSpreadsheet,
  FlaskConical,
  Info,
  Layers,
  MapPin,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PriceTrendChart } from "@/components/charts/price-trend";
import {
  getImportedIngredientCount,
  getImportedProduct,
  getPriceHistory,
  getSimilarImported,
} from "@/lib/import/queries";
import { getAtcPath } from "@/lib/atc";
import { faNum, faPrice, formatDose, productTypeLabel } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ irc: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { irc } = await params;
  const product = getImportedProduct(irc);
  if (!product) return { title: "محصول پیدا نشد" };
  return {
    title: `${product.display_name} | داده واردشده`,
    description: `${product.ingredient_name_fa} · ${product.brand_owner_name} · قیمت مصرف‌کننده`,
  };
}

function ProductTypeBadge({ value }: { value: string | null }) {
  const isSupplement = String(value) === "28";
  return (
    <span
      className={`rounded-md px-2 py-1 text-[9px] font-medium ring-1 ${
        isSupplement
          ? "bg-[#f0ecfd] text-[#6144c2] ring-[#ddd5f8]"
          : "bg-[#eef5fe] text-[#2f5f9f] ring-[#d5e4f5]"
      }`}
    >
      {productTypeLabel(value)}
    </span>
  );
}

export default async function ImportedProductPage({ params }: PageProps) {
  const { irc } = await params;
  const product = getImportedProduct(irc);
  if (!product) notFound();

  const history = getPriceHistory(product.irc);
  const similar = getSimilarImported(product, 6);
  const ingredientCount = getImportedIngredientCount(product);
  const atcPath = product.atc ? getAtcPath(product.atc) : [];
  const pricedHistory = history.filter(
    (point): point is typeof point & { price_toman: number } => point.price_toman !== null,
  );
  const chartData = pricedHistory.map((point) => ({
    date: point.observed_at.slice(0, 10),
    price: point.price_toman,
  }));
  const first = pricedHistory[0];
  const last = pricedHistory[pricedHistory.length - 1];
  const change =
    first && last && first.price_toman
      ? ((last.price_toman - first.price_toman) / first.price_toman) * 100
      : 0;

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "داده‌های واردشده", href: "/imported" },
          { label: product.display_name ?? product.irc },
        ]}
      />

      <section className="surface-card relative overflow-hidden">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#5b93e8] via-[#2f6fce] to-[#159a89]" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/imported?category=${product.category_id ?? ""}`}
                className="inline-flex items-center gap-1 rounded-md bg-[#eef5fe] px-2 py-1 text-[9px] font-medium text-brand-dark"
              >
                <Layers className="h-3 w-3" />
                {product.category_name ?? "سایر"}
              </Link>
              <ProductTypeBadge value={product.product_type} />
              <span className="rounded-md bg-surface-tint px-1.5 py-1 text-[8.5px] text-muted ring-1 ring-line">
                داده واردشده
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[31px]">
                {product.display_name}
              </h1>
              <span className="mb-1 text-[12px] font-medium text-muted">
                {[formatDose(product.dose), product.dosage_form_fa].filter(Boolean).join(" · ")}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-6 text-muted">
              {product.ingredient_name_fa}
              {product.ingredient_name_en && (
                <span dir="ltr" className="ms-1 text-[10px] text-faint">
                  ({product.ingredient_name_en})
                </span>
              )}
              <span className="mx-1.5 text-faint/60">·</span>
              {product.brand_owner_name}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9.5px] text-faint">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {product.producer_country || "—"}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                IRC <span dir="ltr" className="font-mono">{product.irc}</span>
              </span>
              {product.gtin && (
                <span className="inline-flex items-center gap-1">
                  GTIN <span dir="ltr" className="font-mono">{product.gtin}</span>
                </span>
              )}
              {product.atc && (
                <span className="inline-flex items-center gap-1">
                  ATC <span dir="ltr" className="font-mono">{product.atc}</span>
                </span>
              )}
            </div>

            {atcPath.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-line/60 pt-2.5 text-[8.5px] text-faint">
                <span className="font-medium text-ink-soft">مسیر ATC:</span>
                {atcPath.map((item, index) => (
                  <span key={item.code} className="inline-flex items-center gap-1">
                    {index > 0 && <ChevronLeft className="h-2.5 w-2.5 text-faint/50" />}
                    <Link
                      href={`/atc/${item.code}`}
                      className="rounded px-1 py-0.5 transition hover:bg-surface-tint hover:text-brand"
                      title={item.name_en ?? item.code}
                    >
                      {item.name_fa || item.name_en}
                    </Link>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line bg-gradient-to-b from-[#f8fbff] to-[#fbfdff] p-5 lg:border-s lg:border-t-0">
            <p className="text-[9.5px] font-medium text-faint">قیمت مصرف‌کننده</p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="num text-[28px] font-extrabold leading-[1.3] tracking-tight text-ink">
                {product.price_toman !== null ? faNum(product.price_toman) : "—"}
              </span>
              <span className="mb-1.5 text-[10px] font-medium text-muted">تومان</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-faint">
              {product.price_rial !== null && (
                <span className="num">قیمت فایل: {faNum(product.price_rial)} ریال</span>
              )}
              <span>·</span>
              <span>هر واحد: {product.unit_price_toman !== null ? faPrice(product.unit_price_toman) : "—"}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/80 pt-3">
              <InfoCell label="تعداد در بسته" value={product.package_count ? faNum(product.package_count) : "—"} />
              <InfoCell label="شکل دارویی" value={product.dosage_form_fa || "—"} />
              <InfoCell label="مسیر مصرف" value={product.route_fa || "—"} />
              <InfoCell label="تاریخ اعتبار" value={product.expiration_date ? formatJalali(product.expiration_date) : "—"} />
            </div>

            {similar.length > 0 && (
              <Link href="#similar" className="btn-secondary mt-3 w-full !justify-center !py-2 !text-[10.5px]">
                مقایسه با {faNum(similar.length)} محصول هم‌خانواده
                <ChevronLeft className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <MiniStat label="تاریخچه ثبت‌شده" value={`${faNum(pricedHistory.length)} مقطع`} />
        <MiniStat
          label="تغییر از اولین مقطع"
          value={pricedHistory.length > 1 ? `${faNum(Math.round(Math.abs(change)))}٪` : "—"}
        />
        <MiniStat label="محصولات این ماده" value={`${faNum(ingredientCount)} قلم`} />
        <MiniStat label="کد خانواده ژنریک" value={product.generic_code || "—"} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <section className="surface-card p-4 sm:p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[13px] font-bold text-ink">تاریخچه قیمت</h2>
                <p className="mt-0.5 text-[10px] text-faint">
                  هر بار ورود داده، یک نقطه در تاریخچه ثبت می‌کند
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] text-faint">
                <CalendarDays className="h-3 w-3" />
                {pricedHistory.length > 0
                  ? `${formatJalali(pricedHistory[0].observed_at)} تا ${formatJalali(pricedHistory[pricedHistory.length - 1].observed_at)}`
                  : "بدون تاریخچه"}
              </span>
            </div>

            {pricedHistory.length >= 2 ? (
              <PriceTrendChart history={chartData} />
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong/80 bg-surface-soft/50 px-4 py-10 text-center">
                <Database className="h-6 w-6 text-faint" />
                <p className="mt-2 text-[11px] font-medium text-ink">
                  برای رسم نمودار حداقل دو مقطع ورود لازم است
                </p>
                <p className="mt-1 max-w-sm text-[9.5px] leading-5 text-muted">
                  فایل هفته بعد را با همان IRC وارد کنید تا تغییر قیمت این محصول در نمودار ثبت شود.
                  {pricedHistory.length === 1 &&
                    ` اولین قیمت ثبت‌شده: ${faPrice(pricedHistory[0].price_toman)}.`}
                </p>
                <Link href="/import" className="mt-3 text-[10px] font-medium text-brand hover:text-brand-dark">
                  ثبت داده جدید
                  <ArrowLeft className="ms-1 inline h-3 w-3" />
                </Link>
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
                <Database className="h-3.5 w-3.5 text-brand" />
                <h2 className="text-[12.5px] font-bold text-ink">ثبت‌های قیمت</h2>
                <span className="ms-auto num text-[9px] text-faint">{faNum(history.length)} ردیف</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-[10px]">
                  <thead>
                    <tr className="border-b border-line/60 text-[8.5px] text-faint">
                      <th className="px-4 py-2 text-start font-medium">تاریخ مشاهده</th>
                      <th className="px-3 py-2 text-start font-medium">قیمت (تومان)</th>
                      <th className="px-3 py-2 text-start font-medium">شماره ورود</th>
                      <th className="px-4 py-2 text-start font-medium">تاریخ منبع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/50">
                    {[...history].reverse().map((point) => (
                      <tr key={`${point.batch_id}-${point.observed_at}`}>
                        <td className="px-4 py-2 text-ink-soft">{formatJalali(point.observed_at)}</td>
                        <td className="num px-3 py-2 font-medium text-ink">
                          {point.price_toman !== null ? faNum(point.price_toman) : "—"}
                        </td>
                        <td className="num px-3 py-2 text-muted">#{faNum(point.batch_id)}</td>
                        <td className="px-4 py-2 text-[9px] text-faint">
                          {point.source_response_at ? formatJalali(point.source_response_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section id="similar" className="surface-card overflow-hidden scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-ink">محصولات هم‌خانواده</h2>
                <p className="mt-0.5 text-[10px] text-faint">
                  بر اساس GenericCode: {product.generic_code || "ثبت نشده"}
                </p>
              </div>
              <Link
                href={`/imported?q=${encodeURIComponent(product.ingredient_name_fa ?? "")}`}
                className="inline-flex items-center gap-1 text-[9.5px] text-brand hover:text-brand-dark"
              >
                همه محصولات این ماده
                <ChevronLeft className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[10px]">
                <thead>
                  <tr className="border-b border-line/60 text-[8.5px] text-faint">
                    <th className="px-4 py-2 text-start font-medium">محصول</th>
                    <th className="px-3 py-2 text-start font-medium">شرکت</th>
                    <th className="px-3 py-2 text-start font-medium">بسته</th>
                    <th className="px-3 py-2 text-start font-medium">قیمت</th>
                    <th className="px-4 py-2 text-start font-medium">هر واحد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {similar.map((item) => (
                    <tr key={item.irc} className="transition-colors hover:bg-surface-soft">
                      <td className="px-4 py-2">
                        <Link href={`/imported/${item.irc}`} className="font-medium text-ink hover:text-brand">
                          {item.display_name}
                        </Link>
                        <span className="mt-0.5 block text-[8px] text-faint">
                          {item.brand_name || item.dose}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted">{item.brand_owner_name}</td>
                      <td className="num px-3 py-2 text-muted">{item.package_count ?? "—"}</td>
                      <td className="num px-3 py-2 text-ink-soft">
                        {item.price_toman !== null ? faNum(item.price_toman) : "—"}
                      </td>
                      <td className="num px-4 py-2 text-muted">
                        {item.unit_price_toman !== null ? faNum(item.unit_price_toman) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {similar.length === 0 && (
                <p className="py-8 text-center text-[9.5px] text-faint">محصول هم‌خانواده دیگری ثبت نشده است.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">مشخصات محصول</h2>
            <dl className="space-y-2.5 text-[10px]">
              <Spec label="نام نمایشی" value={product.display_name ?? product.irc} />
              <Spec label="برند" value={product.brand_name || "—"} />
              <Spec label="ماده مؤثره" value={product.ingredient_name_fa || "—"} />
              <Spec label="دوز / غلظت" value={formatDose(product.dose) || "—"} />
              <Spec label="شکل دارویی" value={product.dosage_form_fa || "—"} />
              <Spec label="مسیر مصرف" value={product.route_fa || "—"} />
              <Spec label="تعداد بسته" value={product.package_count ? faNum(product.package_count) : "—"} />
              <Spec label="نوع محصول" value={productTypeLabel(product.product_type)} />
              <Spec label="کد وضعیت" value={product.status !== null ? `کد ${faNum(product.status)}` : "—"} />
              <Spec label="کد خانواده" value={product.generic_code || "—"} mono />
              <Spec label="کد ATC" value={product.atc || "—"} mono />
            </dl>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2.5 flex items-center gap-1.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">
              <Building2 className="h-3.5 w-3.5 text-brand" />
              شرکت‌ها
            </h2>
            <dl className="space-y-2.5 text-[10px]">
              <Spec label="صاحب برند" value={product.brand_owner_name || "—"} />
              <Spec label="شناسه ملی" value={product.brand_owner_national_id || "—"} mono />
              <Spec label="تولیدکننده" value={product.producer_name || "—"} />
              <Spec label="کشور تولید" value={product.producer_country || "—"} />
            </dl>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <FlaskConical className="h-3.5 w-3.5 text-teal" />
              اطلاعات ثبت
            </h2>
            <dl className="space-y-2.5 text-[10px]">
              <Spec label="IRC" value={product.irc} mono />
              <Spec label="GTIN" value={product.gtin || "—"} mono />
              <Spec label="تاریخ صدور" value={product.issuance_date ? formatJalali(product.issuance_date) : "—"} />
              <Spec label="تاریخ انقضا" value={product.expiration_date ? formatJalali(product.expiration_date) : "—"} />
              <Spec label="batch" value={`#${faNum(product.last_batch_id)}`} />
              <Spec label="آخرین مشاهده" value={formatJalali(product.last_seen_at)} />
            </dl>
          </section>

          <div className="rounded-xl border border-[#d8e7f8] bg-[#f7fbff] p-3.5">
            <p className="flex items-start gap-1.5 text-[9px] leading-5 text-muted">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
              این صفحه از دیتابیس واقعی خوانده می‌شود؛ قیمت‌ها بر اساس واحد فایل (ریال/تومان) تبدیل
              شده‌اند. برای تاریخچه کامل، هر هفته فایل جدید را با همان IRC وارد کنید.
            </p>
            <Link href="/import" className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-medium text-brand hover:text-brand-dark">
              ثبت داده جدید
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num mt-0.5 text-[11.5px] font-bold text-ink-soft">{value}</p>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num mt-0.5 text-[10.5px] font-semibold text-ink-soft">{value}</p>
    </div>
  );
}

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd
        dir={mono ? "ltr" : undefined}
        className={`text-end leading-5 ${mono ? "font-mono text-[8.5px] text-ink-soft" : "font-medium text-ink-soft"}`}
      >
        {value}
      </dd>
    </div>
  );
}

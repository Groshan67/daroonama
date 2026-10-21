import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Archive, ChevronLeft, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PriceChange } from "@/components/drug/price-change";
import { DRUGS, getRevisionArchive } from "@/lib/data";
import { faNum, faPercent } from "@/lib/format";
import { formatJalali, jalaliYear } from "@/lib/jalali";

export const metadata: Metadata = {
  title: "آرشیو بازنگری قیمت",
  description: "خلاصه بازنگری‌های سالانه قیمت دارو، تعداد اقلام و بیشترین تغییرات.",
};

type RawParams = Record<string, string | string[] | undefined>;

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const years = getRevisionArchive();
  const requested = Array.isArray(params.year) ? params.year[0] : params.year;
  const selectedYear = Number(requested) || years[0]?.year || 1405;
  const selected = years.find((item) => item.year === selectedYear) ?? years[0];

  const revisions = DRUGS.flatMap((drug) =>
    drug.revisions
      .filter((revision) => jalaliYear(revision.date) === selected?.year)
      .map((revision) => ({ drug, revision })),
  ).sort((a, b) => b.revision.change - a.revision.change);

  const maxChange = revisions[0]?.revision.change ?? 0;
  const avgAll = years.length
    ? years.reduce((sum, item) => sum + item.avgChange, 0) / years.length
    : 0;
  const totalRevisions = years.reduce((sum, item) => sum + item.revisions, 0);

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "ابزارها" }, { label: "آرشیو بازنگری" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-emerald" />
            تاریخچه تغییرات قیمت
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            آرشیو بازنگری قیمت
          </h1>
          <p className="mt-1.5 max-w-[650px] text-[12px] leading-6 text-muted">
            خلاصه {faNum(years.length)} دوره بازنگری سالانه؛ تعداد اقلام، میانگین تغییر و بیشترین
            افزایش‌های ثبت‌شده. برای دیدن تاریخ‌های پیش‌رو، تقویم بازنگری را ببینید.
          </p>
        </div>
        <Link href="/calendar" className="btn-secondary">
          تقویم بازنگری
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:max-w-[720px] lg:grid-cols-4">
        <Stat label="دوره‌های ثبت‌شده" value={`${faNum(years.length)} سال`} />
        <Stat label="کل بازنگری‌ها" value={`${faNum(totalRevisions)} مورد`} />
        <Stat label="میانگین تغییر" value={faPercent(avgAll)} tone="rose" />
        <Stat label="بیشترین افزایش سال" value={faPercent(maxChange)} tone="rose" />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {years.map((item) => (
          <Link
            key={item.year}
            href={`/archive?year=${item.year}`}
            className={`num rounded-lg border px-3 py-1.5 text-[11px] transition ${
              item.year === selected?.year
                ? "border-[#b7d3f3] bg-[#eef5fe] font-bold text-brand-dark"
                : "border-line bg-white text-muted hover:border-[#c8dcf2] hover:text-brand"
            }`}
          >
            {faNum(item.year)}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-4">
          <section className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="text-[13px] font-bold text-ink">خلاصه دوره‌ها</h2>
                <p className="mt-0.5 text-[10px] text-faint">روند تعداد اقلام و میانگین تغییر سالانه</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] text-faint">
                <Archive className="h-3 w-3" />
                بر اساس داده‌های ثبت‌شده
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-[10.5px]">
                <thead>
                  <tr className="border-b border-line/60 text-[9px] text-faint">
                    <th className="px-4 py-2 text-start font-medium">سال</th>
                    <th className="px-3 py-2 text-start font-medium">اقلام بازنگری‌شده</th>
                    <th className="px-3 py-2 text-start font-medium">تعداد بازنگری</th>
                    <th className="px-3 py-2 text-start font-medium">میانگین تغییر</th>
                    <th className="px-3 py-2 text-start font-medium">بیشترین تغییر</th>
                    <th className="px-4 py-2 text-start font-medium">آخرین تاریخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {years.map((item) => (
                    <tr
                      key={item.year}
                      className={`transition-colors hover:bg-surface-soft ${
                        item.year === selected?.year ? "bg-[#f8fbff]" : ""
                      }`}
                    >
                      <td className="num px-4 py-2.5 font-semibold text-ink">
                        <Link href={`/archive?year=${item.year}`} className="hover:text-brand">
                          {faNum(item.year)}
                        </Link>
                      </td>
                      <td className="num px-3 py-2.5 text-muted">{faNum(item.items)}</td>
                      <td className="num px-3 py-2.5 text-muted">{faNum(item.revisions)}</td>
                      <td className="px-3 py-2.5">
                        <PriceChange value={item.avgChange} compact />
                      </td>
                      <td className="px-3 py-2.5">
                        <PriceChange value={item.maxChange} compact />
                      </td>
                      <td className="num px-4 py-2.5 text-[9.5px] text-faint">{item.latestLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                  <TrendingUp className="h-3.5 w-3.5 text-rose" />
                  بیشترین تغییرات سال {faNum(selected?.year ?? 0)}
                </h2>
                <p className="mt-0.5 text-[10px] text-faint">
                  {faNum(revisions.length)} بازنگری ثبت‌شده در این سال
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-[10.5px]">
                <thead>
                  <tr className="border-b border-line/60 text-[9px] text-faint">
                    <th className="px-4 py-2 text-start font-medium">دارو</th>
                    <th className="px-3 py-2 text-start font-medium">تاریخ</th>
                    <th className="px-3 py-2 text-start font-medium">قیمت قبلی</th>
                    <th className="px-3 py-2 text-start font-medium">قیمت جدید</th>
                    <th className="px-4 py-2 text-start font-medium">تغییر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {revisions.slice(0, 10).map(({ drug, revision }) => (
                    <tr key={`${drug.code}-${revision.date}`} className="transition-colors hover:bg-surface-soft">
                      <td className="px-4 py-2.5">
                        <Link href={`/drug/${drug.code}`} className="font-medium text-ink hover:text-brand">
                          {drug.name}
                        </Link>
                        <span className="ms-1.5 text-[8.5px] text-faint">{drug.strength}</span>
                      </td>
                      <td className="px-3 py-2.5 text-[9.5px] text-muted">{formatJalali(revision.date)}</td>
                      <td className="num px-3 py-2.5 text-muted">{faNum(revision.from)}</td>
                      <td className="num px-3 py-2.5 text-ink-soft">{faNum(revision.to)}</td>
                      <td className="px-4 py-2.5">
                        <PriceChange value={revision.change} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {revisions.length === 0 && (
                <p className="py-8 text-center text-[10.5px] text-faint">برای این سال بازنگری ثبت نشده است.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">
              دوره {faNum(selected?.year ?? 0)}
            </h2>
            <dl className="space-y-2.5 text-[10.5px]">
              <Row label="اقلام بازنگری‌شده" value={`${faNum(selected?.items ?? 0)} قلم`} />
              <Row label="تعداد بازنگری" value={`${faNum(selected?.revisions ?? 0)} مورد`} />
              <Row label="میانگین تغییر" value={faPercent(selected?.avgChange ?? 0)} />
              <Row label="بیشترین تغییر" value={faPercent(selected?.maxChange ?? 0)} />
              <Row label="آخرین تاریخ" value={selected?.latestLabel ?? "—"} />
            </dl>
          </section>

          <section className="rounded-xl border border-[#d6e6f7] bg-gradient-to-b from-[#f6faff] to-white p-4">
            <h2 className="text-[11.5px] font-bold text-ink">این اعداد چه می‌گویند؟</h2>
            <p className="mt-1.5 text-[9.5px] leading-5 text-muted">
              بازنگری سالانه معمولاً با افزایش قیمت همراه است؛ اما دامنه تغییر بین گروه‌های درمانی
              متفاوت است. برای مقایسه دقیق، تغییر هر قلم را در صفحه دارو ببینید.
            </p>
            <Link href="/insights" className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-brand hover:text-brand-dark">
              مطالعه گزارش
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2 text-[12px] font-bold text-ink">دسترسی سریع</h2>
            <div className="space-y-1">
              <Link href="/calendar" className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand">
                <CalendarIcon />
                تقویم بازنگری ۱۴۰۵
                <ChevronLeft className="ms-auto h-3 w-3 text-faint/50" />
              </Link>
              <Link href="/screener?status=transitional" className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand">
                <Archive className="h-3.5 w-3.5 text-faint" />
                فیلتر اقلام انتقالی
                <ChevronLeft className="ms-auto h-3 w-3 text-faint/50" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "rose" }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className={`num mt-0.5 text-[12px] font-bold ${tone === "rose" ? "text-[#b84d64]" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className="num text-end font-medium leading-5 text-ink-soft">{value}</dd>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-faint" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

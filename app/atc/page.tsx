import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Database, Layers, Network, Upload } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getAtcCounts, getAtcRoots, isAtcLoaded } from "@/lib/atc";
import { faNum } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "سلسله‌مراتب ATC",
  description: "طبقه‌بندی پنج‌سطحی ATC، از گروه اصلی تا ماده مؤثره.",
};

const LEVEL_LABELS = [
  "گروه اصلی",
  "زیرگروه درمانی",
  "زیرگروه فارماکولوژیک",
  "زیرگروه شیمیایی/درمانی",
  "ماده مؤثره",
];

export default function AtcPage() {
  const loaded = isAtcLoaded();
  const counts = getAtcCounts();
  const roots = getAtcRoots();
  const total = counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "داده" }, { label: "سلسله‌مراتب ATC" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-violet" />
            طبقه‌بندی بین‌المللی دارو
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            سلسله‌مراتب ATC
          </h1>
          <p className="mt-1.5 max-w-[690px] text-[12px] leading-6 text-muted">
            هر کد ATC از سطح ۱ (گروه اصلی) تا سطح ۵ (ماده مؤثره) تفکیک شده است. محصولات واردشده
            از طریق کد ATC به همین درخت متصل می‌شوند.
          </p>
        </div>
        <Link href="/imported" className="btn-secondary">
          کاوش محصولات
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      {!loaded ? (
        <div className="surface-card mt-6 flex flex-col items-center px-5 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0ecfd] text-violet">
            <Network className="h-6 w-6" />
          </span>
          <h2 className="mt-3 text-[14px] font-bold text-ink">درخت ATC هنوز وارد نشده است</h2>
          <p className="mt-1.5 max-w-md text-[10.5px] leading-6 text-muted">
            فایل ATC را با اسکریپت ورود داده کنید. پس از آن، سطوح و محصولات هر شاخه قابل مرور است.
          </p>
          <code dir="ltr" className="mt-3 rounded-lg bg-ink px-3 py-2 text-[10px] text-white">
            node scripts/import-atc.mjs atc.csv
          </code>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((level) => {
              const count = counts.find((item) => item.level === level)?.count ?? 0;
              return (
                <div key={level} className="surface-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] text-faint">سطح {faNum(level)}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0ecfd] text-[8px] font-bold text-violet">
                      {faNum(level)}
                    </span>
                  </div>
                  <p className="num mt-1 text-[12px] font-bold text-ink-soft">{faNum(count)} کد</p>
                  <p className="mt-0.5 text-[8px] text-faint">{LEVEL_LABELS[level - 1]}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-[9px] text-faint">
            <Database className="h-3.5 w-3.5 text-brand" />
            <span className="num">{faNum(total)} کد ATC در دیتابیس</span>
            <span className="h-1 w-1 rounded-full bg-line-strong" />
            <span>ریشه‌ها: {faNum(roots.length)} گروه اصلی</span>
            <Link href="/import" className="ms-auto inline-flex items-center gap-1 text-brand hover:text-brand-dark">
              ورود داده جدید
              <Upload className="h-3 w-3" />
            </Link>
          </div>

          <section className="mt-5">
            <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] text-faint">
              <Layers className="h-3.5 w-3.5 text-violet" />
              گروه‌های اصلی
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roots.map((root) => (
                <Link
                  key={root.code}
                  href={`/atc/${root.code}`}
                  className="surface-card group flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-[#d8cdf7] hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0ecfd] text-[13px] font-extrabold text-violet">
                    {root.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-bold leading-5 text-ink group-hover:text-[#6144c2]">
                      {root.name_fa || root.name_en}
                    </span>
                    <span dir="ltr" className="mt-0.5 block truncate text-start text-[8.5px] text-faint">
                      {root.name_en}
                    </span>
                    <span className="mt-2 flex items-center gap-2 text-[8.5px] text-faint">
                      <span>{faNum(root.children_count)} زیرگروه</span>
                      <span className="h-1 w-1 rounded-full bg-line-strong" />
                      <span className="num">{faNum(root.product_count)} محصول</span>
                    </span>
                  </span>
                  <ArrowLeft className="mt-1 h-3.5 w-3.5 text-faint/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-violet" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

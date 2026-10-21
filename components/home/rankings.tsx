import Link from "next/link";
import { ArrowLeft, Building2, ChevronLeft, Pill } from "lucide-react";
import { faNum } from "@/lib/format";
import type { CompanyStats, DrugSummary } from "@/lib/data/types";

const RANK_STYLES = [
  "bg-[#fdf3dc] text-[#a97713] ring-[#f3e3bb]",
  "bg-[#eef2f6] text-[#697d91] ring-[#e1e8ef]",
  "bg-[#fbeee4] text-[#b1774a] ring-[#f0ddcd]",
  "bg-[#f4f8fd] text-[#8296aa] ring-[#e7eef6]",
  "bg-[#f4f8fd] text-[#8296aa] ring-[#e7eef6]",
];

export function Rankings({
  drugs,
  companies,
}: {
  drugs: DrugSummary[];
  companies: CompanyStats[];
}) {
  return (
    <section aria-label="رتبه‌بندی‌های برجسته" className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
          <span className="h-3 w-[3px] rounded-full bg-teal/50" />
          رتبه‌بندی‌های برجسته
        </h2>
        <Link
          href="/search?sort=views"
          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand"
        >
          مشاهده همه
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <PanelHeader
            title="داروهای پربازدید"
            subtitle="بر اساس بازدید ۳۰ روز گذشته"
            icon={<Pill className="h-4 w-4" strokeWidth={1.9} />}
            href="/search?sort=views"
          />
          <ul className="divide-y divide-line/60 px-1.5 pb-1.5">
            {drugs.slice(0, 5).map((drug, index) => (
              <li key={drug.code}>
                <Link
                  href={`/drug/${drug.code}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-soft"
                >
                  <RankBadge index={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-6 text-ink group-hover:text-brand-dark">
                      {drug.name}
                    </span>
                    <span className="block truncate text-[11px] leading-5 text-faint">
                      {drug.ingredientName} · {drug.form} {drug.strength}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="num block text-[12px] font-semibold leading-5 text-ink-soft">
                      {faNum(drug.price)}
                    </span>
                    <span className="block text-[9.5px] leading-4 text-faint">تومان</span>
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-faint/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card overflow-hidden">
          <PanelHeader
            title="سازندگان پربازدید"
            subtitle="بر اساس مجموع بازدید محصولات"
            icon={<Building2 className="h-4 w-4" strokeWidth={1.9} />}
            href="/companies"
          />
          <ul className="divide-y divide-line/60 px-1.5 pb-1.5">
            {companies.slice(0, 5).map((company, index) => (
              <li key={company.id}>
                <Link
                  href={`/company/${company.id}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-soft"
                >
                  <RankBadge index={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-6 text-ink group-hover:text-brand-dark">
                      {company.name}
                    </span>
                    <span className="block truncate text-[11px] leading-5 text-faint">
                      {company.nameEn}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="num block text-[12px] font-semibold leading-5 text-ink-soft">
                      {faNum(company.drugCount)}
                    </span>
                    <span className="block text-[9.5px] leading-4 text-faint">قلم فهرست‌شده</span>
                  </span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-faint/40 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({
  title,
  subtitle,
  icon,
  href,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-line/70 px-4 py-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-tint text-brand">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-bold leading-5 text-ink">{title}</h3>
        <p className="text-[10px] leading-4 text-faint">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="ms-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-brand/80 hover:text-brand-dark"
      >
        همه
        <ArrowLeft className="h-3 w-3" />
      </Link>
    </div>
  );
}

function RankBadge({ index }: { index: number }) {
  return (
    <span
      className={`num flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ${
        RANK_STYLES[index] ?? RANK_STYLES[4]
      }`}
    >
      {faNum(index + 1)}
    </span>
  );
}

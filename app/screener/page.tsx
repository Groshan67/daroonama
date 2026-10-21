import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ScreenerTool } from "@/components/tools/screener-tool";
import {
  CATEGORIES_WITH_STATS,
  COMPANIES_WITH_STATS,
  DRUGS,
  toSummary,
} from "@/lib/data";
import { DRUG_FORMS } from "@/lib/search";
import { faNum } from "@/lib/format";

export const metadata: Metadata = {
  title: "جستجوی شرطی دارو",
  description: "فیلتر داروها بر اساس دسته، سازنده، قیمت، شکل دارویی و وضعیت بازنگری با خروجی CSV.",
};

type RawParams = Record<string, string | string[] | undefined>;

function param(params: RawParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const drugs = DRUGS.map(toSummary);
  const otcCount = drugs.filter((drug) => drug.isOtc).length;
  const transitionalCount = drugs.filter((drug) => drug.status === "transitional").length;

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "ابزارها" }, { label: "جستجوی شرطی" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-violet" />
            فیلتر چندشرطی
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            جستجوی شرطی
          </h1>
          <p className="mt-1.5 max-w-[650px] text-[12px] leading-6 text-muted">
            داروها را هم‌زمان بر اساس دسته، سازنده، قیمت، شکل دارویی، نوع عرضه و وضعیت بازنگری
            فیلتر کنید و خروجی CSV بگیرید.
          </p>
        </div>
        <div className="flex gap-2">
          <Pill label="کل اقلام" value={faNum(drugs.length)} />
          <Pill label="بدون نسخه" value={faNum(otcCount)} />
          <Pill label="انتقالی" value={faNum(transitionalCount)} />
        </div>
      </div>

      <div className="mt-6">
        <ScreenerTool
          drugs={drugs}
          categories={CATEGORIES_WITH_STATS.map((category) => ({ id: category.id, name: category.name }))}
          companies={COMPANIES_WITH_STATS.map((company) => ({ id: company.id, name: company.name }))}
          forms={DRUG_FORMS}
          initialFilters={{
            status: param(params, "status"),
            category: param(params, "category"),
            otc: param(params, "otc"),
            max: param(params, "max"),
          }}
        />
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-sm">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num text-[12px] font-bold text-ink-soft">{value}</p>
    </div>
  );
}

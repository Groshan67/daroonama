import Link from "next/link";
import { HomeSearch } from "@/components/home/home-search";
import { SearchCards, ToolCards } from "@/components/home/explore-cards";
import { ReadBanner } from "@/components/home/read-banner";
import {
  RealCategoryGrid,
  RealHighlights,
  RealIngredientChips,
  RealRankings,
} from "@/components/home/real-sections";
import { getCatalogHome } from "@/lib/catalog/queries";
import { faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const data = getCatalogHome();
  const { summary } = data;
  const lastImport = summary.lastImportAt ? formatJalali(summary.lastImportAt) : "—";

  return (
    <div className="pb-2">
      <section className="relative z-40">
        <div className="page-container relative pb-2 pt-8 sm:pt-11 lg:pt-12">
          <div className="hero-glow mx-auto max-w-[900px] text-center">
            <div className="fade inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-white/90 bg-white/65 px-3.5 py-1.5 text-[10px] leading-5 text-muted shadow-[0_2px_10px_rgba(23,61,110,0.04)] backdrop-blur">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-soft">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#28b39c] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1aa38d]" />
                </span>
                داده رسمی: {faNum(summary.total)} محصول جاری
              </span>
              <span className="h-3 w-px bg-line-strong" />
              <span>آخرین فایل: {lastImport}</span>
            </div>

            <h1 className="text-balance mt-5 text-[26px] font-extrabold leading-[1.55] tracking-[-0.015em] text-ink sm:text-[34px] sm:leading-[1.5] lg:text-[40px]">
              قیمت دارو، مقایسه ژنریک
              <span className="block sm:inline"> و روند واقعی قیمت؛</span>
              <br className="hidden sm:block" />{" "}
              <span className="bg-gradient-to-l from-[#2f6fce] via-[#2b7fc0] to-[#159a89] bg-clip-text text-transparent">
                همه در یک صفحه
              </span>
            </h1>

            <p className="mx-auto mt-3.5 max-w-[620px] text-pretty text-[12.5px] leading-6 text-muted sm:text-[13.5px] sm:leading-7">
              {faNum(summary.records)} رکورد رسمی، {faNum(summary.ingredients)} ماده مؤثره و{" "}
              {faNum(summary.companies)} صاحب برند؛ جستجو کنید، قیمت‌ها را مقایسه کنید و مسیر ATC
              هر محصول را ببینید.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
              <span>
                <strong className="num font-bold text-ink">{faNum(summary.priced)}</strong> محصول
                دارای قیمت
              </span>
              <span className="h-1 w-1 rounded-full bg-line-strong" />
              <span>{faNum(summary.supplements)} مکمل</span>
              <span className="hidden h-1 w-1 rounded-full bg-line-strong sm:block" />
              <span className="hidden sm:inline">{faNum(summary.atcNodes)} کد ATC</span>
            </div>

            <HomeSearch />

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Link href="/drug-prices" className="btn-secondary">
                نرخ دارو و استعلام قیمت
              </Link>
              <Link href="/compare" className="btn-secondary">
                مقایسه قیمت دارو
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container mt-9 sm:mt-10">
        <RealHighlights summary={summary} />
        <RealRankings topPriced={data.topPriced} companies={data.companies} />

        <SearchCards />
        <ToolCards />
        <RealCategoryGrid categories={data.categories} />
        <RealIngredientChips ingredients={data.ingredients} />
        <ReadBanner />

        <div className="mt-6 rounded-xl border border-dashed border-line-strong/70 bg-white/40 px-3.5 py-2.5 text-[9px] leading-5 text-faint">
          این صفحه روی دیتابیس واقعی اجرا می‌شود. {faNum(summary.records)} رکورد خام در دیتابیس
          ثبت شده و {faNum(summary.aliases)} IRC قدیمی/تکراری به محصول جاری متصل شده‌اند.{" "}
          {faNum(summary.noPrice)} محصول (از جمله همه مکمل‌ها) در فایل منبع قیمت ندارند.
        </div>

        <div className="mt-9 border-t border-dashed border-line-strong/70" />
      </div>
    </div>
  );
}

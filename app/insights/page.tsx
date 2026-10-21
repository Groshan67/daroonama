import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft, Clock, Database, FileText, Layers, Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PriceIndexChart } from "@/components/charts/price-index";
import { ARTICLES } from "@/lib/data/articles";
import { getPriceIndexSeries } from "@/lib/data";
import { faDigits, faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

export const metadata: Metadata = {
  title: "توضیح سیستم و گزارش‌ها",
  description: "مقاله‌ها و گزارش‌های تحلیلی درباره قیمت‌گذاری دارو، بازنگری و مقایسه ژنریک.",
};

export default function InsightsPage() {
  const featured = ARTICLES[0];
  const rest = ARTICLES.slice(1);
  const series = getPriceIndexSeries();

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "مطالعه" }, { label: "توضیح سیستم و گزارش‌ها" }]} />
      <div className="max-w-[760px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-brand" />
          مطالعه و تحلیل
        </p>
        <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
          توضیح سیستم و گزارش داده‌ها
        </h1>
        <p className="mt-1.5 text-[12px] leading-6 text-muted">
          درباره سازوکار قیمت‌گذاری، بازنگری سالانه و روش‌های درست مقایسه قیمت دارو؛ همراه با
          گزارش تصویری شاخص قیمت.
        </p>
      </div>

      <Link
        href={`/insights/${featured.slug}`}
        className="group surface-card relative mt-5 block overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
      >
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#5b93e8] via-[#2f6fce] to-[#159a89]" />
        <span className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(91,147,232,0.14),transparent)]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[660px]">
            <span className="rounded-full bg-[#eef5fe] px-2.5 py-1 text-[9px] font-medium text-brand-dark">
              {featured.category} · مقاله ویژه
            </span>
            <h2 className="mt-3 text-[19px] font-extrabold leading-8 text-ink transition-colors group-hover:text-brand-dark sm:text-[22px]">
              {featured.title}
            </h2>
            <p className="mt-2 text-[11.5px] leading-6 text-muted">{featured.excerpt}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] text-faint">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {faNum(featured.readingMinutes)} دقیقه مطالعه
              </span>
              <span className="h-1 w-1 rounded-full bg-line-strong" />
              <span>به‌روزرسانی {formatJalali(featured.updatedAt)}</span>
            </div>
          </div>
          <span className="btn-primary mt-1 hidden sm:inline-flex">
            خواندن مقاله
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>

      <div className="mt-4 grid gap-3.5 md:grid-cols-2">
        {rest.map((article) => (
          <Link
            key={article.slug}
            href={`/insights/${article.slug}`}
            className="group surface-card flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-[#cbdff4] hover:shadow-lift"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-tint text-brand">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span className="text-[9px] font-medium text-brand/80">{article.category}</span>
              <span className="ms-auto inline-flex items-center gap-1 text-[8.5px] text-faint">
                <Clock className="h-2.5 w-2.5" />
                {faNum(article.readingMinutes)} دقیقه
              </span>
            </div>
            <h2 className="mt-2 text-[13px] font-bold leading-6 text-ink transition-colors group-hover:text-brand-dark">
              {article.title}
            </h2>
            <p className="mt-1 line-clamp-2 text-[10.5px] leading-5 text-muted">{article.excerpt}</p>
            <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-medium text-brand">
              ادامه مطلب
              <ChevronLeft className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface-card p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-bold text-ink">شاخص قیمت در یک نگاه</h2>
            <span className="text-[9px] text-faint">میانگین اقلام نمونه</span>
          </div>
          <PriceIndexChart data={series} />
          <p className="mt-1 text-[9px] leading-5 text-faint">
            شاخص با نرمال‌سازی قیمت هر قلم به سال ۱۳۹۵ محاسبه شده و روند نسبی بازار را نشان می‌دهد؛
            نه سطح مطلق قیمت‌ها را.
          </p>
        </section>

        <section className="surface-card p-4">
          <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">
            سیستم چگونه کار می‌کند؟
          </h2>
          <div className="space-y-3">
            <Method
              icon={<Database className="h-3.5 w-3.5" />}
              title="داده ساختاریافته"
              text="هر قلم با کد IRC، ماده مؤثره، سازنده، بسته‌بندی و تاریخ بازنگری ثبت می‌شود."
            />
            <Method
              icon={<Layers className="h-3.5 w-3.5" />}
              title="مقایسه هم‌ماده"
              text="محصولات یک ماده مؤثره بر اساس قیمت هر واحد و هزینه ماهانه مقایسه می‌شوند."
            />
            <Method
              icon={<Scale className="h-3.5 w-3.5" />}
              title="شفافیت محدودیت‌ها"
              text="داده‌ها نمونه و آموزشی‌اند و جایگزین فهرست رسمی یا مشاوره درمانی نیستند."
            />
          </div>
          <Link href="/about" className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium text-brand hover:text-brand-dark">
            درباره داده‌ها
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function Method({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-tint text-brand">
        {icon}
      </span>
      <div>
        <p className="text-[10.5px] font-semibold text-ink-soft">{title}</p>
        <p className="mt-0.5 text-[9px] leading-5 text-faint">{text}</p>
      </div>
    </div>
  );
}

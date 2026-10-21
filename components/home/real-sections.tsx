import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  CircleDollarSign,
  Layers,
  Network,
  Pill,
  Sparkles,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { ACCENTS } from "@/components/accents";
import { faNum, faPercent, faPrice, formatDose, productTypeLabel } from "@/lib/format";
import type {
  CatalogCategory,
  CatalogCompany,
  CatalogIngredient,
  CatalogProduct,
  CatalogSummary,
} from "@/lib/catalog/types";

const RANK_STYLES = [
  "bg-[#fdf3dc] text-[#a97713] ring-[#f3e3bb]",
  "bg-[#eef2f6] text-[#697d91] ring-[#e1e8ef]",
  "bg-[#fbeee4] text-[#b1774a] ring-[#f0ddcd]",
  "bg-[#f4f8fd] text-[#8296aa] ring-[#e7eef6]",
  "bg-[#f4f8fd] text-[#8296aa] ring-[#e7eef6]",
];

export function RealHighlights({ summary }: { summary: CatalogSummary }) {
  const items = [
    {
      value: `${faNum(summary.priced)} قلم`,
      title: "محصول دارای قیمت",
      caption: `از ${faNum(summary.total)} محصول جاری`,
      href: "/search?priced=1",
      icon: CircleDollarSign,
      iconClass: "bg-[#eaf2fe] text-[#2f6fce]",
      ring: "group-hover:border-[#c3dbf6]",
    },
    {
      value: `${faNum(summary.supplements)} قلم`,
      title: "مکمل غذایی",
      caption: "ProductType = 28 · بدون قیمت در فایل منبع",
      href: "/search?type=28",
      icon: Sparkles,
      iconClass: "bg-[#e6f7f3] text-[#159a89]",
      ring: "group-hover:border-[#b9e4db]",
    },
    {
      value: `${faNum(summary.atcNodes)} کد`,
      title: "سلسله‌مراتب ATC",
      caption: "پنج سطح، از گروه اصلی تا ماده مؤثره",
      href: "/atc",
      icon: Network,
      iconClass: "bg-[#f0ecfd] text-[#6749c6]",
      ring: "group-hover:border-[#d7cdf7]",
    },
  ];

  return (
    <section aria-labelledby="highlights-title">
      <SectionLabel id="highlights-title" action={{ href: "/search", label: "کاوش کامل داده" }}>
        هایلایت‌های داده واقعی
      </SectionLabel>
      <div className="grid gap-3.5 sm:grid-cols-3">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={`group surface-card rise relative flex min-h-[96px] items-start gap-3.5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${item.ring}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="num block text-[22px] font-extrabold leading-8 tracking-tight text-ink">
                  {item.value}
                </span>
                <span className="mt-0.5 block text-[12.5px] font-semibold leading-5 text-ink-soft">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[10.5px] leading-5 text-faint">{item.caption}</span>
              </span>
              <ChevronLeft className="mt-3 h-4 w-4 shrink-0 text-faint/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function RealRankings({
  topPriced,
  companies,
}: {
  topPriced: CatalogProduct[];
  companies: CatalogCompany[];
}) {
  return (
    <section aria-label="رتبه‌بندی‌های داده واقعی" className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
          <span className="h-3 w-[3px] rounded-full bg-teal/50" />
          رتبه‌بندی‌های داده واقعی
        </h2>
        <Link href="/search?sort=price-desc" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand">
          مشاهده همه
          <ChevronLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <PanelHeader
            title="گران‌ترین محصولات"
            subtitle="بر اساس آخرین قیمت ثبت‌شده در دیتابیس"
            icon={<Pill className="h-4 w-4" strokeWidth={1.9} />}
            href="/search?sort=price-desc"
          />
          <ul className="divide-y divide-line/60 px-1.5 pb-1.5">
            {topPriced.map((product, index) => (
              <li key={product.irc}>
                <Link
                  href={`/drug/${product.canonicalIrc}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-soft"
                >
                  <RankBadge index={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-6 text-ink group-hover:text-brand-dark">
                      {product.displayName}
                    </span>
                    <span className="block truncate text-[11px] leading-5 text-faint">
                      {product.ingredientNameFa || "بدون ماده مؤثره"} · {formatDose(product.dose) || product.dosageFormFa || ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="num block text-[12px] font-semibold leading-5 text-ink-soft">
                      {faPrice(product.priceToman ?? 0)}
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
            title="سازندگان با بیشترین تنوع"
            subtitle="بر اساس تعداد محصولات جاری در دیتابیس"
            icon={<Building2 className="h-4 w-4" strokeWidth={1.9} />}
            href="/search"
          />
          <ul className="divide-y divide-line/60 px-1.5 pb-1.5">
            {companies.map((company, index) => (
              <li key={company.id}>
                <Link
                  href={`/search?company=${encodeURIComponent(company.id)}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-soft"
                >
                  <RankBadge index={index} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-6 text-ink group-hover:text-brand-dark">
                      {company.name}
                    </span>
                    <span className="block truncate text-[11px] leading-5 text-faint">
                      {company.minPrice ? `کمترین قیمت: ${faPrice(company.minPrice)}` : "قیمت ثبت‌شده ندارد"}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="num block text-[12px] font-semibold leading-5 text-ink-soft">
                      {faNum(company.count)}
                    </span>
                    <span className="block text-[9.5px] leading-4 text-faint">محصول</span>
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

export function RealCategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  return (
    <section aria-labelledby="categories-title" className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id="categories-title" className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
          <span className="h-3 w-[3px] rounded-full bg-violet/50" />
          جستجوی مستقیم بر اساس طبقه‌بندی اثر دارویی
        </h2>
        <Link href="/search" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand">
          همه طبقه‌بندی‌ها
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category, index) => {
          const accent = ACCENTS[(category.accent as keyof typeof ACCENTS) ?? "blue"] ?? ACCENTS.blue;
          return (
            <Link
              key={category.id}
              href={`/search?category=${category.id}`}
              className={`group rise flex min-h-[66px] flex-col items-center justify-center gap-1 rounded-xl border border-line bg-white px-3 py-2.5 text-center shadow-[0_1px_2px_rgba(17,42,74,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${accent.ring}`}
              style={{ animationDelay: `${index * 35}ms` }}
            >
              <span className="flex items-center gap-1.5">
                <CategoryIcon
                  name={category.icon}
                  className={`h-3.5 w-3.5 ${accent.iconText} opacity-80`}
                  strokeWidth={1.9}
                />
                <span className="text-[12.5px] font-semibold leading-6 text-ink-soft transition-colors group-hover:text-brand-dark">
                  {category.name}
                </span>
              </span>
              <span className="num text-[9.5px] leading-4 text-faint">
                {faNum(category.ingredients)} ماده مؤثره · {faNum(category.count)} قلم
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-1 text-[10px] text-faint/80">
        <Layers className="h-3 w-3" />
        دسته‌بندی‌ها بر اساس گروه‌های درمانی ATC و نوع محصول (دارو/مکمل) سازماندهی شده‌اند.
      </div>
    </section>
  );
}

export function RealIngredientChips({ ingredients }: { ingredients: CatalogIngredient[] }) {
  return (
    <section aria-labelledby="ingredients-title" className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2 id="ingredients-title" className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
            <span className="h-3 w-[3px] rounded-full bg-teal/50" />
            جستجو بر اساس مواد مؤثره پرتکرار
          </h2>
          <span className="hidden text-[10px] text-faint/70 sm:inline">
            بر اساس تعداد محصولات جاری
          </span>
        </div>
        <Link href="/search" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand">
          همه مواد مؤثره
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <Link
            key={ingredient.key}
            href={`/search?q=${encodeURIComponent(ingredient.name)}`}
            className="chip group !gap-2 !bg-white/80 !py-[7px]"
          >
            <span>{ingredient.name}</span>
            <span className="num rounded-full bg-surface-tint px-1.5 py-0.5 text-[9px] leading-4 text-faint group-hover:bg-[#eaf2fe] group-hover:text-brand">
              {faNum(ingredient.count)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RealTypeBadge({ value }: { value: string | null }) {
  const supplement = String(value) === "28";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] ring-1 ${
        supplement
          ? "bg-[#f0ecfd] text-[#6144c2] ring-[#ddd5f8]"
          : "bg-[#eef5fe] text-[#2f5f9f] ring-[#d5e4f5]"
      }`}
    >
      {productTypeLabel(value)}
    </span>
  );
}

function SectionLabel({
  children,
  id,
  action,
}: {
  children: React.ReactNode;
  id?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
        <span className="h-3 w-[3px] rounded-full bg-brand/50" />
        {children}
      </h2>
      {action && (
        <Link href={action.href} className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand">
          {action.label}
          <ChevronLeft className="h-3 w-3" />
        </Link>
      )}
    </div>
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
      <Link href={href} className="ms-auto inline-flex items-center gap-1 text-[10.5px] font-medium text-brand/80 hover:text-brand-dark">
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

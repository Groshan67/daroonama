import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows, TrendingDown, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ComparePicker } from "@/components/compare/compare-picker";
import { getCatalogIngredient, getCatalogIngredients } from "@/lib/catalog/queries";
import type { CatalogIngredientDetail } from "@/lib/catalog/types";
import { faNum, faPrice } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type RawParams = Record<string, string | string[] | undefined>;

function param(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const a = param(params.a);
  const b = param(params.b);
  const left = a ? getCatalogIngredient(a) : undefined;
  const right = b ? getCatalogIngredient(b) : undefined;
  const title =
    left && right
      ? `مقایسه قیمت ${left.name} و ${right.name}`
      : "مقایسه قیمت دارو و محصولات هم‌ماده";
  return seoMetadata({
    title,
    description:
      "قیمت بسته، قیمت واحد، تعداد برند و بازه قیمت دو ماده مؤثره را کنار هم مقایسه کنید و ارزان‌ترین و گران‌ترین گزینه را ببینید.",
    path: "/compare",
    keywords: ["مقایسه قیمت دارو", "مقایسه داروها", "قیمت داروهای هم‌ماده", "ارزان‌ترین دارو"],
    noindex: Boolean(left || right),
  });
}

function priceStats(detail: CatalogIngredientDetail) {
  const prices = detail.products
    .map((product) => product.priceToman)
    .filter((value): value is number => value !== null);
  const average = prices.length
    ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
    : null;
  return { min: detail.stats.minPrice, max: detail.stats.maxPrice, average };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const a = param(params.a);
  const b = param(params.b);
  const left = a ? getCatalogIngredient(a) : undefined;
  const right = b ? getCatalogIngredient(b) : undefined;
  const popular = getCatalogIngredients(12);
  const canCompare = Boolean(left && right && left.key !== right.key);
  const faq = [
    {
      question: "مقایسه قیمت دارو بر چه مبنایی است؟",
      answer:
        "قیمت بسته و قیمت واحد هر محصول از فایل رسمی محاسبه می‌شود. قیمت بسته = ConsumerPrice × PackageCount و قیمت واحد = ConsumerPrice.",
    },
    {
      question: "چرا قیمت دو برند هم‌ماده متفاوت است؟",
      answer:
        "برند، شرکت سازنده، شکل دارویی، تعداد بسته و منبع قیمت می‌توانند متفاوت باشند؛ مقایسه باید بر اساس قیمت بسته و واحد انجام شود.",
    },
    {
      question: "ارزان‌ترین محصول هم‌ماده کدام است؟",
      answer:
        "در هر صفحه ماده مؤثره، محصولات بر اساس قیمت بسته مرتب می‌شوند و کمترین قیمت مشخص می‌شود؛ برای دقت بیشتر قیمت واحد را هم بررسی کنید.",
    },
  ];

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "مقایسه قیمت دارو" }]} />
      <div className="max-w-[820px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-[#159a89]" />
          مقایسه بر پایه داده واقعی
        </p>
        <h1 className="mt-1.5 text-[27px] font-extrabold leading-[1.5] tracking-tight text-ink sm:text-[34px]">
          مقایسه قیمت دارو و محصولات هم‌ماده
        </h1>
        <p className="mt-2 text-[12px] leading-6 text-muted sm:text-[12.5px]">
          دو ماده مؤثره را انتخاب کنید تا تعداد محصولات، بازه قیمت، ارزان‌ترین و گران‌ترین گزینه و
          قیمت بسته و واحد آن‌ها را کنار هم ببینید.
        </p>
      </div>

      <div className="mt-5">
        <ComparePicker
          initialA={left ? { key: left.key, name: left.name } : null}
          initialB={right ? { key: right.key, name: right.name } : null}
        />
      </div>

      {canCompare && left && right ? (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <CompareHead detail={left} tone="brand" />
            <CompareHead detail={right} tone="emerald" />
          </div>
          <div className="surface-card mt-3 overflow-hidden">
            <div className="border-b border-line/70 px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
                <GitCompareArrows className="h-4 w-4 text-brand" />
                جدول مقایسه
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] sm:min-w-[620px]">
                <thead className="bg-surface-soft text-[8.5px] text-faint">
                  <tr>
                    <th className="px-4 py-2 text-start font-medium">معیار</th>
                    <th className="px-4 py-2 text-start font-medium">{left.name}</th>
                    <th className="px-4 py-2 text-start font-medium">{right.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {[
                    ["تعداد محصول", faNum(left.stats.count), faNum(right.stats.count)],
                    ["تعداد صاحب برند", faNum(left.stats.brandOwners), faNum(right.stats.brandOwners)],
                    ["کد ژنریک", faNum(left.stats.genericCodes), faNum(right.stats.genericCodes)],
                    ["کمترین قیمت بسته", left.stats.minPrice !== null ? faPrice(left.stats.minPrice) : "—", right.stats.minPrice !== null ? faPrice(right.stats.minPrice) : "—"],
                    ["بیشترین قیمت بسته", left.stats.maxPrice !== null ? faPrice(left.stats.maxPrice) : "—", right.stats.maxPrice !== null ? faPrice(right.stats.maxPrice) : "—"],
                    ["میانگین قیمت بسته", priceStats(left).average !== null ? faPrice(priceStats(left).average!) : "—", priceStats(right).average !== null ? faPrice(priceStats(right).average!) : "—"],
                  ].map(([label, one, two]) => (
                    <tr key={label}>
                      <td className="px-4 py-2.5 font-medium text-ink-soft">{label}</td>
                      <td className="num px-4 py-2.5 text-muted">{one}</td>
                      <td className="num px-4 py-2.5 text-muted">{two}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CheapestList detail={left} />
            <CheapestList detail={right} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/ingredient/${encodeURIComponent(left.key)}`} className="btn-secondary">
              صفحه {left.name}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/ingredient/${encodeURIComponent(right.key)}`} className="btn-secondary">
              صفحه {right.name}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
            <Link href={`/compare/${encodeURIComponent(left.key)}`} className="btn-secondary">
              مقایسه مدل {left.name}
            </Link>
          </div>
        </>
      ) : (
        <section className="mt-5">
          <h2 className="text-[14px] font-bold text-ink">مقایسه‌های پرجستجو</h2>
          <p className="mt-1 text-[10px] text-faint">
            یکی از مواد مؤثره پرتکرار را انتخاب کنید؛ یا دو ماده را از کادر بالا جستجو کنید.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((item) => (
              <Link
                key={item.key}
                href={`/compare/${encodeURIComponent(item.key)}`}
                className="surface-card flex items-center justify-between gap-2 p-3 transition hover:border-[#b7d3f3]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-semibold text-ink">{item.name}</span>
                  <span className="mt-0.5 block text-[8.5px] text-faint">{faNum(item.count)} محصول</span>
                </span>
                <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-faint" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card mt-5 p-5">
        <h2 className="text-[16px] font-bold text-ink">پرسش‌های متداول مقایسه دارو</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-xl border border-line bg-surface-soft p-3">
              <summary className="cursor-pointer text-[10.5px] font-semibold text-ink-soft">
                {item.question}
              </summary>
              <p className="mt-2 text-[9.5px] leading-5 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />
    </div>
  );
}

function CompareHead({ detail, tone }: { detail: CatalogIngredientDetail; tone: "brand" | "emerald" }) {
  const stats = priceStats(detail);
  return (
    <section className={`surface-card p-4 ${tone === "emerald" ? "ring-1 ring-[#d3eee2]" : "ring-1 ring-[#d5e4f5]"}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-[15px] font-bold text-ink">{detail.name}</h2>
        <span className={`rounded-full px-2 py-0.5 text-[8px] ${tone === "emerald" ? "bg-[#eaf7f0] text-[#1c825f]" : "bg-[#eef5fe] text-brand"}`}>
          {faNum(detail.stats.count)} محصول
        </span>
      </div>
      <p className="mt-1 text-[9px] text-faint">{detail.nameEn ?? "—"}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/60 pt-2 text-[9px]">
        <div>
          <p className="text-faint">کمترین بسته</p>
          <p className="num mt-0.5 font-bold text-ink-soft">{stats.min !== null ? faNum(stats.min) : "—"}</p>
        </div>
        <div>
          <p className="text-faint">میانگین</p>
          <p className="num mt-0.5 font-bold text-ink-soft">{stats.average !== null ? faNum(stats.average) : "—"}</p>
        </div>
        <div>
          <p className="text-faint">بیشترین</p>
          <p className="num mt-0.5 font-bold text-ink-soft">{stats.max !== null ? faNum(stats.max) : "—"}</p>
        </div>
      </div>
    </section>
  );
}

function CheapestList({ detail }: { detail: CatalogIngredientDetail }) {
  const products = detail.products.filter((product) => product.priceToman !== null).slice(0, 4);
  const mostExpensive = [...products].sort((a, b) => (b.priceToman ?? 0) - (a.priceToman ?? 0))[0];
  return (
    <section className="surface-card p-4">
      <h3 className="text-[11px] font-bold text-ink">{detail.name}</h3>
      <div className="mt-2 space-y-1">
        {products.map((product) => (
          <Link key={product.irc} href={`/drug/${product.canonicalIrc}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[9px] hover:bg-surface-soft">
            <span className="min-w-0 truncate text-ink-soft">{product.displayName}</span>
            <span className="num shrink-0 text-ink-soft">{product.priceToman !== null ? faPrice(product.priceToman) : "—"}</span>
          </Link>
        ))}
      </div>
      {mostExpensive && (
        <p className="mt-2 flex items-center gap-1 border-t border-line/60 pt-2 text-[8.5px] text-faint">
          <TrendingUp className="h-3 w-3 text-[#c47a20]" />
          گران‌ترین گزینه: <span className="num">{faPrice(mostExpensive.priceToman!)}</span>
        </p>
      )}
      {!products.length && (
        <p className="mt-2 flex items-center gap-1 text-[9px] text-faint">
          <TrendingDown className="h-3 w-3" /> قیمت بسته‌ای ثبت نشده است.
        </p>
      )}
    </section>
  );
}

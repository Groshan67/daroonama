import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, GitCompareArrows } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductTable } from "@/components/catalog/product-table";
import { getCatalogIngredient, getCatalogIngredients } from "@/lib/catalog/queries";
import type { CatalogIngredientDetail } from "@/lib/catalog/types";
import { faNum, faPrice } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = getCatalogIngredient(slug);
  if (!detail) return { title: "مقایسه پیدا نشد" };
  return seoMetadata({
    title: `مقایسه قیمت ${detail.name} | ارزان‌ترین و گران‌ترین محصولات`,
    description: `مقایسه قیمت ${detail.name}: ${faNum(detail.stats.count)} محصول، ${faNum(detail.stats.brandOwners)} صاحب برند${detail.stats.minPrice !== null ? `، از ${faPrice(detail.stats.minPrice)}` : ""}.`,
    path: `/compare/${encodeURIComponent(detail.key)}`,
    keywords: [
      `مقایسه قیمت ${detail.name}`,
      `قیمت ${detail.name}`,
      "مقایسه قیمت دارو",
      "محصولات هم‌ماده",
    ],
  });
}

export default async function CompareIngredientPage({ params }: PageProps) {
  const { slug } = await params;
  const detail = getCatalogIngredient(slug);
  if (!detail) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-[20px] font-bold text-ink">مقایسه پیدا نشد</h1>
        <Link href="/compare" className="btn-primary mt-4 inline-flex">
          بازگشت به مقایسه
        </Link>
      </div>
    );
  }

  const priced = detail.products.filter((product) => product.priceToman !== null);
  const cheapest = priced[0];
  const expensive = priced[priced.length - 1];
  const popular = getCatalogIngredients(8).filter((item) => item.key !== detail.key);
  const faq = [
    {
      question: `قیمت ${detail.name} چقدر است؟`,
      answer: detail.stats.minPrice !== null
        ? `کمترین قیمت بسته ${faPrice(detail.stats.minPrice)} و بیشترین ${detail.stats.maxPrice !== null ? faPrice(detail.stats.maxPrice) : "نامشخص"} است.`
        : `برای ${detail.name} قیمت بسته ثبت نشده است.`,
    },
    {
      question: `چند محصول ${detail.name} در دیتابیس وجود دارد؟`,
      answer: `${faNum(detail.stats.count)} محصول از ${faNum(detail.stats.brandOwners)} صاحب برند در دیتابیس ثبت شده است.`,
    },
    {
      question: "برای مقایسه دقیق‌تر چه چیزی را بررسی کنیم؟",
      answer: "قیمت بسته، قیمت واحد، تعداد بسته، شکل دارویی و شرکت سازنده را با هم مقایسه کنید.",
    },
  ];

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs
        items={[
          { label: "مقایسه قیمت دارو", href: "/compare" },
          { label: detail.name },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-[#159a89]" />
            {faNum(detail.stats.count)} محصول · {faNum(detail.stats.brandOwners)} صاحب برند
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold leading-[1.5] text-ink sm:text-[32px]">
            مقایسه قیمت {detail.name}
          </h1>
          <p className="mt-1.5 max-w-[760px] text-[12px] leading-6 text-muted">
            ارزان‌ترین و گران‌ترین محصولات هم‌ماده، بازه قیمت بسته و واحد و فهرست کامل برندها.
          </p>
        </div>
        <Link href={`/compare?a=${encodeURIComponent(detail.key)}`} className="btn-secondary">
          <GitCompareArrows className="h-3.5 w-3.5" />
          مقایسه با ماده دیگر
        </Link>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Summary label="کمترین قیمت بسته" value={detail.stats.minPrice !== null ? faPrice(detail.stats.minPrice) : "—"} />
        <Summary label="بیشترین قیمت بسته" value={detail.stats.maxPrice !== null ? faPrice(detail.stats.maxPrice) : "—"} />
        <Summary label="تنوع کد ژنریک" value={faNum(detail.stats.genericCodes)} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <SideCard title="ارزان‌ترین گزینه" product={cheapest} tone="emerald" />
        <SideCard title="گران‌ترین گزینه" product={expensive} tone="amber" />
      </div>

      <section className="surface-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
          <h2 className="text-[13px] font-bold text-ink">فهرست محصولات هم‌ماده</h2>
          <Link href={`/ingredient/${encodeURIComponent(detail.key)}`} className="inline-flex items-center gap-1 text-[10px] font-medium text-brand">
            صفحه کامل ماده مؤثره
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
        <ProductTable products={detail.products.slice(0, 30)} />
      </section>

      <section className="mt-5">
        <h2 className="text-[14px] font-bold text-ink">مقایسه با مواد مؤثره دیگر</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {popular.map((item) => (
            <Link
              key={item.key}
              href={`/compare/${encodeURIComponent(item.key)}`}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-[9px] text-muted hover:border-[#c8dcf2] hover:text-brand"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="surface-card mt-5 p-5">
        <h2 className="text-[16px] font-bold text-ink">پرسش‌های متداول</h2>
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

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className="num mt-1 text-[14px] font-extrabold text-ink">{value}</p>
    </div>
  );
}

function SideCard({
  title,
  product,
  tone,
}: {
  title: string;
  product: CatalogIngredientDetail["products"][number] | undefined;
  tone: "emerald" | "amber";
}) {
  if (!product) {
    return (
      <div className="surface-card p-4 text-[10px] text-faint">قیمت بسته‌ای ثبت نشده است.</div>
    );
  }
  return (
    <Link
      href={`/drug/${product.canonicalIrc}`}
      className={`surface-card block p-4 transition hover:-translate-y-0.5 ${
        tone === "emerald" ? "ring-1 ring-[#d3eee2]" : "ring-1 ring-[#f0dfbd]"
      }`}
    >
      <p className={`text-[9px] font-medium ${tone === "emerald" ? "text-[#1c825f]" : "text-[#a96a18]"}`}>{title}</p>
      <p className="mt-1 truncate text-[12px] font-bold text-ink">{product.displayName}</p>
      <p className="mt-1 text-[9px] text-faint">{product.brandOwnerName ?? "—"}</p>
      <p className="num mt-2 text-[15px] font-extrabold text-ink">{product.priceToman !== null ? faPrice(product.priceToman) : "—"}</p>
    </Link>
  );
}

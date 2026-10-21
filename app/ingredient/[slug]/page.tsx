import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, FlaskConical, Layers, Tags } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { IngredientPriceChart } from "@/components/catalog/ingredient-price-chart";
import { ProductTable } from "@/components/catalog/product-table";
import { getCatalogIngredient, getCatalogCategoryDetail } from "@/lib/catalog/queries";
import { faNum, faPrice } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = getCatalogIngredient(slug);
  if (!detail) return { title: "ماده مؤثره پیدا نشد" };
  const priceRange =
    detail.stats.minPrice !== null
      ? `کمترین قیمت بسته ${faPrice(detail.stats.minPrice)}${detail.stats.maxPrice !== null ? ` و بیشترین ${faPrice(detail.stats.maxPrice)}` : ""}`
      : "قیمت بسته‌ای ثبت نشده است";
  return seoMetadata({
    title: `${detail.name} | محصولات، برندها و قیمت`,
    description: `محصولات دارای ماده مؤثره ${detail.name}: ${faNum(detail.stats.count)} محصول، ${faNum(detail.stats.brandOwners)} صاحب برند؛ ${priceRange}.`,
    path: `/ingredient/${encodeURIComponent(detail.key)}`,
    keywords: [
      detail.name,
      detail.nameEn ?? "",
      `قیمت ${detail.name}`,
      `محصولات ${detail.name}`,
      "ماده مؤثره",
      "قیمت دارو",
    ].filter(Boolean),
  });
}

export default async function IngredientPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const categoryCode = typeof query.category === "string" ? query.category : "";
  const view = typeof query.view === "string" ? query.view : "all";
  const detail = getCatalogIngredient(slug, categoryCode);
  if (!detail) notFound();

  const category = categoryCode ? getCatalogCategoryDetail(categoryCode) : undefined;
  const products =
    view === "branded"
      ? detail.products.filter((product) => Boolean(product.brandName))
      : view === "unbranded"
        ? detail.products.filter((product) => !product.brandName)
        : detail.products;

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "مواد مؤثره", href: "/ingredients" },
          ...(category ? [{ label: category.name, href: `/category/${category.code}` }] : []),
          { label: detail.name },
        ]}
      />

      <section className="surface-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-teal" />
              {faNum(detail.products.length)} محصول · {faNum(detail.stats.brandOwners)} صاحب برند
            </p>
            <h1 className="mt-1.5 text-[27px] font-extrabold tracking-tight text-ink sm:text-[32px]">
              {detail.name}
            </h1>
            <p dir="ltr" className="mt-1 text-start text-[10.5px] text-faint">{detail.nameEn ?? detail.key}</p>
            {category && (
              <Link href={`/category/${category.code}`} className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#eef5fe] px-2.5 py-1 text-[9px] text-brand-dark">
                <Tags className="h-3 w-3" />
                {category.name}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
            <MiniStat label="قیمت بسته" value={detail.stats.minPrice !== null ? `از ${faPrice(detail.stats.minPrice)}` : "—"} />
            <MiniStat label="قیمت واحد" value={detail.stats.minUnitPrice !== null ? `از ${faPrice(detail.stats.minUnitPrice)}` : "—"} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line/60 pt-4 sm:grid-cols-4">
          <Info icon={<FlaskConical className="h-3.5 w-3.5" />} label="محصولات" value={faNum(detail.stats.count)} />
          <Info icon={<Building2 className="h-3.5 w-3.5" />} label="تولیدکنندگان" value={faNum(detail.stats.producers)} />
          <Info icon={<Layers className="h-3.5 w-3.5" />} label="خانواده GenericCode" value={faNum(detail.stats.genericCodes)} />
          <Info icon={<Tags className="h-3.5 w-3.5" />} label="سطح DrugIndexId" value={faNum(detail.stats.drugIndexes)} />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-faint">
          <span>بازه قیمت بسته: {detail.stats.minPrice !== null ? `${faPrice(detail.stats.minPrice)} تا ${faPrice(detail.stats.maxPrice ?? detail.stats.minPrice)} تومان` : "—"}</span>
          <span>بازه قیمت واحد: {detail.stats.minUnitPrice !== null ? `${faPrice(detail.stats.minUnitPrice)} تا ${faPrice(detail.stats.maxUnitPrice ?? detail.stats.minUnitPrice)} تومان` : "—"}</span>
          {detail.stats.lastSeen && <span>آخرین مشاهده: {formatJalali(detail.stats.lastSeen)}</span>}
        </div>
      </section>

      {detail.history.length > 0 && (
        <section className="surface-card mt-4 p-4 sm:p-5">
          <div className="mb-2">
            <h2 className="text-[13px] font-bold text-ink">روند قیمت محصولات این ماده</h2>
            <p className="mt-0.5 text-[10px] text-faint">
              {faNum(detail.history.length)} محصول با تاریخچه واقعی؛ برای دیدن جزئیات روی هر نقطه نگه دارید.
            </p>
          </div>
          <IngredientPriceChart series={detail.history} />
        </section>
      )}

      <section className="surface-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-bold text-ink">محصولات این ماده مؤثره</h2>
            <p className="mt-0.5 text-[10px] text-faint">برای مشاهده جزئیات، روی هر ردیف کلیک کنید.</p>
          </div>
          <div className="flex items-center gap-1">
            {[
              { key: "all", label: `همه (${faNum(detail.products.length)})` },
              { key: "branded", label: `برنددار (${faNum(detail.stats.branded)})` },
              { key: "unbranded", label: `بدون برند (${faNum(detail.stats.unbranded)})` },
            ].map((tab) => (
              <Link
                key={tab.key}
                href={`/ingredient/${encodeURIComponent(detail.key)}?${new URLSearchParams({
                  ...(categoryCode ? { category: categoryCode } : {}),
                  ...(tab.key !== "all" ? { view: tab.key } : {}),
                }).toString()}`}
                className={`rounded-md px-2 py-1 text-[9.5px] transition ${
                  view === tab.key ? "bg-[#eaf2fe] font-semibold text-brand-dark" : "text-faint hover:bg-surface-tint"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
        <ProductTable products={products} />
        <div className="flex items-center justify-between gap-2 border-t border-line/60 px-4 py-2 text-[8.5px] text-faint">
          <span>قیمت بسته = ConsumerPrice × PackageCount · قیمت واحد = ConsumerPrice</span>
          <Link href="/ingredients" className="inline-flex items-center gap-1 text-brand hover:text-brand-dark">
            همه مواد مؤثره
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-2.5 py-2 text-center">
      <p className="text-[8px] text-faint">{label}</p>
      <p className="num mt-0.5 text-[11px] font-bold text-ink-soft">{value}</p>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f7f3] text-teal">{icon}</span>
      <span>
        <span className="block text-[8px] text-faint">{label}</span>
        <span className="num block text-[11px] font-bold text-ink-soft">{value}</span>
      </span>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Pill, Tags } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryIngredientTable, type CategoryIngredientRow } from "@/components/catalog/category-ingredient-table";
import { getCatalogCategoryDetail, getClassificationGroups } from "@/lib/catalog/queries";
import { faNum, faPrice } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const category = getCatalogCategoryDetail(code);
  if (!category) return { title: "دسته پیدا نشد" };
  return seoMetadata({
    title: `${category.name} | مواد مؤثره، محصولات و قیمت`,
    description: `دسته ${category.name}: ${faNum(category.count)} محصول و ${faNum(category.ingredients)} ماده مؤثره${category.minPrice !== null ? `؛ کمترین قیمت بسته ${faPrice(category.minPrice)}` : ""}.`,
    path: `/category/${encodeURIComponent(category.code)}`,
    keywords: [category.name, category.nameEn, category.rootName, `قیمت ${category.name}`, "ATC", "طبقه‌بندی دارو"],
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { code } = await params;
  const category = getCatalogCategoryDetail(code);
  if (!category) notFound();

  const buckets = new Map<string, CategoryIngredientRow>();
  const brandSets = new Map<string, Set<string>>();
  const producerSets = new Map<string, Set<string>>();
  for (const product of category.products) {
    const key = product.ingredientKey ?? product.irc;
    const row = buckets.get(key) ?? {
      key,
      name: product.ingredientNameFa ?? product.displayName,
      nameEn: product.ingredientNameEn,
      count: 0,
      brands: 0,
      producers: 0,
      minPrice: null,
      maxPrice: null,
      minUnit: null,
      maxUnit: null,
    };
    row.count += 1;
    const owner = product.brandOwnerNationalId ?? product.brandOwnerName;
    const brandKey = `${row.key}:${owner ?? ""}`;
    const brandSet = brandSets.get(row.key) ?? new Set<string>();
    brandSet.add(brandKey);
    brandSets.set(row.key, brandSet);
    const producerSet = producerSets.get(row.key) ?? new Set<string>();
    if (product.producerName) producerSet.add(product.producerName);
    producerSets.set(row.key, producerSet);
    if (product.priceToman !== null) {
      row.minPrice = row.minPrice === null ? product.priceToman : Math.min(row.minPrice, product.priceToman);
      row.maxPrice = row.maxPrice === null ? product.priceToman : Math.max(row.maxPrice, product.priceToman);
    }
    if (product.unitPriceToman !== null) {
      row.minUnit = row.minUnit === null ? product.unitPriceToman : Math.min(row.minUnit, product.unitPriceToman);
      row.maxUnit = row.maxUnit === null ? product.unitPriceToman : Math.max(row.maxUnit, product.unitPriceToman);
    }
    buckets.set(key, row);
  }
  const rows = [...buckets.values()].map((row) => ({
    ...row,
    brands: brandSets.get(row.key)?.size ?? 0,
    producers: producerSets.get(row.key)?.size ?? 0,
  }));

  const groups = getClassificationGroups();
  const root = groups.find((group) => group.code === category.rootCode);
  const siblings = root?.categories.filter((item) => item.code !== category.code).slice(0, 12) ?? [];

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "طبقه‌بندی اثر دارویی", href: "/categories" },
          { label: category.rootName, href: "/categories" },
          { label: category.name },
        ]}
      />

      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-violet" />
              {category.rootName} · کد {category.code}
            </p>
            <h1 className="mt-1.5 text-[26px] font-extrabold text-ink sm:text-[30px]">{category.name}</h1>
            <p dir="ltr" className="mt-1 text-start text-[10px] text-faint">{category.nameEn}</p>
            <p className="mt-2 max-w-[760px] text-[11px] leading-6 text-muted">
              {faNum(category.ingredients)} ماده مؤثره و {faNum(category.count)} محصول در این دسته قرار دارند.
              قیمت‌ها بر اساس آخرین مشاهده واقعی محاسبه شده‌اند.
            </p>
          </div>
          <Link href="/categories" className="btn-secondary">
            <Tags className="h-3.5 w-3.5" />
            همه دسته‌ها
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line/60 pt-4 sm:grid-cols-4">
          <Stat label="تعداد ماده" value={faNum(category.ingredients)} />
          <Stat label="تعداد محصول" value={faNum(category.count)} />
          <Stat label="کمترین قیمت بسته" value={category.minPrice !== null ? `${faPrice(category.minPrice)} ت` : "—"} />
          <Stat label="بیشترین قیمت بسته" value={category.maxPrice !== null ? `${faPrice(category.maxPrice)} ت` : "—"} />
        </div>
      </section>

      <section className="surface-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <Layers className="h-3.5 w-3.5 text-violet" />
              مواد مؤثره این دسته
            </h2>
            <p className="mt-0.5 text-[10px] text-faint">برای دیدن محصولات، روی کل ردیف کلیک کنید.</p>
          </div>
          <span className="text-[9px] text-faint">{faNum(rows.length)} ماده</span>
        </div>
        <CategoryIngredientTable rows={rows} categoryCode={category.code} />
      </section>

      {siblings.length > 0 && (
        <section className="surface-card mt-4 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-faint">
            <Pill className="h-3.5 w-3.5" />
            سایر دسته‌های {category.rootName}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {siblings.map((item) => (
              <Link
                key={item.code}
                href={`/category/${item.code}`}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-[9.5px] text-muted transition hover:border-[#c9ddf5] hover:text-brand"
              >
                <CategoryIcon name="pill" className="h-3 w-3 opacity-50" />
                {item.name}
                <span className="num text-[8px] text-faint">{faNum(item.count)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <p className="text-[8px] text-faint">{label}</p>
      <p className="num mt-0.5 text-[12px] font-bold text-ink-soft">{value}</p>
    </div>
  );
}

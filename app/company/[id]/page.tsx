import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Factory, Layers, Pill } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductTable } from "@/components/catalog/product-table";
import { getCatalogCompanyDetail } from "@/lib/catalog/queries";
import { faNum, faPrice } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const company = getCatalogCompanyDetail(id);
  if (!company) return { title: "شرکت پیدا نشد" };
  return seoMetadata({
    title: `${company.name} | محصولات و قیمت`,
    description: `محصولات ${company.name}: ${faNum(company.stats.total)} محصول، ${faNum(company.stats.ingredients)} ماده مؤثره و ${faNum(company.stats.priced)} محصول قیمت‌دار${company.stats.minPrice !== null ? `؛ کمترین قیمت بسته ${faPrice(company.stats.minPrice)}` : ""}.`,
    path: `/company/${encodeURIComponent(company.id)}`,
    keywords: [company.name, `محصولات ${company.name}`, `قیمت دارو ${company.name}`, "سازنده دارو", "صاحب برند"],
  });
}

export default async function CompanyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const role = query.role === "producer" ? "producer" : "owner";
  const company = getCatalogCompanyDetail(id);
  if (!company) notFound();

  const products = role === "producer" ? company.producedProducts : company.ownerProducts;

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "سازندگان", href: "/companies" },
          { label: company.name },
        ]}
      />

      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">
              <span className="h-1 w-1 rounded-full bg-brand" />
              {faNum(company.stats.total)} محصول
            </p>
            <h1 className="mt-1.5 text-[26px] font-extrabold text-ink sm:text-[30px]">{company.name}</h1>
            <p className="mt-1 max-w-[700px] text-[11px] leading-6 text-muted">
              اطلاعات این صفحه بر اساس نقش‌های BrandOwner (دارنده پروانه) و Producer (تولیدکننده واقعی)
              از دیتابیس واقعی ساخته شده است.
            </p>
          </div>
          <Link href="/companies" className="btn-secondary">
            <Building2 className="h-3.5 w-3.5" />
            همه شرکت‌ها
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line/60 pt-4 sm:grid-cols-4">
          <Stat label="کل محصولات" value={faNum(company.stats.total)} icon={<Pill className="h-3.5 w-3.5" />} />
          <Stat label="مواد مؤثره" value={faNum(company.stats.ingredients)} icon={<Layers className="h-3.5 w-3.5" />} />
          <Stat label="GenericCode" value={faNum(company.stats.genericCodes)} />
          <Stat label="قیمت بسته" value={company.stats.minPrice !== null ? `${faPrice(company.stats.minPrice)} تا ${faPrice(company.stats.maxPrice ?? company.stats.minPrice)}` : "—"} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[9px] text-faint">
          <span>دارای قیمت: <b className="num text-ink-soft">{faNum(company.stats.priced)}</b></span>
          <span>بدون قیمت: <b className="num text-ink-soft">{faNum(company.stats.noPrice)}</b></span>
          <span>محصولات تولیدی این شرکت: <b className="num text-ink-soft">{faNum(company.producedProducts.length)}</b></span>
        </div>
      </section>

      <section className="surface-card mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
          <div>
            <h2 className="text-[13px] font-bold text-ink">محصولات شرکت</h2>
            <p className="mt-0.5 text-[10px] text-faint">برای مشاهده جزئیات، روی کل ردیف کلیک کنید.</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/company/${encodeURIComponent(company.id)}`}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9.5px] ${role === "owner" ? "bg-[#eaf2fe] font-semibold text-brand-dark" : "text-faint hover:bg-surface-tint"}`}
            >
              <Building2 className="h-3 w-3" />
              دارنده پروانه ({faNum(company.ownerProducts.length)})
            </Link>
            <Link
              href={`/company/${encodeURIComponent(company.id)}?role=producer`}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9.5px] ${role === "producer" ? "bg-[#e6f7f3] font-semibold text-[#158d7d]" : "text-faint hover:bg-surface-tint"}`}
            >
              <Factory className="h-3 w-3" />
              تولیدکننده ({faNum(company.producedProducts.length)})
            </Link>
          </div>
        </div>
        <ProductTable products={products} />
        {products.length === 0 && (
          <p className="py-10 text-center text-[10px] text-faint">برای این نقش محصولی ثبت نشده است.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2">
      <p className="text-[8px] text-faint">{label}</p>
      <p className="num mt-0.5 flex items-center gap-1 text-[12px] font-bold text-ink-soft">
        {icon}
        {value}
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompanyBrowser } from "@/components/catalog/company-browser";
import { getCatalogCompanies } from "@/lib/catalog/queries";
import { faNum } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "شرکت های داروسازی ایران | فهرست تولیدکنندگان و صاحبان برند",
  description:
    "فهرست شرکت‌های داروسازی ایران، صاحبان برند و تولیدکنندگان دارو با تعداد محصول، تنوع مواد مؤثره و بازه قیمت بسته.",
  path: "/companies",
  keywords: [
    "شرکت های داروسازی",
    "شرکت های دارو ساز",
    "تولیدکنندگان دارو",
    "صاحب برند دارو",
    "صنعت داروسازی ایران",
  ],
});

export default function CompaniesPage() {
  const companies = getCatalogCompanies(5000);
  const totalProducts = companies.reduce((sum, company) => sum + company.count, 0);
  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "شرکت‌های داروسازی" }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-brand" />
            {faNum(companies.length)} شرکت · {faNum(totalProducts)} محصول
          </p>
          <h1 className="mt-1.5 text-[24px] font-extrabold text-ink sm:text-[30px]">
            شرکت‌های داروسازی ایران
          </h1>
          <p className="mt-1.5 max-w-[780px] text-[12px] leading-6 text-muted">
            فهرست صاحبان برند و تولیدکنندگان داروهای ایرانی و خارجی؛ قیمت محصولات، تنوع مواد
            مؤثره و نقش هر شرکت در زنجیره تولید را ببینید.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/drug-prices" className="btn-secondary">
            <Building2 className="h-3.5 w-3.5" />
            نرخ دارو
          </Link>
          <Link href="/search" className="btn-secondary">
            <ArrowLeft className="h-3.5 w-3.5" />
            جستجوی پیشرفته
          </Link>
        </div>
      </div>
      <CompanyBrowser companies={companies} />
    </div>
  );
}

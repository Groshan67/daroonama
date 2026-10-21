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
  title: "سازندگان و صاحبان برند دارو | فهرست شرکت‌ها",
  description:
    "فهرست صاحبان برند و تولیدکنندگان دارو در ایران با تعداد محصول، تنوع مواد مؤثره و بازه قیمت بسته.",
  path: "/companies",
  keywords: ["سازندگان دارو", "شرکت‌های داروسازی", "صاحب برند دارو", "تولیدکننده دارو"],
});

export default function CompaniesPage() {
  const companies = getCatalogCompanies(5000);
  const totalProducts = companies.reduce((sum, company) => sum + company.count, 0);
  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "سازندگان" }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-brand" />
            {faNum(companies.length)} شرکت · {faNum(totalProducts)} محصول
          </p>
          <h1 className="mt-1.5 text-[24px] font-extrabold text-ink sm:text-[28px]">
            قیمت داروها بر اساس شرکت
          </h1>
          <p className="mt-1.5 max-w-[760px] text-[12px] leading-6 text-muted">
            صاحبان برند (BrandOwner) و تولیدکنندگان واقعی (Producer) به‌صورت جداگانه در صفحه هر شرکت
            نمایش داده می‌شوند.
          </p>
        </div>
        <Link href="/search" className="btn-secondary">
          <Building2 className="h-3.5 w-3.5" />
          جستجوی پیشرفته
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
      <CompanyBrowser companies={companies} />
    </div>
  );
}

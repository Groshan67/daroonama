import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { IngredientBrowser } from "@/components/catalog/ingredient-browser";
import { getCatalogIngredients } from "@/lib/catalog/queries";
import { faNum } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "لیست مواد مؤثره داروها | جستجو بر اساس ماده مؤثره",
  description:
    "فهرست کامل مواد مؤثره داروهای ایران با نام فارسی و انگلیسی، تعداد محصولات و کمترین قیمت بسته؛ جستجو و پالایش زنده.",
  path: "/ingredients",
  keywords: ["مواد مؤثره", "لیست مواد مؤثره دارو", "ماده مؤثره دارو", "جستجوی ماده مؤثره"],
});

export default function IngredientsPage() {
  const ingredients = getCatalogIngredients(5000);
  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "مواد مؤثره" }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-teal" />
            مجموعه {faNum(ingredients.length)} ماده مؤثره
          </p>
          <h1 className="mt-1.5 text-[24px] font-extrabold text-ink sm:text-[28px]">
            قیمت داروها را بر اساس ترکیبات آن‌ها پیدا کنید
          </h1>
          <p className="mt-1.5 max-w-[760px] text-[12px] leading-6 text-muted">
            با انتخاب نام ماده مؤثره، محصولات هم‌ماده، برندها و تولیدکنندگان را مقایسه کنید. تعداد
            محصولات هر ماده در بج کنار آن آمده است.
          </p>
        </div>
        <Link href="/search" className="btn-secondary">
          <FlaskConical className="h-3.5 w-3.5" />
          جستجوی پیشرفته
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <IngredientBrowser ingredients={ingredients} />
    </div>
  );
}

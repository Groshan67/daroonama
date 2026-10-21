import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CategoryIcon } from "@/components/category-icon";
import { ClassificationModal } from "@/components/catalog/classification-modal";
import { getClassificationGroups } from "@/lib/catalog/queries";
import { faNum } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "طبقه‌بندی اثر دارویی و گروه‌های ATC",
  description:
    "مرور داروها بر اساس طبقه‌بندی اثر دارویی و کد ATC؛ دسته‌های قلبی، دیابت، آنتی‌بیوتیک، عصبی و سایر گروه‌ها.",
  path: "/categories",
  keywords: ["طبقه‌بندی دارو", "گروه درمانی", "ATC دارو", "دسته‌بندی اثر دارویی"],
});

export default function CategoriesPage() {
  const groups = getClassificationGroups();
  const totalCategories = groups.reduce((sum, group) => sum + group.categories.length, 0);

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "طبقه‌بندی اثر دارویی" }]} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-violet" />
            {faNum(groups.length)} سیستم · {faNum(totalCategories)} دسته
          </p>
          <h1 className="mt-1.5 text-[24px] font-extrabold text-ink sm:text-[28px]">
            جستجو بر اساس طبقه‌بندی اثر دارویی
          </h1>
          <p className="mt-1.5 max-w-[760px] text-[12px] leading-6 text-muted">
            دسته‌بندی‌ها از سلسله‌مراتب ATC ساخته شده‌اند. یک دسته را انتخاب کنید تا مواد مؤثره و
            محصولات آن نمایش داده شود.
          </p>
        </div>
        <ClassificationModal groups={groups} initiallyOpen />
      </div>

      <div className="mt-6 space-y-5">
        {groups.map((group) => (
          <section key={group.code} className="surface-card overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-line/60 bg-surface-soft/50 px-4 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0ecfd] text-[10px] font-bold text-violet">
                {group.code}
              </span>
              <div>
                <h2 className="text-[12.5px] font-bold text-ink">{group.name}</h2>
                <p dir="ltr" className="text-start text-[8.5px] text-faint">{group.nameEn}</p>
              </div>
              <span className="num ms-auto text-[9px] text-faint">{faNum(group.categories.length)} دسته</span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3">
              {group.categories.map((category) => (
                <Link
                  key={category.code}
                  href={`/category/${category.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[9.5px] text-ink-soft transition hover:border-[#bdd7f4] hover:bg-[#f4f8ff] hover:text-brand"
                >
                  <CategoryIcon name="pill" className="h-3 w-3 opacity-60" />
                  {category.name}
                  <span className="num rounded-full bg-surface-tint px-1.5 text-[8px] text-faint">
                    {faNum(category.count)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 px-1 text-[9.5px] text-faint">
        <LayoutGrid className="h-3 w-3" />
        دسته‌ها از سطح ۳ ATC و سیستم‌ها از سطح ۱ ATC گرفته شده‌اند.
      </div>
    </div>
  );
}

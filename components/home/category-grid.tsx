import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { ACCENTS } from "@/components/accents";
import { CategoryIcon } from "@/components/category-icon";
import type { CategoryStats } from "@/lib/data/types";
import { faNum } from "@/lib/format";

export function CategoryGrid({ categories }: { categories: CategoryStats[] }) {
  return (
    <section aria-labelledby="categories-title" className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2
            id="categories-title"
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint"
          >
            <span className="h-3 w-[3px] rounded-full bg-violet/50" />
            جستجوی مستقیم بر اساس طبقه‌بندی اثر دارویی
          </h2>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand"
        >
          همه طبقه‌بندی‌ها
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category, index) => {
          const accent = ACCENTS[category.accent];
          return (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
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
                {faNum(category.ingredientCount)} ماده مؤثره · {faNum(category.drugCount)} قلم
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1.5 px-1 text-[10px] text-faint/80">
        <LayoutGrid className="h-3 w-3" />
        دسته‌بندی‌ها بر اساس گروه‌های درمانی استاندارد ATC سازماندهی شده‌اند.
      </div>
    </section>
  );
}

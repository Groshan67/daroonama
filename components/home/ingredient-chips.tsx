import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import type { Ingredient } from "@/lib/data/types";
import { faNum } from "@/lib/format";

export function IngredientChips({ ingredients }: { ingredients: Ingredient[] }) {
  return (
    <section aria-labelledby="ingredients-title" className="mt-9">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2.5">
          <h2
            id="ingredients-title"
            className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint"
          >
            <span className="h-3 w-[3px] rounded-full bg-teal/50" />
            جستجو بر اساس مواد مؤثره کلیدی
          </h2>
          <span className="hidden items-center gap-1 text-[10px] text-faint/70 sm:inline-flex">
            <FlaskConical className="h-2.5 w-2.5" />
            پرکاربردترین مواد مؤثره
          </span>
        </div>
        <Link
          href="/ingredients"
          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand"
        >
          همه مواد مؤثره
          <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ingredient) => (
          <Link
            key={ingredient.id}
            href={`/ingredient/${ingredient.id}`}
            className="chip group !gap-2 !bg-white/80 !py-[7px]"
          >
            <span>{ingredient.name}</span>
            <span className="num rounded-full bg-surface-tint px-1.5 py-0.5 text-[9px] leading-4 text-faint group-hover:bg-[#eaf2fe] group-hover:text-brand">
              {faNum(ingredient.drugCount)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

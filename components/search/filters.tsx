import Link from "next/link";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { DRUG_FORMS } from "@/lib/search";
import type { CategoryStats, CompanyStats } from "@/lib/data/types";

export type FilterValues = {
  q: string;
  category?: string;
  company?: string;
  status?: string;
  form?: string;
  otc?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
};

export function FiltersForm({
  values,
  categories,
  companies,
}: {
  values: FilterValues;
  categories: CategoryStats[];
  companies: CompanyStats[];
}) {
  return (
    <form action="/search" method="get" className="space-y-4">
      {values.q && <input type="hidden" name="q" value={values.q} />}

      <Field label="دسته‌بندی اثر دارویی">
        <select name="category" defaultValue={values.category ?? ""} className="field">
          <option value="">همه دسته‌ها</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="سازنده">
        <select name="company" defaultValue={values.company ?? ""} className="field">
          <option value="">همه سازندگان</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="شکل دارویی">
        <select name="form" defaultValue={values.form ?? ""} className="field">
          <option value="">همه اشکال</option>
          {DRUG_FORMS.map((form) => (
            <option key={form} value={form}>
              {form}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="وضعیت">
          <select name="status" defaultValue={values.status ?? ""} className="field">
            <option value="">همه</option>
            <option value="active">فعال</option>
            <option value="transitional">انتقالی</option>
            <option value="discontinued">توقف تولید</option>
          </select>
        </Field>
        <Field label="نوع عرضه">
          <select name="otc" defaultValue={values.otc ?? ""} className="field">
            <option value="">همه</option>
            <option value="1">بدون نسخه</option>
            <option value="0">نسخه‌ای</option>
          </select>
        </Field>
      </div>

      <Field label="محدوده قیمت (تومان)">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="min"
            min={0}
            step={1000}
            placeholder="از"
            defaultValue={values.min ?? ""}
            className="field num"
            aria-label="حداقل قیمت"
          />
          <input
            type="number"
            name="max"
            min={0}
            step={1000}
            placeholder="تا"
            defaultValue={values.max ?? ""}
            className="field num"
            aria-label="حداکثر قیمت"
          />
        </div>
      </Field>

      <Field label="ترتیب نمایش">
        <select name="sort" defaultValue={values.sort ?? ""} className="field">
          <option value="">پیش‌فرض</option>
          <option value="views">پربازدیدترین</option>
          <option value="price-asc">ارزان‌ترین</option>
          <option value="price-desc">گران‌ترین</option>
          <option value="change">بیشترین تغییر قیمت</option>
          <option value="newest">جدیدترین بازنگری</option>
        </select>
      </Field>

      <div className="flex items-center gap-2 pt-0.5">
        <button type="submit" className="btn-primary flex-1 !py-2">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          اعمال فیلترها
        </button>
        <Link
          href={values.q ? `/search?q=${encodeURIComponent(values.q)}` : "/search"}
          className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-line bg-white text-faint transition-colors hover:border-[#bdd7f4] hover:text-brand"
          aria-label="پاک کردن فیلترها"
          title="پاک کردن فیلترها"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Link>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

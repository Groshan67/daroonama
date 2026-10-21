"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Download,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PriceChange } from "@/components/drug/price-change";
import { StatusBadge } from "@/components/drug/status-badge";
import { WatchlistButton } from "@/components/watchlist-button";
import { faNum, faPrice } from "@/lib/format";
import type { DrugStatus, DrugSummary } from "@/lib/data/types";

type Option = { id: string; name: string };

const PAGE_LIMIT = 25;

export function ScreenerTool({
  drugs,
  categories,
  companies,
  forms,
  initialFilters,
}: {
  drugs: DrugSummary[];
  categories: Option[];
  companies: Option[];
  forms: string[];
  initialFilters?: { status?: string; category?: string; otc?: string; max?: string };
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialFilters?.category ?? "");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState(initialFilters?.status ?? "");
  const [form, setForm] = useState("");
  const [otc, setOtc] = useState(initialFilters?.otc ?? "");
  const [min, setMin] = useState("");
  const [max, setMax] = useState(initialFilters?.max ?? "");
  const [sort, setSort] = useState("views");
  const [limit, setLimit] = useState(PAGE_LIMIT);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories]);

  const results = useMemo(() => {
    const q = query.trim();
    const minValue = min ? Number(min) : undefined;
    const maxValue = max ? Number(max) : undefined;
    const filtered = drugs.filter((drug) => {
      if (category && drug.categoryId !== category) return false;
      if (company && drug.companyId !== company) return false;
      if (status && drug.status !== status) return false;
      if (form && drug.form !== form) return false;
      if (otc === "1" && !drug.isOtc) return false;
      if (otc === "0" && drug.isOtc) return false;
      if (typeof minValue === "number" && Number.isFinite(minValue) && drug.price < minValue) return false;
      if (typeof maxValue === "number" && Number.isFinite(maxValue) && drug.price > maxValue) return false;
      if (q) {
        const haystack = `${drug.name} ${drug.ingredientName} ${drug.companyName} ${drug.code} ${drug.ingredientEn}`.toLowerCase();
        if (!haystack.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "change") return b.changePct - a.changePct;
      if (sort === "newest") return b.revisionDate.localeCompare(a.revisionDate);
      return b.views - a.views;
    });
    return filtered;
  }, [drugs, query, category, company, status, form, otc, min, max, sort]);

  const activeCount = [category, company, status, form, otc, min, max].filter(Boolean).length;

  const reset = () => {
    setQuery("");
    setCategory("");
    setCompany("");
    setStatus("");
    setForm("");
    setOtc("");
    setMin("");
    setMax("");
    setSort("views");
    setLimit(PAGE_LIMIT);
  };

  const exportCsv = () => {
    const header = ["نام محصول", "ماده مؤثره", "سازنده", "دسته", "شکل", "قیمت بسته", "قیمت هر واحد", "هزینه ماهانه", "تغییر", "وضعیت", "کد IRC"];
    const lines = results.map((drug) => [
      drug.name,
      drug.ingredientName,
      drug.companyName,
      categoryMap.get(drug.categoryId) ?? "",
      drug.form,
      drug.price,
      drug.unitPrice,
      drug.monthlyCost,
      Math.round(drug.changePct),
      drug.status,
      drug.code,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "daranama-screener.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <aside
        className={`surface-card mb-4 h-fit p-4 lg:sticky lg:top-[84px] lg:mb-0 lg:block ${
          filtersOpen ? "block" : "hidden"
        }`}
      >
        <div className="mb-3 flex items-center gap-2 border-b border-line/70 pb-2.5">
          <SlidersHorizontal className="h-4 w-4 text-brand" />
          <h2 className="text-[12px] font-bold text-ink">فیلترها</h2>
          {activeCount > 0 && (
            <span className="num rounded-full bg-[#eaf2fe] px-1.5 text-[9px] font-semibold text-brand">
              {faNum(activeCount)}
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            className="ms-auto inline-flex items-center gap-1 text-[9px] text-faint hover:text-brand"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            پاک کردن
          </button>
        </div>

        <label className="mb-2.5 block">
          <span className="mb-1 block text-[9.5px] text-muted">جستجو در نتایج</span>
          <span className="relative block">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-faint" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setLimit(PAGE_LIMIT);
              }}
              placeholder="نام دارو، ماده یا کد…"
              className="field !py-1.5 ps-8 text-[10.5px]"
            />
          </span>
        </label>

        <div className="space-y-2.5">
          <Select label="دسته درمانی" value={category} onChange={setCategory} options={categories} />
          <Select label="سازنده" value={company} onChange={setCompany} options={companies} />
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[9.5px] text-muted">وضعیت</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="field !py-1.5 text-[10px]">
                <option value="">همه</option>
                <option value="active">فعال</option>
                <option value="transitional">انتقالی</option>
                <option value="discontinued">توقف تولید</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[9.5px] text-muted">نوع عرضه</span>
              <select value={otc} onChange={(event) => setOtc(event.target.value)} className="field !py-1.5 text-[10px]">
                <option value="">همه</option>
                <option value="1">بدون نسخه</option>
                <option value="0">نسخه‌ای</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-[9.5px] text-muted">شکل دارویی</span>
            <select value={form} onChange={(event) => setForm(event.target.value)} className="field !py-1.5 text-[10px]">
              <option value="">همه اشکال</option>
              {forms.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="mb-1 block text-[9.5px] text-muted">محدوده قیمت (تومان)</span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={min}
                onChange={(event) => setMin(event.target.value)}
                placeholder="از"
                className="field num !py-1.5 text-[10px]"
              />
              <input
                type="number"
                value={max}
                onChange={(event) => setMax(event.target.value)}
                placeholder="تا"
                className="field num !py-1.5 text-[10px]"
              />
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-[9.5px] text-muted">ترتیب</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="field !py-1.5 text-[10px]">
              <option value="views">پربازدیدترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="change">بیشترین تغییر</option>
              <option value="newest">جدیدترین بازنگری</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {[
            { label: "بدون نسخه", key: "otc" as const, value: "1" },
            { label: "انتقالی", key: "status" as const, value: "transitional" },
            { label: "زیر ۵۰ هزار", key: "max" as const, value: "50000" },
          ].map((chip) => {
            const active =
              chip.key === "otc" ? otc === chip.value : chip.key === "status" ? status === chip.value : max === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  if (chip.key === "otc") setOtc(active ? "" : chip.value);
                  if (chip.key === "status") setStatus(active ? "" : chip.value);
                  if (chip.key === "max") setMax(active ? "" : chip.value);
                }}
                className={`rounded-full border px-2 py-1 text-[8.5px] transition ${
                  active
                    ? "border-[#b7d3f3] bg-[#eef5fe] font-medium text-brand-dark"
                    : "border-line bg-white text-muted hover:border-[#c8dcf2]"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="mt-3 w-full rounded-lg bg-surface-tint py-2 text-[10px] text-muted lg:hidden"
        >
          نمایش {faNum(results.length)} نتیجه
        </button>
      </aside>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-[11.5px] text-muted">
            <strong className="num font-semibold text-ink">{faNum(results.length)}</strong> نتیجه
            {activeCount > 0 && <span className="text-faint"> · {faNum(activeCount)} فیلتر فعال</span>}
          </p>
          <div className="ms-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] text-ink-soft lg:hidden"
            >
              <Filter className="h-3 w-3" />
              فیلترها
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] text-ink-soft transition hover:border-[#bdd7f4] hover:text-brand"
            >
              <Download className="h-3 w-3" />
              خروجی CSV
            </button>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10.5px] md:min-w-[760px]">
              <thead>
                <tr className="border-b border-line/70 bg-surface-soft/60 text-[9px] text-faint">
                  <th className="px-3 py-2.5 text-start font-medium sm:px-4">دارو</th>
                  <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">دسته</th>
                  <th className="hidden px-3 py-2.5 text-start font-medium lg:table-cell">سازنده</th>
                  <th className="px-2 py-2.5 text-start font-medium sm:px-3">قیمت بسته</th>
                  <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">هر واحد</th>
                  <th className="hidden px-3 py-2.5 text-start font-medium lg:table-cell">ماهانه</th>
                  <th className="px-2 py-2.5 text-start font-medium sm:px-3">تغییر</th>
                  <th className="hidden px-3 py-2.5 text-start font-medium md:table-cell">وضعیت</th>
                  <th className="px-2 py-2.5 text-start font-medium sm:px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {results.slice(0, limit).map((drug) => (
                  <tr key={drug.code} className="transition-colors hover:bg-surface-soft">
                    <td className="px-3 py-2.5 sm:px-4">
                      <Link href={`/drug/${drug.code}`} className="font-semibold text-ink hover:text-brand">
                        {drug.name}
                      </Link>
                      <span className="mt-0.5 block text-[8.5px] text-faint">
                        {drug.ingredientName} · {drug.strength}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 text-muted md:table-cell">{categoryMap.get(drug.categoryId)}</td>
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <span className="line-clamp-1 text-muted">{drug.companyName}</span>
                    </td>
                    <td className="num px-2 py-2.5 font-semibold text-ink sm:px-3">{faNum(drug.price)}</td>
                    <td className="num hidden px-3 py-2.5 text-muted md:table-cell">{faNum(drug.unitPrice)}</td>
                    <td className="num hidden px-3 py-2.5 text-muted lg:table-cell">{faNum(drug.monthlyCost)}</td>
                    <td className="px-2 py-2.5 sm:px-3">
                      <PriceChange value={drug.changePct} compact />
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">
                      <StatusBadge status={drug.status as DrugStatus} small />
                    </td>
                    <td className="px-2 py-2.5 sm:px-4">
                      <div className="flex items-center gap-1">
                        <WatchlistButton drug={drug} compact />
                        <Link
                          href={`/drug/${drug.code}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-faint transition hover:border-[#bdd7f4] hover:text-brand"
                          aria-label={`جزئیات ${drug.name}`}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center">
              <X className="h-5 w-5 text-faint" />
              <p className="mt-2 text-[11.5px] font-medium text-ink">نتیجه‌ای با این فیلترها پیدا نشد</p>
              <button type="button" onClick={reset} className="mt-2 text-[10px] text-brand hover:text-brand-dark">
                پاک کردن فیلترها
              </button>
            </div>
          )}

          {results.length > limit && (
            <div className="border-t border-line/60 p-3 text-center">
              <button
                type="button"
                onClick={() => setLimit((value) => value + PAGE_LIMIT)}
                className="btn-secondary !py-1.5 text-[10px]"
              >
                نمایش {faNum(Math.min(PAGE_LIMIT, results.length - limit))} نتیجه بیشتر
              </button>
            </div>
          )}
        </div>

        <p className="mt-2 text-[9px] text-faint">
          {faPrice(results.reduce((sum, drug) => sum + drug.price, 0))} مجموع قیمت بسته نتایج فعلی ·
          خروجی CSV برای تحلیل در صفحه‌گسترده مناسب است.
        </p>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9.5px] text-muted">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field !py-1.5 text-[10px]">
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

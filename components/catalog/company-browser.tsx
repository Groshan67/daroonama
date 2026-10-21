"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Search, X } from "lucide-react";
import type { CatalogCompany } from "@/lib/catalog/types";
import { faNum, faPrice } from "@/lib/format";

const FILTERS = [
  { key: "all", label: "همه" },
  { key: "priced", label: "دارای قیمت" },
  { key: "unpriced", label: "بدون قیمت" },
  { key: "multi", label: "چند تولیدکننده" },
  { key: "large", label: "بیش از ۱۰۰ محصول" },
] as const;

type CompanyFilter = (typeof FILTERS)[number]["key"];

export function CompanyBrowser({ companies }: { companies: CatalogCompany[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CompanyFilter>("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (q && !`${company.name} ${company.id}`.toLowerCase().includes(q)) return false;
      if (filter === "priced" && company.pricedCount === 0) return false;
      if (filter === "unpriced" && company.pricedCount > 0) return false;
      if (filter === "multi" && company.producerCount < 2) return false;
      if (filter === "large" && company.count < 100) return false;
      return true;
    });
  }, [companies, query, filter]);

  return (
    <div>
      <div className="surface-card mt-5 p-4">
        <div className="relative max-w-[520px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جستجوی نام شرکت…"
            className="h-10 w-full rounded-xl border border-line bg-white ps-9 pe-9 text-[11.5px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-faint" aria-label="پاک">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3">
          <span className="me-1 text-[9px] text-faint">فیلتر:</span>
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-2.5 py-1 text-[9.5px] transition ${
                filter === item.key
                  ? "border-[#c9ddf5] bg-[#eef5fe] font-semibold text-brand-dark"
                  : "border-line bg-white text-muted hover:border-[#c9ddf5] hover:text-brand"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-faint">
          <span className="num font-semibold text-ink-soft">{faNum(filtered.length)}</span> شرکت
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((company) => (
          <Link
            key={company.id}
            href={`/company/${encodeURIComponent(company.id)}`}
            className="surface-card group p-4 transition-all hover:-translate-y-0.5 hover:border-[#cfe0f2] hover:shadow-lift"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf2fe] text-[#2f6fce]">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[12.5px] font-bold text-ink group-hover:text-brand-dark">{company.name}</h3>
                <p className="mt-0.5 text-[8.5px] text-faint">صاحب برند / تولیدکننده</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag className="bg-[#eaf2fe] text-[#2f6fce] ring-[#d5e4f5]">{faNum(company.count)} محصول</Tag>
              <Tag className="bg-[#e6f7f3] text-[#158d7d] ring-[#cdeee6]">{faNum(company.producerCount)} تولیدکننده</Tag>
              <Tag className="bg-[#f0ecfd] text-[#6749c6] ring-[#ddd5f8]">{faNum(company.genericCodes)} GenericCode</Tag>
              {company.minPrice !== null && (
                <Tag className="bg-[#fdf3e2] text-[#b9751d] ring-[#f0dfbd]">
                  از {faPrice(company.minPrice)} ت
                </Tag>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[8.5px] ring-1 ${className}`}>{children}</span>;
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { ClassificationGroup } from "@/lib/catalog/types";
import { faNum } from "@/lib/format";

export function ClassificationModal({
  groups,
  initiallyOpen = true,
}: {
  groups: ClassificationGroup[];
  initiallyOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initiallyOpen);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        categories: group.categories.filter((category) => {
          if (!q) return true;
          return `${category.name} ${category.nameEn} ${group.name} ${group.nameEn}`
            .toLowerCase()
            .includes(q);
        }),
      }))
      .filter((group) => group.categories.length > 0);
  }, [groups, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary"
      >
        مشاهده همه دسته‌بندی‌ها
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-[#0f2744]/30 p-3 backdrop-blur-[2px] sm:p-8">
          <div className="surface-card my-4 w-full max-w-[820px] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
              <div>
                <h2 className="text-[15px] font-bold text-ink">همه دسته‌بندی‌ها</h2>
                <p className="mt-0.5 text-[9px] text-faint">دسته‌بندی بر اساس ATC و گروه درمانی</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-faint transition hover:bg-surface-soft hover:text-ink"
                aria-label="بستن"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-line/60 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="جستجوی دسته‌بندی…"
                  className="h-10 w-full rounded-xl border border-line bg-white ps-9 pe-3 text-[11px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-4">
              {filtered.map((group) => (
                <section key={group.code} className="mb-5 last:mb-0">
                  <h3 className="mb-2 text-[9px] font-bold uppercase tracking-[0.08em] text-faint">
                    {group.name} <span dir="ltr" className="font-normal">({group.code})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {group.categories.map((category) => (
                      <button
                        key={category.code}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          router.push(`/category/${category.code}`);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9.5px] transition ${
                          category.count > 0
                            ? "border-line bg-white text-ink-soft hover:border-[#bdd7f4] hover:bg-[#f4f8ff] hover:text-brand"
                            : "border-line/50 bg-surface-soft text-faint/60"
                        }`}
                      >
                        {category.name}
                        <span className="num text-[8px] text-faint">{faNum(category.count)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
              {filtered.length === 0 && (
                <p className="py-10 text-center text-[11px] text-faint">دسته‌ای پیدا نشد.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

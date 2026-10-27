"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CornerDownLeft,
  Layers,
  Loader2,
  Pill,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tags,
  TrendingUp,
  X,
} from "lucide-react";
import type { SearchHit, SearchResults } from "@/lib/data/types";

const POPULAR = ["آملودیپین", "متفورمین", "آتورواستاتین", "امپرازول", "سفیکسیم", "لوزارتان"];

const QUICK_LINKS = [
  { title: "جستجوی دارو", href: "/search", icon: Search },
  { title: "شبیه‌سازی هزینه", href: "/simulation", icon: TrendingUp },
  { title: "تقویم بازنگری", href: "/calendar", icon: CalendarDays },
  { title: "جستجوی شرطی", href: "/screener", icon: SlidersHorizontal },
  { title: "دستیار هوشمند", href: "/ask", icon: Sparkles },
];

type ResultGroup = { key: string; label: string; icon: typeof Pill; hits: SearchHit[] };

const GROUP_THEME: Record<
  string,
  { section: string; icon: string; label: string; active: string; meta: string }
> = {
  category: {
    section: "border-[#f0dfbd] bg-[#fffbf3]",
    icon: "bg-[#fdf3e4] text-[#b9751d]",
    label: "text-[#a96a18]",
    active: "bg-[#fff3df]",
    meta: "bg-[#fdf3e4] text-[#a96a18]",
  },
  drug: {
    section: "border-[#d5e4f5] bg-[#f7fbff]",
    icon: "bg-[#eaf2fe] text-brand",
    label: "text-brand",
    active: "bg-[#eef5fe]",
    meta: "bg-[#eaf2fe] text-brand-dark",
  },
  ingredient: {
    section: "border-[#cdeee6] bg-[#f5fcfa]",
    icon: "bg-[#e6f7f3] text-[#158d7d]",
    label: "text-[#158d7d]",
    active: "bg-[#e8f7f3]",
    meta: "bg-[#e6f7f3] text-[#158d7d]",
  },
  company: {
    section: "border-[#ddd5f8] bg-[#faf8ff]",
    icon: "bg-[#f0ecfd] text-[#7457d4]",
    label: "text-[#6749c6]",
    active: "bg-[#f0ecfd]",
    meta: "bg-[#f0ecfd] text-[#6749c6]",
  },
};

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const groups: ResultGroup[] = useMemo(() => {
    if (!results) return [];
    return [
      { key: "category", label: "دسته‌بندی‌های دارو", icon: Tags, hits: results.categories },
      { key: "drug", label: "داروها", icon: Pill, hits: results.drugs },
      { key: "ingredient", label: "مواد مؤثره", icon: Layers, hits: results.ingredients },
      { key: "company", label: "شرکت‌های داروسازی", icon: Building2, hits: results.companies },
    ].filter((group) => group.hits.length > 0);
  }, [results]);

  const flatHits = useMemo(() => groups.flatMap((group) => group.hits), [groups]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults(null);
      setActiveIndex(0);
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
    setActiveIndex(0);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=4`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as SearchResults;
        setResults(data);
        setActiveIndex(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults(null);
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const go = (href: string) => {
    onClose();
    setQuery("");
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] sm:pt-[11vh]">
      <button
        type="button"
        aria-label="بستن جستجو"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#0c2138]/40 backdrop-blur-[3px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="جستجوی سراسری"
        className="scale-in relative w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_40px_110px_-30px_rgba(7,29,57,0.55)]"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
          <Search className="h-[18px] w-[18px] shrink-0 text-brand" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="نام دارو، ماده مؤثره، کد IRC یا سازنده…"
            aria-label="عبارت جستجو"
            className="h-9 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(flatHits.length - 1, index + 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(0, index - 1));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (flatHits[activeIndex]) go(flatHits[activeIndex].href);
                else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
              } else if (event.key === "Escape") {
                onClose();
              }
            }}
          />
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-faint" />
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-line bg-surface-soft px-1.5 py-0.5 text-[10.5px] text-faint sm:block">
              ESC
            </kbd>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-surface-tint hover:text-ink sm:hidden"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto overscroll-contain px-2 py-2 sm:max-h-[62vh]">
          {query.trim().length < 2 ? (
            <div className="px-2 py-1.5">
              <p className="eyebrow mb-2.5 px-1">جستجوهای پرطرفدار</p>
              <div className="mb-4 flex flex-wrap gap-1.5 px-1">
                {POPULAR.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="chip !bg-surface-soft !py-1.5 text-[12.5px]"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="eyebrow mb-1 px-1">دسترسی سریع</p>
              <div className="grid gap-0.5 sm:grid-cols-2">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => go(link.href)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-start text-[13px] text-ink-soft hover:bg-surface-tint"
                    >
                      <Icon className="h-4 w-4 text-faint" strokeWidth={1.8} />
                      {link.title}
                      <ArrowLeft className="ms-auto h-3.5 w-3.5 text-faint/60" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : groups.length === 0 && !loading ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-tint text-faint">
                <Search className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-ink">نتیجه‌ای برای «{query}» پیدا نشد</p>
              <p className="max-w-sm text-[12.5px] leading-6 text-muted">
                نام کامل‌تر دارو، نام ماده مؤثره یا کد IRC را امتحان کنید. می‌توانید از صفحه جستجوی
                پیشرفته هم استفاده کنید.
              </p>
              <button
                type="button"
                onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="mt-1 text-[12.5px] font-medium text-brand hover:text-brand-dark"
              >
                جستجوی پیشرفته
              </button>
            </div>
          ) : (
            <>
              {groups.map((group) => {
                const GroupIcon = group.icon;
                const theme = GROUP_THEME[group.key] ?? GROUP_THEME.drug;
                return (
                  <div key={group.key} className={`mb-2 rounded-xl border p-1.5 ${theme.section}`}>
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${theme.icon}`}>
                        <GroupIcon className="h-3.5 w-3.5" strokeWidth={1.9} />
                      </span>
                      <p className={`text-[10.5px] font-bold ${theme.label}`}>{group.label}</p>
                      <span className={`num ms-auto rounded-full px-1.5 py-[1px] text-[8px] ${theme.icon}`}>
                        {group.hits.length}
                      </span>
                    </div>
                    {group.hits.map((hit) => {
                      const index = flatHits.findIndex((item) => item.href === hit.href);
                      const active = index === activeIndex;
                      return (
                        <button
                          key={`${hit.kind}-${hit.id}`}
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(hit.href)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors ${
                            active ? theme.active : "hover:bg-white/70"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              active ? "bg-white shadow-sm" : theme.icon
                            }`}
                          >
                            <GroupIcon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-semibold text-ink">
                              {hit.title}
                            </span>
                            <span className="block truncate text-[11px] text-faint">{hit.subtitle}</span>
                          </span>
                          {hit.meta && (
                            <span className={`num shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-semibold sm:text-[8.5px] ${theme.meta}`}>
                              {hit.meta}
                            </span>
                          )}
                          {active && (
                            <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-brand/70" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="flex w-full items-center gap-2 border-t border-line/70 px-3 py-2.5 text-[12px] font-medium text-brand hover:bg-surface-soft"
              >
                <Search className="h-3.5 w-3.5" />
                مشاهده همه نتایج برای «{query.trim()}»
                <ArrowLeft className="ms-auto h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface-soft/70 px-4 py-2 text-[10.5px] text-faint">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line bg-white px-1 py-0.5">↑</kbd>
            <kbd className="rounded border border-line bg-white px-1 py-0.5">↓</kbd>
            برای جابه‌جایی
            <kbd className="ms-1 rounded border border-line bg-white px-1 py-0.5">Enter</kbd>
            برای انتخاب
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <Search className="h-3 w-3" />
            دارونما · جستجوی سراسری
          </span>
        </div>
      </div>
    </div>
  );
}

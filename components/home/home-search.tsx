"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Building2,
  CornerDownLeft,
  Layers,
  Loader2,
  Pill,
  Search,
  Tags,
} from "lucide-react";
import type { SearchHit, SearchResults } from "@/lib/data/types";

const EXAMPLES = [
  { label: "متفورمین", hint: "ماده مؤثره" },
  { label: "آتوموکستین", hint: "ماده مؤثره" },
  { label: "0137778632294324", hint: "کد IRC", ltr: true },
];

const HIT_ICONS = {
  drug: Pill,
  ingredient: Layers,
  company: Building2,
  category: Tags,
} as const;

const HIT_THEME = {
  drug: "bg-[#eaf2fe] text-brand",
  ingredient: "bg-[#e6f7f3] text-[#158d7d]",
  company: "bg-[#f0ecfd] text-[#6749c6]",
  category: "bg-[#fdf3e4] text-[#a96a18]",
} as const;

export function HomeSearch() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const hits: SearchHit[] = results
    ? [
        ...results.categories,
        ...results.drugs,
        ...results.ingredients,
        ...results.companies,
      ].slice(0, 7)
    : [];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
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
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=3`, {
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
    }, 170);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const go = (href: string) => {
    setFocused(false);
    router.push(href);
  };

  const submit = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    go(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showDropdown = focused && query.trim().length >= 2;

  return (
    <div className="mx-auto mt-7 w-full max-w-[730px]">
      <form
        ref={wrapperRef}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="relative z-20"
      >
        <div
          className={`flex h-[58px] items-center rounded-2xl border bg-white pe-2 ps-4 shadow-search transition-all duration-200 sm:h-[62px] sm:ps-5 ${
            focused
              ? "border-[#a7c9ee] shadow-[0_0_0_4px_rgba(47,111,206,0.09),0_20px_45px_-20px_rgba(23,61,110,0.35)]"
              : "border-white/90"
          }`}
        >
          <Search
            className={`h-[19px] w-[19px] shrink-0 transition-colors ${
              focused ? "text-brand" : "text-faint"
            }`}
            strokeWidth={2}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && hits.length) {
                event.preventDefault();
                setActiveIndex((index) => Math.min(hits.length - 1, index + 1));
              } else if (event.key === "ArrowUp" && hits.length) {
                event.preventDefault();
                setActiveIndex((index) => Math.max(0, index - 1));
              } else if (event.key === "Enter") {
                if (hits[activeIndex]) {
                  event.preventDefault();
                  go(hits[activeIndex].href);
                }
              } else if (event.key === "Escape") {
                setFocused(false);
                inputRef.current?.blur();
              }
            }}
            placeholder="جستجو بر اساس نام دارو، ماده مؤثره یا کد IRC…"
            aria-label="جستجوی دارو"
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[13.5px] text-ink outline-none placeholder:text-faint/90 sm:text-[14px]"
          />
          {loading ? (
            <Loader2 className="me-2 h-4 w-4 shrink-0 animate-spin text-faint" />
          ) : (
            <kbd className="me-1 hidden rounded-md border border-line bg-surface-soft px-1.5 py-0.5 text-[10.5px] text-faint sm:block">
              /
            </kbd>
          )}
          <button
            type="submit"
            aria-label="جستجو"
            className="ms-1 inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#3d7fdc] to-[#2a66c2] text-white shadow-[0_10px_22px_-10px_rgba(35,92,178,0.85)] transition-transform hover:scale-[1.04] active:scale-95 sm:h-[46px] sm:w-[46px]"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        {showDropdown && (
          <div
            className="absolute inset-x-0 top-[calc(100%+9px)] z-30 overflow-hidden rounded-xl border border-line bg-white text-start shadow-[0_30px_80px_-26px_rgba(10,36,68,0.45)]"
            onMouseDown={(event) => event.preventDefault()}
          >
            {hits.length === 0 ? (
              <div className="px-4 py-5 text-center text-[12.5px] text-muted">
                {loading ? "در حال جستجو…" : `نتیجه‌ای برای «${query.trim()}» پیدا نشد.`}
              </div>
            ) : (
              <>
                <p className="border-b border-line/70 px-4 py-2 text-[10px] font-semibold tracking-wide text-faint">
                  نتایج پیشنهادی
                </p>
                <ul className="max-h-[330px] overflow-y-auto p-1.5">
                  {hits.map((hit) => {
                    const Icon = HIT_ICONS[hit.kind];
                    const index = hits.indexOf(hit);
                    return (
                      <li key={`${hit.kind}-${hit.id}`}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => go(hit.href)}
                          className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start ${
                            index === activeIndex ? "bg-[#eef5fe]" : "hover:bg-surface-soft"
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${HIT_THEME[hit.kind]}`}>
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium text-ink">{hit.title}</span>
                              {hit.meta && (
                                <span className={`num shrink-0 rounded px-1 py-[1px] text-[8px] font-semibold ${HIT_THEME[hit.kind]}`}>
                                  {hit.meta}
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-[11px] text-faint">{hit.subtitle}</span>
                          </span>
                          {index === activeIndex && (
                            <CornerDownLeft className="h-3.5 w-3.5 text-brand/60" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => submit()}
                  className="flex w-full items-center gap-2 border-t border-line/70 px-4 py-2.5 text-[11.5px] font-medium text-brand hover:bg-surface-soft"
                >
                  <Search className="h-3.5 w-3.5" />
                  همه نتایج برای «{query.trim()}»
                </button>
              </>
            )}
          </div>
        )}
      </form>

      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-[11.5px] text-faint">
        <span>مثال‌ها:</span>
        {EXAMPLES.map((example, index) => (
          <span key={example.label} className="inline-flex items-center gap-1.5">
            {index > 0 && <span className="text-line-strong">·</span>}
            <button
              type="button"
              dir={example.ltr ? "ltr" : undefined}
              onClick={() => {
                setQuery(example.label);
                submit(example.label);
              }}
              className="rounded px-0.5 font-medium text-ink-soft/80 underline decoration-line-strong decoration-dotted underline-offset-4 transition hover:text-brand hover:decoration-brand/40"
            >
              {example.label}
            </button>
            <span className="text-[10px] text-faint/80">({example.hint})</span>
          </span>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/55 px-3.5 py-1.5 text-[11px] leading-5 text-muted backdrop-blur">
          <Bookmark className="h-3.5 w-3.5 shrink-0 text-brand/70" strokeWidth={1.9} />
          <span>
            با افزودن دارو به «لیست پیگیری»، آخرین قیمت و وضعیت بازنگری را ببینید
            <span className="mx-1 text-faint/60">·</span>
            در صفحه دارو کلید
            <kbd className="mx-1 rounded border border-line bg-white px-1 py-[1px] text-[9.5px] text-faint">
              F
            </kbd>
          </span>
        </p>
      </div>
    </div>
  );
}

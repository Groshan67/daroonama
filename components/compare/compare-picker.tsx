"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

type IngredientOption = { key: string; name: string };
type Hit = { id: string; title: string; subtitle?: string };

function useIngredientSearch(query: string, open: boolean) {
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&limit=6`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { ingredients?: Hit[] };
        setHits(data.ingredients ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  return { hits, loading };
}

function IngredientBox({
  label,
  value,
  onSelect,
  onClear,
}: {
  label: string;
  value: IngredientOption | null;
  onSelect: (value: IngredientOption) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [open, setOpen] = useState(false);
  const { hits, loading } = useIngredientSearch(query, open);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1.5 block text-[10px] font-medium text-muted">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onClear();
          }}
          onFocus={() => setOpen(true)}
          placeholder="نام ماده مؤثره…"
          className="h-10 w-full rounded-lg border border-line bg-white ps-9 pe-9 text-[11px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onClear();
            }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
            aria-label="پاک کردن"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {value && (
        <span className="mt-1.5 inline-flex rounded-full bg-[#eef5fe] px-2 py-0.5 text-[8.5px] text-brand">
          انتخاب: {value.name}
        </span>
      )}
      {open && query.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-pop">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-[10px] text-faint">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              جستجو…
            </div>
          ) : hits.length > 0 ? (
            hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  const selected = { key: hit.id, name: hit.title };
                  setQuery(hit.title);
                  setOpen(false);
                  onSelect(selected);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start hover:bg-surface-soft"
              >
                <span className="truncate text-[10px] font-medium text-ink">{hit.title}</span>
                <span className="shrink-0 text-[8px] text-faint">{hit.subtitle}</span>
              </button>
            ))
          ) : (
            <p className="py-4 text-center text-[10px] text-faint">ماده مؤثره‌ای پیدا نشد.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function ComparePicker({
  initialA,
  initialB,
}: {
  initialA?: IngredientOption | null;
  initialB?: IngredientOption | null;
}) {
  const router = useRouter();
  const [left, setLeft] = useState<IngredientOption | null>(initialA ?? null);
  const [right, setRight] = useState<IngredientOption | null>(initialB ?? null);

  const canCompare = Boolean(left && right && left.key !== right.key);

  return (
    <section className="surface-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 border-b border-line/70 pb-2.5">
        <Search className="h-4 w-4 text-brand" />
        <h2 className="text-[13px] font-bold text-ink">دو ماده مؤثره را انتخاب کنید</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <IngredientBox label="ماده مؤثره اول" value={left} onSelect={setLeft} onClear={() => setLeft(null)} />
        <span className="hidden pb-2 text-faint md:block">در مقابل</span>
        <IngredientBox label="ماده مؤثره دوم" value={right} onSelect={setRight} onClear={() => setRight(null)} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[9px] text-faint">
          هر دو ماده باید از نتایج جستجو انتخاب شوند تا صفحه مقایسه ساخته شود.
        </p>
        <button
          type="button"
          disabled={!canCompare}
          onClick={() => {
            if (!left || !right) return;
            router.push(`/compare?a=${encodeURIComponent(left.key)}&b=${encodeURIComponent(right.key)}`);
          }}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          مقایسه قیمت
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

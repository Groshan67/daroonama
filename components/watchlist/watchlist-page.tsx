"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpLeft,
  Bookmark,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useWatchlist } from "@/components/watchlist-provider";
import { PriceChange } from "@/components/drug/price-change";
import { faNum, faPrice, faPercent } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";
import type { DrugSummary } from "@/lib/data/types";

export function WatchlistPage() {
  const { entries, hydrated, remove, clear, count } = useWatchlist();
  const [current, setCurrent] = useState<Record<string, DrugSummary>>({});
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || entries.length === 0) {
      setCurrent({});
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/drugs?codes=${entries.map((entry) => entry.code).join(",")}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        return (await response.json()) as { drugs: DrugSummary[] };
      })
      .then((data) => {
        const map: Record<string, DrugSummary> = {};
        for (const drug of data.drugs) map[drug.code] = drug;
        setCurrent(map);
        setLastSync(new Date().toISOString());
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [entries, hydrated]);

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        const live = current[entry.code];
        const price = live?.price ?? entry.priceAtAdd;
        return {
          entry,
          live,
          price,
          diff: price - entry.priceAtAdd,
          pct: entry.priceAtAdd ? ((price - entry.priceAtAdd) / entry.priceAtAdd) * 100 : 0,
        };
      }),
    [entries, current],
  );

  const totalNow = rows.reduce((sum, row) => sum + row.price, 0);
  const changed = rows.filter((row) => row.diff !== 0).length;

  return (
    <div className="page-container py-7 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-brand" />
            پیگیری شخصی قیمت
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            لیست پیگیری
          </h1>
          <p className="mt-1.5 max-w-[620px] text-[12px] leading-6 text-muted">
            داروهای ذخیره‌شده و تغییر قیمت آن‌ها از زمان افزودن. این لیست در همین مرورگر ذخیره
            می‌شود و نیاز به ثبت‌نام ندارد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 text-[9.5px] text-muted">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-brand" : "text-faint"}`} />
            {loading ? "به‌روزرسانی…" : lastSync ? "به‌روز" : "آماده"}
          </span>
          <span className="num inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0f5] bg-[#eef5fe] px-2.5 py-2 text-[10px] font-semibold text-brand-dark">
            <Bookmark className="h-3.5 w-3.5" />
            {hydrated ? faNum(count) : "—"} قلم
          </span>
        </div>
      </div>

      {!hydrated ? (
        <div className="surface-card mt-6 flex items-center justify-center gap-2 py-16 text-[11px] text-faint">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال خواندن لیست…
        </div>
      ) : entries.length === 0 ? (
        <div className="surface-card mt-6 flex flex-col items-center px-5 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf2fe] to-[#e8f7f3] text-brand ring-1 ring-[#dbe8f6]">
            <Bookmark className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h2 className="mt-3 text-[14px] font-bold text-ink">هنوز دارویی ذخیره نکرده‌اید</h2>
          <p className="mt-1.5 max-w-sm text-[11px] leading-6 text-muted">
            در صفحه هر دارو دکمه «افزودن به لیست پیگیری» را بزنید یا کلید F را فشار دهید. تغییر
            قیمت از زمان افزودن در همین صفحه نمایش داده می‌شود.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/search" className="btn-primary">
              <Search className="h-3.5 w-3.5" />
              جستجوی دارو
            </Link>
            <Link href="/ingredients" className="btn-secondary">
              مرور مواد مؤثره
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Stat label="اقلام ذخیره‌شده" value={`${faNum(rows.length)} قلم`} />
            <Stat label="قیمت فعلی مجموع" value={faPrice(totalNow)} />
            <Stat
              label="اقلام تغییرکرده"
              value={`${faNum(changed)} قلم`}
              tone={changed > 0 ? "rose" : undefined}
            />
            <Stat
              label="میانگین تغییر"
              value={faPercent(
                rows.length ? rows.reduce((sum, row) => sum + row.pct, 0) / rows.length : 0,
                true,
              )}
              tone={changed > 0 ? "rose" : undefined}
            />
          </div>

          {changed > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#f0dce2] bg-[#fff8fa] px-3.5 py-2.5 text-[10px] text-[#9d4a5f]">
              <TrendingUp className="h-3.5 w-3.5" />
              قیمت {faNum(changed)} قلم از زمان افزودن تغییر کرده است. برای مشاهده جزئیات، روی هر
              دارو بزنید.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] text-faint">مرتب‌شده بر اساس آخرین افزودن</p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("همه اقلام از لیست پیگیری حذف شوند؟")) clear();
              }}
              className="inline-flex items-center gap-1 text-[9.5px] text-faint transition-colors hover:text-[#bd4f67]"
            >
              <Trash2 className="h-3 w-3" />
              پاک کردن همه
            </button>
          </div>

          <div className="mt-2.5 space-y-2.5">
            {rows.map(({ entry, live, price, diff, pct }) => (
              <article
                key={entry.code}
                className="surface-card group p-3.5 transition-all hover:border-[#cfe0f2] hover:shadow-lift sm:p-4"
              >
                <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:items-center">
                  <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-tint text-brand sm:flex">
                    <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/drug/${entry.code}`}
                        className="text-[13px] font-bold text-ink transition-colors hover:text-brand"
                      >
                        {entry.name}
                      </Link>
                      {!live && (
                        <span className="rounded bg-[#fdf3e4] px-1.5 py-0.5 text-[8px] text-[#a86e19]">
                          داده به‌روزرسانی نشد
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {entry.ingredientName}
                      <span className="mx-1 text-faint/60">·</span>
                      {entry.companyName}
                    </p>
                    <p className="mt-1 text-[8.5px] text-faint">
                      افزوده‌شده در {formatJalali(entry.addedAt)}
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2 border-t border-line/60 pt-2.5 sm:w-auto sm:gap-7 sm:border-0 sm:pt-0">
                    <div>
                      <p className="text-[8px] text-faint">هنگام افزودن</p>
                      <p className="num mt-0.5 text-[10.5px] font-medium text-muted">
                        {faNum(entry.priceAtAdd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-faint">قیمت فعلی</p>
                      <p className="num mt-0.5 text-[11px] font-bold text-ink">{faNum(price)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-faint">تغییر</p>
                      <div className="mt-0.5">
                        <PriceChange value={pct} compact title="تغییر از زمان افزودن" />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/drug/${entry.code}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-faint transition hover:border-[#bdd7f4] hover:text-brand"
                      aria-label={`مشاهده ${entry.name}`}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(entry.code)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-faint transition hover:border-[#f0d6dd] hover:bg-[#fff7f9] hover:text-[#bd4f67]"
                      aria-label={`حذف ${entry.name} از لیست`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {diff !== 0 && (
                  <div className="mt-2 flex items-center gap-1.5 border-t border-line/50 pt-2 text-[8.5px] text-faint">
                    <ArrowUpLeft className="h-2.5 w-2.5 text-[#bd4f67]" />
                    تغییر {faNum(Math.abs(diff))} تومان از زمان افزودن
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed border-line-strong/70 bg-white/40 px-3 py-2 text-[9px] leading-5 text-faint">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />
            قیمت‌های فعلی با آخرین داده ثبت‌شده مقایسه می‌شوند. این لیست فقط در همین مرورگر ذخیره
            شده است و بین دستگاه‌ها همگام نمی‌شود.
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "rose" }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p className={`num mt-0.5 text-[12px] font-bold ${tone === "rose" ? "text-[#b84d64]" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

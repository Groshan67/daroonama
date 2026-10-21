"use client";

import Link from "next/link";
import { Bell, BellRing, TrendingUp } from "lucide-react";
import { WatchlistButton } from "@/components/watchlist-button";
import { useWatchlist } from "@/components/watchlist-provider";
import { faNum, faPercent } from "@/lib/format";
import type { DrugSummary } from "@/lib/data/types";

export function WatchPanel({ drug }: { drug: DrugSummary }) {
  const { entries, hydrated } = useWatchlist();
  const entry = entries.find((item) => item.code === drug.code);
  const diff = entry ? drug.price - entry.priceAtAdd : 0;
  const pct = entry && entry.priceAtAdd ? (diff / entry.priceAtAdd) * 100 : 0;

  return (
    <div className="rounded-xl border border-[#d9e7f7] bg-gradient-to-b from-[#f8fbff] to-white p-3.5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf2fe] text-brand">
          {entry ? (
            <BellRing className="h-3.5 w-3.5" strokeWidth={1.9} />
          ) : (
            <Bell className="h-3.5 w-3.5" strokeWidth={1.9} />
          )}
        </span>
        <div>
          <h3 className="text-[11.5px] font-bold leading-5 text-ink">پیگیری تغییر قیمت</h3>
          <p className="text-[9px] leading-4 text-faint">اعلان هنگام تغییر قیمت یا وضعیت بازنگری</p>
        </div>
      </div>

      {hydrated && entry ? (
        <div className="mt-2.5 rounded-lg border border-line/80 bg-white px-2.5 py-2">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="text-faint">از زمان افزودن</span>
            <span
              className={`num inline-flex items-center gap-1 font-semibold ${
                diff > 0 ? "text-[#bd4f67]" : diff < 0 ? "text-[#1b8663]" : "text-muted"
              }`}
            >
              {diff !== 0 && <TrendingUp className="h-3 w-3" />}
              {diff === 0 ? "بدون تغییر" : faPercent(pct)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-faint">
            <span>قیمت هنگام افزودن</span>
            <span className="num">{faNum(entry.priceAtAdd)} تومان</span>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-[10px] leading-5 text-muted">
          این دارو را ذخیره کنید تا تغییرات قیمت آن را در لیست پیگیری ببینید.
        </p>
      )}

      <div className="mt-2.5">
        <WatchlistButton drug={drug} withShortcut fullWidth />
      </div>
      {entry && (
        <Link
          href="/watchlist"
          className="mt-2 block text-center text-[9.5px] text-brand hover:text-brand-dark"
        >
          مشاهده لیست پیگیری
        </Link>
      )}
    </div>
  );
}

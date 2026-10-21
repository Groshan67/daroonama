"use client";

import { useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useWatchlist } from "./watchlist-provider";
import type { DrugSummary } from "@/lib/data/types";

type WatchlistDrug = Pick<
  DrugSummary,
  "code" | "name" | "ingredientName" | "companyName" | "price"
>;

export function WatchlistButton({
  drug,
  withShortcut = false,
  compact = false,
  fullWidth = false,
}: {
  drug: WatchlistDrug;
  withShortcut?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
}) {
  const { isSaved, toggle, hydrated } = useWatchlist();
  const saved = hydrated && isSaved(drug.code);

  const onToggle = () => {
    toggle({
      code: drug.code,
      name: drug.name,
      ingredientName: drug.ingredientName,
      companyName: drug.companyName,
      priceAtAdd: drug.price,
    });
  };

  useEffect(() => {
    if (!withShortcut) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={saved ? "حذف از لیست پیگیری" : "افزودن به لیست پیگیری"}
        aria-pressed={saved}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
          saved
            ? "border-[#e7c79b] bg-[#fdf1dc] text-[#a96a18] shadow-sm ring-1 ring-[#efd7b4]"
            : "border-line bg-white text-faint hover:border-[#f0c98d] hover:bg-[#fff7eb] hover:text-[#b9751d]"
        }`}
      >
        {saved ? (
          <BookmarkCheck className="h-4 w-4" strokeWidth={1.9} />
        ) : (
          <Bookmark className="h-4 w-4" strokeWidth={1.9} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={saved}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-all ${
        fullWidth ? "w-full" : ""
      } ${
        saved
          ? "border-[#e7c79b] bg-[#fdf1dc] text-[#a96a18] shadow-[0_1px_2px_rgba(143,109,52,0.08)] ring-1 ring-[#efd7b4] hover:bg-[#fbe8cc]"
          : "border-line-strong bg-white text-ink-soft hover:border-[#f0c98d] hover:bg-[#fff7eb] hover:text-[#b9751d]"
      }`}
      title={withShortcut ? "افزودن یا حذف با کلید F" : undefined}
    >
      {saved ? (
        <BookmarkCheck className="h-[17px] w-[17px]" strokeWidth={2} />
      ) : (
        <Bookmark className="h-[17px] w-[17px]" strokeWidth={1.9} />
      )}
      {saved ? "در لیست پیگیری" : "افزودن به لیست پیگیری"}
      {withShortcut && (
        <kbd className={`ms-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${saved ? "border-[#e7c79b] bg-white/70 text-[#a96a18]" : "border-line bg-white/70 text-faint"}`}>
          F
        </kbd>
      )}
    </button>
  );
}

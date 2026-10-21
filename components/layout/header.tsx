"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, ChevronLeft, Menu, Search, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useWatchlist } from "@/components/watchlist-provider";
import { PAGE_TITLES } from "./nav";

export function Header({
  onOpenSearch,
  onOpenMenu,
}: {
  onOpenSearch: () => void;
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();
  const { count, hydrated } = useWatchlist();
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] ?? "";
  const title = section ? (PAGE_TITLES[section] ?? "دارونما") : "نمای کلی";
  const isRoot = segments.length === 0;

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[#f2f7fd]/80 backdrop-blur-xl">
      <div className="flex h-[64px] items-center gap-2 px-4 sm:px-6 xl:px-9">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-soft hover:bg-white/80 lg:hidden"
          aria-label="باز کردن منو"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="lg:hidden">
          <Logo compact />
        </div>

        <nav
          aria-label="مسیر صفحه"
          className="hidden items-center gap-1.5 text-[12px] text-faint lg:flex"
        >
          <Link href="/" className="rounded px-1 py-0.5 transition-colors hover:text-brand">
            خانه
          </Link>
          {!isRoot && (
            <>
              <ChevronLeft className="h-3.5 w-3.5 text-faint/60" />
              <span className="font-medium text-ink-soft">{title}</span>
            </>
          )}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="group hidden h-9 w-[230px] items-center gap-2 rounded-lg border border-line bg-white/70 px-3 text-start text-[12px] text-faint shadow-[0_1px_1px_rgba(17,42,74,0.02)] transition-colors hover:border-[#bfd8f4] hover:bg-white xl:w-[280px] md:flex"
            aria-label="جستجوی سراسری"
          >
            <Search className="h-3.5 w-3.5 text-faint group-hover:text-brand" strokeWidth={2} />
            <span className="truncate">جستجوی دارو، ماده مؤثره یا کد IRC…</span>
            <kbd className="ms-auto rounded border border-line bg-surface-soft px-1.5 py-[1px] text-[10px] text-faint">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-white/80 md:hidden"
            aria-label="جستجو"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <Link
            href="/watchlist"
            className={`relative inline-flex h-9 items-center justify-center gap-1.5 rounded-lg transition-colors ${
              hydrated && count > 0
                ? "border border-[#e7c79b] bg-[#fdf1dc] px-2 text-[#a96a18] hover:bg-[#fbe8cc]"
                : "w-9 text-ink-soft hover:bg-white/80 hover:text-brand"
            }`}
            aria-label="لیست پیگیری"
            aria-current={hydrated && count > 0 ? "true" : undefined}
          >
            <Bookmark className="h-[18px] w-[18px]" strokeWidth={hydrated && count > 0 ? 2.1 : 1.9} />
            {hydrated && count > 0 && (
              <>
                <span className="hidden text-[10px] font-medium sm:inline">پیگیری</span>
                <span className="num min-w-[16px] rounded-full bg-[#c47a20] px-1 text-center text-[9px] font-bold leading-[16px] text-white shadow-sm">
                  {count.toLocaleString("fa-IR")}
                </span>
              </>
            )}
          </Link>

          <Link
            href="/ask"
            aria-label="دستیار هوشمند"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dcd7f6] bg-[#f7f5ff] px-2.5 text-[12px] font-medium text-[#5c48b7] transition-colors hover:border-[#c8bef2] hover:bg-[#f1edff]"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">دستیار هوشمند</span>
            <span className="rounded bg-white/80 px-1 py-[1px] text-[9px] font-semibold text-[#7a67c9]">
              بتا
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpLeft, Bookmark, ChevronLeft, Database, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useWatchlist } from "@/components/watchlist-provider";
import { cx } from "@/lib/format";
import { SITE } from "@/lib/site";
import { NAV_GROUPS } from "./nav";

export function Sidebar({
  open,
  onClose,
  isAdmin = false,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { count, hydrated } = useWatchlist();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="بستن منو"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#0d2035]/35 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        data-open={open}
        className="sidebar-drawer fixed inset-y-0 start-0 z-50 flex w-[272px] flex-col border-e border-white/70 bg-white/85 backdrop-blur-xl lg:z-30 lg:bg-white/65"
        aria-label="منوی اصلی"
      >
        <div className="flex h-[74px] shrink-0 items-center justify-between px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint hover:bg-surface-tint hover:text-ink lg:hidden"
            aria-label="بستن منو"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] pb-4">
          {NAV_GROUPS.filter((group) => !group.adminOnly || isAdmin).map((group, groupIndex) => (
            <div key={group.label} className={groupIndex > 0 ? "mt-5" : "mt-1"}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold tracking-[0.08em] text-faint">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <li key={`${group.label}-${item.href}-${item.label}`}>
                      <Link
                        href={item.href}
                        data-active={active}
                        aria-current={active ? "page" : undefined}
                        onClick={onClose}
                        className="nav-link"
                      >
                        <Icon
                          className={cx(
                            "h-[17px] w-[17px] shrink-0",
                            active ? "text-brand" : "text-faint",
                          )}
                          strokeWidth={active ? 2.1 : 1.8}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className="ms-auto rounded-full bg-[#eef1fe] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#5c68c9]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="mt-6 rounded-xl border border-line bg-gradient-to-b from-[#f7fbff] to-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-soft">
                <Bookmark className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
                لیست پیگیری
              </span>
              <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-brand shadow-sm num">
                {hydrated ? count : "—"}
              </span>
            </div>
            <p className="mb-2.5 text-[11px] leading-5 text-faint">
              {count > 0
                ? "تغییر قیمت اقلام ذخیره‌شده را یک‌جا ببینید."
                : "داروها را ذخیره کنید و تغییر قیمتشان را دنبال کنید."}
            </p>
            <Link
              href="/watchlist"
              onClick={onClose}
              className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-brand-dark shadow-sm ring-1 ring-line transition hover:ring-[#bcd6f3]"
            >
              مشاهده لیست
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>

        <div className="shrink-0 border-t border-line/80 px-5 py-3.5">
          <div className="flex items-center gap-2 text-[10.5px] leading-5 text-faint">
            <Database className="h-3.5 w-3.5 shrink-0 text-faint/80" />
            <span>
              داده‌ها: {SITE.source}
              <br />
              آخرین به‌روزرسانی: {SITE.updatedLabel}
            </span>
          </div>
          <Link
            href="/about"
            className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-medium text-brand/80 hover:text-brand-dark"
          >
            درباره داده‌ها و محدودیت‌ها
            <ArrowUpLeft className="h-3 w-3" />
          </Link>
        </div>
      </aside>
    </>
  );
}

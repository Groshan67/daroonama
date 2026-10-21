import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="مسیر صفحه" className="mb-3.5 flex flex-wrap items-center gap-1 text-[10px] text-faint">
      <Link href="/" className="inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-brand">
        <Home className="h-3 w-3" />
        خانه
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          <ChevronLeft className="h-3 w-3 text-faint/50" />
          {item.href ? (
            <Link href={item.href} className="rounded px-1 py-0.5 transition-colors hover:text-brand">
              {item.label}
            </Link>
          ) : (
            <span className="px-1 py-0.5 font-medium text-ink-soft">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

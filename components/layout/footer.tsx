import Link from "next/link";
import { ArrowUpLeft, Database, HeartPulse } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AdminAccess } from "./admin-access";
import { SITE } from "@/lib/site";

const QUICK_LINKS = [
  { label: "جستجوی دارو", href: "/search" },
  { label: "مواد مؤثره", href: "/ingredients" },
  { label: "طبقه‌بندی اثر دارویی", href: "/categories" },
  { label: "سازندگان", href: "/companies" },
];

const TOOL_LINKS = [
  { label: "شبیه‌سازی قیمت", href: "/simulation" },
  { label: "تقویم بازنگری", href: "/calendar" },
  { label: "آرشیو بازنگری", href: "/archive" },
  { label: "جستجوی شرطی", href: "/screener" },
];

const INFO_LINKS = [
  { label: "توضیح سیستم و گزارش‌ها", href: "/insights" },
  { label: "دستیار هوشمند", href: "/ask" },
  { label: "لیست پیگیری", href: "/watchlist" },
  { label: "درباره داده‌ها", href: "/about" },
];

export function Footer({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <footer className="border-t border-line/80 bg-white/45">
      <div className="page-container py-10 lg:py-12">
        <div className="grid gap-9 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-[12.5px] leading-6 text-muted">
              {SITE.description}
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-white/70 px-3 py-2 text-[11px] leading-5 text-faint">
              <Database className="h-3.5 w-3.5 shrink-0 text-brand/70" />
              <span>
                {SITE.source} · بازنگری {SITE.yearRange}
                <br />
                آخرین به‌روزرسانی: {SITE.updatedLabel}
              </span>
            </div>
          </div>

          <FooterColumn title="دسترسی سریع" links={QUICK_LINKS} />
          <FooterColumn title="ابزارها" links={TOOL_LINKS} />
          <FooterColumn title="اطلاعات" links={INFO_LINKS} />
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-line/70 pt-5 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © ۱۴۰۵ {SITE.name} · داده‌ها فقط برای اطلاع‌رسانی است و جایگزین مشاوره داروساز یا
            پزشک نیست.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <HeartPulse className="h-3.5 w-3.5 text-rose" />
              ساخته‌شده برای جامعه سلامت
            </span>
            <Link href="/about" className="inline-flex items-center gap-1 hover:text-brand">
              سلب مسئولیت
              <ArrowUpLeft className="h-3 w-3" />
            </Link>
            <AdminAccess isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="mb-3 text-[12px] font-semibold text-ink">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[12px] text-muted transition-colors hover:text-brand"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

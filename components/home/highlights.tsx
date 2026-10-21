import Link from "next/link";
import { CalendarClock, ChevronLeft, ClipboardCheck, Sparkles } from "lucide-react";

const ITEMS = [
  {
    value: "۱۴۰۵.۰۱",
    title: "آخرین بازنگری قیمت دارو",
    caption: "در حال اعمال · از ۱۵ فروردین ۱۴۰۵",
    href: "/calendar",
    icon: CalendarClock,
    iconClass: "bg-[#eaf2fe] text-[#2f6fce]",
    ring: "group-hover:border-[#c3dbf6]",
  },
  {
    value: "۷۲۶ قلم",
    title: "واجد شرایط ایجاد داروی جدید",
    caption: "اقلام نگهداری و غیرنگهداری",
    href: "/screener",
    icon: Sparkles,
    iconClass: "bg-[#e6f7f3] text-[#159a89]",
    ring: "group-hover:border-[#b9e4db]",
  },
  {
    value: "۴۰۴ قلم",
    title: "اقدامات انتقالی لازم",
    caption: "تا پایان اسفند ۱۴۰۵",
    href: "/archive",
    icon: ClipboardCheck,
    iconClass: "bg-[#fdf3e4] text-[#c47a20]",
    ring: "group-hover:border-[#eed9b6]",
  },
];

export function Highlights() {
  return (
    <section aria-labelledby="highlights-title">
      <SectionLabel id="highlights-title" action={{ href: "/archive", label: "آرشیو بازنگری" }}>
        هایلایت‌ها
      </SectionLabel>
      <div className="grid gap-3.5 sm:grid-cols-3">
        {ITEMS.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.value}
              href={item.href}
              className={`group surface-card rise relative flex min-h-[96px] items-start gap-3.5 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift ${item.ring}`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="num block text-[22px] font-extrabold leading-8 tracking-tight text-ink">
                  {item.value}
                </span>
                <span className="mt-0.5 block text-[12.5px] font-semibold leading-5 text-ink-soft">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-5 text-faint">{item.caption}</span>
              </span>
              <ChevronLeft className="mt-3 h-4 w-4 shrink-0 text-faint/50 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function SectionLabel({
  children,
  id,
  action,
}: {
  children: React.ReactNode;
  id?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint">
        <span className="h-3 w-[3px] rounded-full bg-brand/50" />
        {children}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand"
        >
          {action.label}
          <ChevronLeft className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

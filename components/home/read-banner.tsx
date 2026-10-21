import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronLeft } from "lucide-react";

export function ReadBanner() {
  return (
    <section className="mt-9">
      <Link
        href="/insights"
        className="group relative block overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
      >
        <span
          className="absolute inset-y-0 end-0 w-[3px] bg-gradient-to-b from-[#5b93e8] via-[#2f6fce] to-[#159a89]"
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(91,147,232,0.14),transparent)]" />
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#eef5ff] to-[#e8f8f5] text-brand ring-1 ring-[#e3edf9]">
            <BookOpen className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold tracking-[0.08em] text-faint">مطالعه</span>
            <h2 className="mt-1 text-[15px] font-bold leading-7 text-ink transition-colors group-hover:text-brand-dark sm:text-[16px]">
              توضیح سیستم و گزارش داده‌ها
            </h2>
            <p className="mt-1 max-w-2xl text-[11.5px] leading-6 text-muted">
              درباره سازوکار قیمت‌گذاری، چشم‌انداز بازنگری بعدی و داده‌های اولیه؛ مقاله‌هایی برای
              راستی‌آزمایی توضیحات شرکت‌ها و درک تغییرات قیمت.
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand sm:hidden">
              مشاهده گزارش‌ها
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="ms-auto hidden shrink-0 items-center gap-1.5 self-center text-[11px] font-medium text-faint transition-colors group-hover:text-brand sm:inline-flex">
            مشاهده گزارش‌ها
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  );
}

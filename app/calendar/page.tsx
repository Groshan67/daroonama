import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArrowLeft, CalendarDays, Clock, Info } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { REVISION_EVENTS } from "@/lib/data";
import { JALALI_MONTHS, formatJalali, jalaliParts } from "@/lib/jalali";
import { faDigits, faNum } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "تقویم بازنگری قیمت",
  description: "برنامه بازنگری قیمت دارو در سال ۱۴۰۵، مهلت‌ها و اقدامات انتقالی.",
};

const STATUS = {
  done: { label: "انجام‌شده", className: "bg-[#eaf7f0] text-[#1c825f] ring-[#d3eee2]", dot: "bg-[#2ba57c]" },
  active: { label: "در جریان", className: "bg-[#eaf2fe] text-[#2b66bd] ring-[#cfdff4]", dot: "bg-[#2f6fce]" },
  upcoming: { label: "پیش‌رو", className: "bg-[#f4f7fb] text-[#6b7f95] ring-[#e4ebf3]", dot: "bg-[#a4b3c3]" },
} as const;

export default function CalendarPage() {
  const now = new Date();
  const { jy, jm } = jalaliParts(now);
  const todayIso = now.toISOString().slice(0, 10);
  const nextEvent = REVISION_EVENTS.find((event) => event.date >= todayIso);
  const done = REVISION_EVENTS.filter((event) => event.status === "done").length;
  const active = REVISION_EVENTS.filter((event) => event.status === "active").length;
  const upcoming = REVISION_EVENTS.filter((event) => event.status === "upcoming").length;

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "ابزارها" }, { label: "تقویم بازنگری" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-brand" />
            برنامه سالانه بازنگری
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            تقویم بازنگری قیمت دارو
          </h1>
          <p className="mt-1.5 max-w-[650px] text-[12px] leading-6 text-muted">
            تاریخ‌های کلیدی بازنگری {faDigits(jy)}، مهلت ثبت قیمت و پایان اقدامات انتقالی. وضعیت
            هر رویداد بر اساس آخرین به‌روزرسانی {SITE.updatedLabel} نمایش داده می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-sm">
          <CalendarDays className="h-4 w-4 text-brand" />
          <div>
            <p className="text-[9px] text-faint">سال تقویم</p>
            <p className="num text-[13px] font-bold text-ink">{faDigits(jy)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:max-w-[560px]">
        <Stat label="انجام‌شده" value={`${faNum(done)} رویداد`} tone="emerald" />
        <Stat label="در جریان" value={`${faNum(active)} رویداد`} tone="blue" />
        <Stat label="پیش‌رو" value={`${faNum(upcoming)} رویداد`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-5">
          <section className="surface-card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold text-ink">نمای کلی سال {faDigits(jy)}</h2>
              <span className="text-[9px] text-faint">ماه جاری: {JALALI_MONTHS[jm - 1]}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {JALALI_MONTHS.map((month, index) => {
                const monthNumber = index + 1;
                const events = REVISION_EVENTS.filter((event) => event.month === monthNumber);
                const isCurrent = monthNumber === jm;
                return (
                  <div
                    key={month}
                    className={`relative min-h-[112px] rounded-xl border p-3 transition-colors ${
                      isCurrent
                        ? "border-[#a9c9ee] bg-[#f4f9ff] shadow-[0_0_0_3px_rgba(47,111,206,0.05)]"
                        : events.length
                          ? "border-line bg-white"
                          : "border-line/70 bg-surface-soft/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-[11px] font-semibold ${isCurrent ? "text-brand-dark" : "text-ink-soft"}`}>
                        {month}
                      </p>
                      <span className="num text-[8.5px] text-faint">{faDigits(monthNumber)}</span>
                    </div>
                    {isCurrent && (
                      <span className="mt-1 inline-block rounded bg-[#e2efff] px-1.5 py-0.5 text-[8px] font-medium text-brand">
                        ماه جاری
                      </span>
                    )}
                    {events.length ? (
                      <div className="mt-1.5 space-y-1.5">
                        {events.map((event) => {
                          const status = STATUS[event.status];
                          return (
                            <a key={event.date} href={`#event-${event.date}`} className="block">
                              <p className="line-clamp-2 text-[9px] leading-4 text-muted">{event.title}</p>
                              <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[7.5px] ring-1 ${status.className}`}>
                                <span className={`h-1 w-1 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-[8.5px] text-faint/70">رویدادی ثبت نشده</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line/60 pt-2.5 text-[8.5px] text-faint">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2ba57c]" />
                انجام‌شده
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2f6fce]" />
                در جریان
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a4b3c3]" />
                پیش‌رو
              </span>
              <span className="ms-auto inline-flex items-center gap-1">
                <Info className="h-3 w-3" />
                تاریخ‌ها ممکن است با ابلاغ رسمی تغییر کنند.
              </span>
            </div>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-line/70 px-4 py-3">
              <h2 className="text-[13px] font-bold text-ink">رویدادهای سال</h2>
              <p className="mt-0.5 text-[10px] text-faint">به ترتیب تاریخ، همراه با تعداد اقلام مشمول</p>
            </div>
            <ol className="relative px-4 py-2">
              {REVISION_EVENTS.map((event, index) => {
                const status = STATUS[event.status];
                return (
                  <li key={event.date} id={`event-${event.date}`} className="relative flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${status.dot} ring-white`} />
                      {index < REVISION_EVENTS.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[11.5px] font-semibold text-ink">{event.title}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] ring-1 ${status.className}`}>
                          {status.label}
                        </span>
                        {event.items > 0 && (
                          <span className="num rounded bg-surface-tint px-1.5 py-0.5 text-[8px] text-muted">
                            {faNum(event.items)} قلم
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[9px] text-faint">
                        <Clock className="me-1 inline h-2.5 w-2.5" />
                        {formatJalali(event.date)}
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-muted">{event.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">در یک نگاه</h2>
            <dl className="space-y-2.5 text-[10.5px]">
              <Row label="آخرین بازنگری" value={`${SITE.latestRevision} · ${SITE.updatedLabel}`} />
              <Row label="رویداد بعدی" value={nextEvent ? formatJalali(nextEvent.date) : "—"} />
              <Row label="اقلام انتقالی" value={`${faNum(SITE.transitional)} قلم`} />
              <Row label="واجد شرایط جدید" value={`${faNum(SITE.eligibleNew)} قلم`} />
              <Row label="پوشش بازنگری" value={SITE.yearRange} />
            </dl>
          </section>

          {nextEvent && (
            <section className="rounded-xl border border-[#cfe0f5] bg-gradient-to-b from-[#f6faff] to-white p-4">
              <p className="text-[9px] font-medium text-faint">رویداد بعدی</p>
              <h3 className="mt-1 text-[12px] font-bold leading-6 text-ink">{nextEvent.title}</h3>
              <p className="mt-0.5 text-[10px] text-muted">{formatJalali(nextEvent.date)}</p>
              <p className="mt-1.5 text-[9.5px] leading-5 text-faint">{nextEvent.note}</p>
            </section>
          )}

          <section className="surface-card p-4">
            <h2 className="mb-2 text-[12px] font-bold text-ink">دسترسی سریع</h2>
            <div className="space-y-1">
              <Link href="/archive" className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand">
                <Archive className="h-3.5 w-3.5 text-faint" />
                آرشیو بازنگری‌های گذشته
                <ArrowLeft className="ms-auto h-3 w-3 text-faint/50" />
              </Link>
              <Link href="/insights" className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand">
                <Info className="h-3.5 w-3.5 text-faint" />
                توضیح سازوکار بازنگری
                <ArrowLeft className="ms-auto h-3 w-3 text-faint/50" />
              </Link>
              <Link href="/screener?status=transitional" className="flex items-center gap-2 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft hover:bg-surface-soft hover:text-brand">
                <CalendarDays className="h-3.5 w-3.5 text-faint" />
                فیلتر اقلام انتقالی
                <ArrowLeft className="ms-auto h-3 w-3 text-faint/50" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "blue" }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] text-faint">{label}</p>
      <p
        className={`num mt-0.5 text-[12px] font-bold ${
          tone === "emerald" ? "text-[#1c825f]" : tone === "blue" ? "text-brand-dark" : "text-ink-soft"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-faint">{label}</dt>
      <dd className="num text-end font-medium leading-5 text-ink-soft">{value}</dd>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  Database,
  FlaskConical,
  Info,
  Layers,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CATEGORIES_WITH_STATS, DATASET_SIZE, PLATFORM } from "@/lib/data";
import { faNum } from "@/lib/format";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "درباره داده‌ها",
  description: "منبع، روش‌شناسی، محدودیت‌ها و سلب مسئولیت داده‌های دارونما.",
};

const FAQ = [
  {
    q: "داده‌های دارونما از کجا می‌آید؟",
    a: "ساختار داده بر پایه اسناد رسمی فهرست کدهای دارویی و بازنگری‌های دوره‌ای طراحی شده است. نسخه فعلی یک نمونه نمایشی است و اعداد آن با آمار رسمی یکسان نیست.",
  },
  {
    q: "چرا تعداد اقلام صفحه اصلی با نتایج جستجو یکی نیست؟",
    a: "شمارنده صفحه اصلی ظرفیت کامل پایگاه (۱۲٬۳۱۵ قلم) را نشان می‌دهد؛ نسخه نمایشی برای سرعت و خوانایی شامل مجموعه‌ای کوچک‌تر از اقلام نمونه است.",
  },
  {
    q: "قیمت‌ها چند وقت یک بار به‌روزرسانی می‌شوند؟",
    a: "در نسخه نمایشی، داده‌ها ثابت و آموزشی‌اند و به‌روزرسانی زنده ندارند. در نسخه واقعی، همگام‌سازی دوره‌ای با فهرست رسمی پیش‌بینی می‌شود.",
  },
  {
    q: "آیا می‌توانم از این قیمت‌ها برای خرید استفاده کنم؟",
    a: "خیر. قیمت‌ها جنبه نمایشی دارند و جایگزین فهرست رسمی، قیمت داروخانه یا مشاوره داروساز نیستند.",
  },
  {
    q: "اطلاعات لیست پیگیری کجا ذخیره می‌شود؟",
    a: "فقط در حافظه محلی همین مرورگر (localStorage). هیچ اطلاعاتی به سرور ارسال نمی‌شود و بین دستگاه‌ها همگام نمی‌شود.",
  },
];

export default function AboutPage() {
  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "درباره داده‌ها" }]} />

      <div className="max-w-[760px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-brand" />
          شفافیت داده
        </p>
        <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[32px]">
          درباره داده‌ها و محدودیت‌ها
        </h1>
        <p className="mt-2 text-[12px] leading-6 text-muted">
          دارونما یک نمونه نمایشی برای جستجو و تحلیل قیمت دارو است. این صفحه توضیح می‌دهد داده‌ها
          چگونه سازماندهی شده‌اند، چه چیزهایی را پوشش می‌دهند و در کدام موارد نباید به آن‌ها
          اتکا کرد.
        </p>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
        <InfoCard
          icon={<Database className="h-4 w-4" />}
          title="منبع و ساختار"
          text="الگوگیری از فهرست رسمی کدهای دارویی؛ شامل نام، ماده مؤثره، سازنده، بسته و تاریخ بازنگری."
          tone="blue"
        />
        <InfoCard
          icon={<FlaskConical className="h-4 w-4" />}
          title="دامنه نمونه"
          text={`${faNum(DATASET_SIZE)} قلم نمونه در ${faNum(CATEGORIES_WITH_STATS.length)} گروه درمانی؛ شمارنده کل ${faNum(PLATFORM.totalItems)} قلم است.`}
          tone="teal"
        />
        <InfoCard
          icon={<ShieldAlert className="h-4 w-4" />}
          title="محدودیت مهم"
          text="قیمت‌ها آموزشی‌اند و جایگزین قیمت داروخانه، فهرست رسمی یا توصیه درمانی نیستند."
          tone="amber"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <section className="surface-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
              <Layers className="h-4 w-4 text-brand" />
              داده‌ها چگونه سازماندهی شده‌اند؟
            </h2>
            <div className="mt-2.5 space-y-2.5 text-[11px] leading-6 text-ink-soft/90">
              <p>
                هر «محصول» یک رکورد مستقل با کد IRC است. مشخصات محصول (شکل دارویی، دوز و بسته‌بندی)
                به ماده مؤثره و سازنده متصل می‌شود. این ساختار امکان مقایسه محصولات هم‌ماده و
                همچنین بررسی روند قیمت یک قلم در طول زمان را فراهم می‌کند.
              </p>
              <p>
                برای هر محصول، تاریخچه دوره‌های بازنگری ثبت شده است. هر دوره شامل قیمت قبل، قیمت
                بعد و درصد تغییر است. شاخص‌های تحلیلی مانند میانگین رشد و شاخص قیمت نیز از همین
                داده‌ها محاسبه می‌شوند.
              </p>
              <p>
                در این نسخه، {faNum(DATASET_SIZE)} قلم نمونه به‌صورت قطعی و بازتولیدپذیر ساخته شده‌اند تا تجربه
                جستجو، مقایسه و نمودارها قابل ارزیابی باشد. اعداد کل پایگاه (مانند ۱۲٬۳۱۵ قلم یا
                ۷۲۶ قلم واجد شرایط) برای نمایش ساختار محصول استفاده شده‌اند.
              </p>
            </div>
          </section>

          <section className="surface-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
              <BookOpen className="h-4 w-4 text-brand" />
              واژه‌نامه کوتاه
            </h2>
            <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {[
                ["IRC", "شناسه یک محصول مشخص؛ دقیق‌ترین راه پیدا کردن یک قلم."],
                ["ATC", "طبقه‌بندی بین‌المللی دارو بر اساس اندام هدف و اثر درمانی."],
                ["بازنگری", "دوره ابلاغ قیمت جدید که تاریخ و درصد تغییر دارد."],
                ["اقلام انتقالی", "اقلامی با مهلت و شرایط گذار برای اعمال قیمت جدید."],
                ["قیمت هر واحد", "قیمت بسته تقسیم بر تعداد واحد؛ معیار مقایسه محصولات."],
                ["لیست پیگیری", "فهرست شخصی ذخیره‌شده در مرورگر برای رصد تغییر قیمت."],
              ].map(([term, definition]) => (
                <div key={term} className="rounded-lg border border-line/80 bg-surface-soft p-2.5">
                  <dt className="text-[10px] font-semibold text-ink-soft">{term}</dt>
                  <dd className="mt-0.5 text-[9.5px] leading-5 text-muted">{definition}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold text-ink">
              <Info className="h-4 w-4 text-brand" />
              پرسش‌های متداول
            </h2>
            <div className="mt-2 divide-y divide-line/60">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-2.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] font-medium text-ink-soft">
                    <ChevronLeft className="h-3.5 w-3.5 text-faint transition-transform group-open:-rotate-90" />
                    {item.q}
                  </summary>
                  <p className="mt-1.5 ps-5 text-[10.5px] leading-6 text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="rounded-xl border border-[#f0dfc2] bg-[#fffbf3] p-4">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b7812c]" />
              <div>
                <h2 className="text-[11.5px] font-bold text-[#7c5b26]">سلب مسئولیت</h2>
                <p className="mt-1 text-[9.5px] leading-6 text-[#8f6d34]">
                  این وب‌سایت یک پروژه نمایشی است و هیچ‌گونه خدمت پزشکی، تشخیص یا نسخه ارائه
                  نمی‌دهد. اطلاعات قیمت و دارویی ممکن است ناقص، قدیمی یا نمونه باشد. برای هر
                  تصمیم درمانی یا خرید دارو، به پزشک، داروساز و منابع رسمی مراجعه کنید.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 border-b border-line/70 pb-2 text-[12px] font-bold text-ink">
              در یک نگاه
            </h2>
            <dl className="space-y-2.5 text-[10.5px]">
              <Row label="نام پروژه" value="دارونما" />
              <Row label="نسخه" value="نمایشی ۰.۱" />
              <Row label="اقلام نمونه" value={`${faNum(DATASET_SIZE)} قلم`} />
              <Row label="ظرفیت کل" value={`${faNum(PLATFORM.totalItems)} قلم`} />
              <Row label="آخرین به‌روزرسانی" value={SITE.updatedLabel} />
              <Row label="پوشش" value={SITE.yearRange} />
            </dl>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
              مطالعه بیشتر
            </h2>
            <div className="space-y-1">
              {[
                { label: "سازوکار قیمت‌گذاری دارو", href: "/insights/drug-pricing-mechanism" },
                { label: "بازنگری و اقدامات انتقالی", href: "/insights/revision-and-transition" },
                { label: "راهنمای مقایسه ژنریک", href: "/insights/generic-comparison-guide" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 rounded-lg px-1.5 py-2 text-[10px] text-ink-soft transition-colors hover:bg-surface-soft hover:text-brand"
                >
                  <ChevronLeft className="h-3 w-3 text-faint/50" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          <div className="rounded-xl border border-[#d6e6f7] bg-gradient-to-b from-[#f7fbff] to-white p-4">
            <h2 className="text-[11.5px] font-bold text-ink">برای شروع</h2>
            <p className="mt-1 text-[9.5px] leading-5 text-muted">
              نام یک دارو یا ماده مؤثره را جستجو کنید و قیمت‌ها را مقایسه کنید.
            </p>
            <Link href="/search" className="btn-primary mt-2.5 w-full !justify-center !py-2 !text-[11px]">
              جستجوی دارو
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "blue" | "teal" | "amber";
}) {
  const styles = {
    blue: "bg-[#eaf2fe] text-brand",
    teal: "bg-[#e6f7f3] text-teal",
    amber: "bg-[#fdf3e4] text-[#b9751d]",
  };
  return (
    <div className="surface-card p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</span>
      <h2 className="mt-2.5 text-[11.5px] font-bold text-ink">{title}</h2>
      <p className="mt-1 text-[9.5px] leading-5 text-muted">{text}</p>
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

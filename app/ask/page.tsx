import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Database, FlaskConical, LineChart, ShieldCheck, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AssistantChat } from "@/components/tools/assistant-chat";
import { getAssistantMeta, getAssistantSuggestions } from "@/lib/assistant";
import { faNum } from "@/lib/format";
import { seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
  title: "دستیار هوشمند دارو | پرسش از قیمت و داده‌های دارویی",
  description:
    "پرسش به زبان طبیعی از دیتابیس واقعی قیمت دارو؛ مقایسه محصولات هم‌ماده، ارزان‌ترین گزینه، شرکت‌ها و آمار پایگاه.",
  path: "/ask",
  keywords: ["دستیار دارو", "پرسش قیمت دارو", "چت‌بات دارو", "مقایسه قیمت دارو"],
});

export default function AskPage() {
  const meta = getAssistantMeta();
  const suggestions = getAssistantSuggestions();

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "ابزارها" }, { label: "دستیار هوشمند" }]} />
      <div className="max-w-[760px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-violet" />
          دستیار داده · نسخه بتا
        </p>
        <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
          پرسش از داده‌های دارو
        </h1>
        <p className="mt-1.5 text-[12px] leading-6 text-muted">
          به زبان طبیعی بپرسید؛ دستیار روی {faNum(meta.datasetSize)} محصول جاری و قیمت‌های واقعی
          دیتابیس، محصولات هم‌ماده و آمار پایگاه را مقایسه می‌کند. این ابزار توصیه درمانی نمی‌دهد.
        </p>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <AssistantChat />

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
              چه سؤال‌هایی می‌توانم بپرسم؟
            </h2>
            <div className="space-y-1.5">
              {suggestions.map((suggestion) => (
                <p
                  key={suggestion}
                  className="rounded-lg border border-line/80 bg-surface-soft px-2.5 py-1.5 text-[9.5px] leading-5 text-muted"
                >
                  «{suggestion}»
                </p>
              ))}
            </div>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2 text-[12px] font-bold text-ink">قابلیت‌ها</h2>
            <ul className="space-y-2 text-[9.5px] leading-5 text-muted">
              <li className="flex items-start gap-2">
                <LineChart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                مقایسه قیمت و رتبه‌بندی ارزان‌ترین گزینه‌ها
              </li>
              <li className="flex items-start gap-2">
                <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                تحلیل محصولات هم‌ماده و تفاوت قیمت هر واحد
              </li>
              <li className="flex items-start gap-2">
                <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                پاسخ از داده‌های همین پایگاه، بدون جستجوی وب
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                پرهیز از توصیه درمانی و اشاره به منبع داده
              </li>
            </ul>
          </section>

          <div className="rounded-xl border border-[#dcd7f6] bg-[#f8f6ff] p-3.5">
            <p className="text-[9px] leading-5 text-[#63548f]">
              این دستیار با موتور قاعده‌محور مستقیماً روی SQLite کار می‌کند و به مدل زبانی بیرونی
              متصل نیست. پاسخ‌ها از همان دیتابیس واقعی ساخته می‌شوند.
            </p>
            <Link
              href="/insights"
              className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-medium text-[#5c48b7] hover:text-[#483596]"
            >
              درباره داده‌ها و روش‌شناسی
              <ChevronLeft className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

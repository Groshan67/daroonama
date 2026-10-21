import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Calculator, ChevronLeft, Clock, Info } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ARTICLES, getArticle } from "@/lib/data/articles";
import { faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "مقاله پیدا نشد" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: { title: article.title, description: article.excerpt, type: "article" },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "توضیح سیستم و گزارش‌ها", href: "/insights" },
          { label: article.title },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_270px]">
        <article className="min-w-0">
          <header className="surface-card relative overflow-hidden p-5 sm:p-6">
            <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#5b93e8] via-[#2f6fce] to-[#159a89]" />
            <span className="rounded-full bg-[#eef5fe] px-2.5 py-1 text-[9px] font-medium text-brand-dark">
              {article.category}
            </span>
            <h1 className="mt-3 text-[24px] font-extrabold leading-[1.7] tracking-tight text-ink sm:text-[28px]">
              {article.title}
            </h1>
            <p className="mt-2 max-w-[680px] text-[12px] leading-6 text-muted">{article.excerpt}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line/60 pt-3 text-[9px] text-faint">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {faNum(article.readingMinutes)} دقیقه مطالعه
              </span>
              <span className="h-1 w-1 rounded-full bg-line-strong" />
              <span>به‌روزرسانی {formatJalali(article.updatedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-line-strong" />
              <span>تیم داده دارونما</span>
            </div>
          </header>

          <div className="surface-card mt-4 p-5 sm:p-7">
            {article.sections.map((section, index) => (
              <section
                key={section.heading}
                id={`section-${index + 1}`}
                className="scroll-mt-24 [&+&]:mt-7"
              >
                <h2 className="mb-2.5 flex items-center gap-2 text-[15px] font-extrabold leading-7 text-ink">
                  <span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#eef5fe] text-[9px] font-bold text-brand">
                    {faNum(index + 1)}
                  </span>
                  {section.heading}
                </h2>
                <div className="space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="text-[12px] leading-[2.15] text-ink-soft/90">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="mt-7 flex items-start gap-2 rounded-xl border border-[#d8e7f8] bg-[#f7fbff] p-3.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
              <p className="text-[9.5px] leading-5 text-muted">
                این مطلب جنبه آموزشی و توضیح روش‌شناسی دارد. قیمت‌ها و آمار این نسخه نمایشی‌اند و
                نباید مبنای تصمیم خرید یا درمان قرار گیرند. برای اطلاعات رسمی به منابع ابلاغی
                مراجعه کنید.
              </p>
            </div>
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-[84px] lg:h-fit">
          <section className="surface-card p-4">
            <h2 className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-ink">
              <BookOpen className="h-3.5 w-3.5 text-brand" />
              در این مقاله
            </h2>
            <nav className="space-y-0.5" aria-label="فهرست بخش‌ها">
              {article.sections.map((section, index) => (
                <a
                  key={section.heading}
                  href={`#section-${index + 1}`}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[10px] leading-5 text-muted transition-colors hover:bg-surface-soft hover:text-brand"
                >
                  <span className="num mt-0.5 text-[8px] text-faint">{faNum(index + 1)}</span>
                  {section.heading}
                </a>
              ))}
            </nav>
          </section>

          <section className="rounded-xl border border-[#d6e6f7] bg-gradient-to-b from-[#f7fbff] to-white p-4">
            <h2 className="text-[11.5px] font-bold text-ink">محاسبه هزینه درمان</h2>
            <p className="mt-1 text-[9.5px] leading-5 text-muted">
              قیمت بسته و مصرف ماهانه را وارد کنید و هزینه سال‌های آینده را برآورد کنید.
            </p>
            <Link href="/simulation" className="btn-primary mt-2.5 w-full !justify-center !py-2 !text-[11px]">
              <Calculator className="h-3.5 w-3.5" />
              شبیه‌سازی هزینه
            </Link>
          </section>

          <section className="surface-card p-4">
            <h2 className="mb-2 text-[11.5px] font-bold text-ink">مقالات مرتبط</h2>
            <div className="space-y-1">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/insights/${item.slug}`}
                  className="group flex items-start gap-1.5 rounded-lg px-1.5 py-2 text-[10px] leading-5 text-muted transition-colors hover:bg-surface-soft hover:text-brand"
                >
                  <ChevronLeft className="mt-1 h-3 w-3 shrink-0 text-faint/50" />
                  <span className="group-hover:underline group-hover:decoration-brand/30 group-hover:underline-offset-4">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/insights" className="mt-2 inline-flex items-center gap-1 text-[9.5px] text-brand hover:text-brand-dark">
              همه گزارش‌ها
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

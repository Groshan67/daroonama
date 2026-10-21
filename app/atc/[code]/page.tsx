import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, FileText, Layers, Pill } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  getAtcChildren,
  getAtcNode,
  getAtcPath,
  getAtcProductCount,
  getAtcProducts,
} from "@/lib/atc";
import { faNum, faPrice, formatDose, productTypeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

const LEVEL_LABELS = [
  "گروه اصلی",
  "زیرگروه درمانی",
  "زیرگروه فارماکولوژیک",
  "زیرگروه شیمیایی/درمانی",
  "ماده مؤثره",
];

type PageProps = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const node = getAtcNode(code.toUpperCase());
  if (!node) return { title: "کد ATC پیدا نشد" };
  return {
    title: `${node.code} | ${node.name_fa || node.name_en}`,
    description: `سطح ${node.level} طبقه‌بندی ATC: ${node.name_fa || node.name_en}`,
  };
}

export default async function AtcNodePage({ params }: PageProps) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const node = getAtcNode(code);
  if (!node) notFound();

  const path = getAtcPath(code);
  const children = getAtcChildren(code);
  const productCount = getAtcProductCount(code);
  const products = getAtcProducts(code, 50);

  return (
    <div className="page-container py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "سلسله‌مراتب ATC", href: "/atc" },
          { label: node.name_fa || node.name_en || node.code },
        ]}
      />

      <section className="surface-card relative overflow-hidden p-5 sm:p-6">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-[#a58cf0] via-[#8567df] to-[#6f51cc]" />
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f0ecfd] text-[16px] font-extrabold text-violet">
            {node.code}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-[#f0ecfd] px-2 py-0.5 text-[9px] font-medium text-[#6144c2]">
                سطح {faNum(node.level)} · {LEVEL_LABELS[node.level - 1]}
              </span>
              {node.ddd && node.ddd !== "NA" && (
                <span className="num rounded-full border border-line bg-white px-2 py-0.5 text-[8.5px] text-muted">
                  DDD {node.ddd}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-[24px] font-extrabold leading-8 text-ink sm:text-[29px]">
              {node.name_fa || node.name_en}
            </h1>
            <p dir="ltr" className="mt-1 text-start text-[10.5px] text-faint">
              {node.name_en}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-lg border border-line bg-white px-2.5 py-2 text-center">
              <p className="text-[8px] text-faint">زیرگروه</p>
              <p className="num text-[12px] font-bold text-ink-soft">{faNum(children.length)}</p>
            </div>
            <div className="rounded-lg border border-line bg-white px-2.5 py-2 text-center">
              <p className="text-[8px] text-faint">محصول</p>
              <p className="num text-[12px] font-bold text-ink-soft">{faNum(productCount)}</p>
            </div>
          </div>
        </div>

        {path.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-line/60 pt-3 text-[8.5px] text-faint">
            {path.map((item, index) => (
              <span key={item.code} className="inline-flex items-center gap-1">
                {index > 0 && <ChevronLeft className="h-2.5 w-2.5 text-faint/50" />}
                <Link
                  href={`/atc/${item.code}`}
                  className={`rounded px-1 py-0.5 transition hover:bg-surface-tint hover:text-brand ${
                    item.code === node.code ? "font-semibold text-ink-soft" : ""
                  }`}
                  title={item.name_en ?? item.code}
                >
                  <span className="num">{item.code}</span> · {item.name_fa || item.name_en}
                </Link>
              </span>
            ))}
          </div>
        )}
      </section>

      {children.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.06em] text-faint">
            <Layers className="h-3.5 w-3.5 text-violet" />
            زیرگروه‌های سطح {faNum(node.level + 1)}
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link
                key={child.code}
                href={`/atc/${child.code}`}
                className="surface-card group flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:border-[#d8cdf7] hover:shadow-lift"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f6f3fe] text-[9px] font-bold text-violet">
                  {child.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10.5px] font-semibold text-ink group-hover:text-[#6144c2]">
                    {child.name_fa || child.name_en}
                  </span>
                  <span className="mt-0.5 block text-[8px] text-faint">
                    {faNum(child.children_count)} زیرگروه · {faNum(child.product_count)} محصول
                  </span>
                </span>
                <ChevronLeft className="h-3 w-3 text-faint/50 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="surface-card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
              <Pill className="h-3.5 w-3.5 text-brand" />
              محصولات این شاخه
            </h2>
            <p className="mt-0.5 text-[9.5px] text-faint">
              محصولاتی که کد ATC آن‌ها با این کد یا زیرشاخه‌هایش شروع می‌شود
            </p>
          </div>
          <Link href="/imported" className="inline-flex items-center gap-1 text-[9.5px] text-brand hover:text-brand-dark">
            همه داده‌ها
            <ArrowLeft className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-[10px]">
            <thead>
              <tr className="border-b border-line/60 text-[8.5px] text-faint">
                <th className="px-4 py-2 text-start font-medium">محصول</th>
                <th className="px-3 py-2 text-start font-medium">شرکت</th>
                <th className="px-3 py-2 text-start font-medium">نوع</th>
                <th className="px-3 py-2 text-start font-medium">قیمت</th>
                <th className="px-4 py-2 text-start font-medium">IRC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {products.map((product) => (
                <tr key={product.irc} className="transition-colors hover:bg-surface-soft">
                  <td className="px-4 py-2">
                    <Link href={`/imported/${product.irc}`} className="font-medium text-ink hover:text-brand">
                      {product.display_name}
                    </Link>
                    <span className="mt-0.5 block text-[8px] text-faint">
                      {[formatDose(product.dose), product.dosage_form_fa].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">{product.brand_owner_name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[8px] ring-1 ${
                        String(product.product_type) === "28"
                          ? "bg-[#f0ecfd] text-[#6144c2] ring-[#ddd5f8]"
                          : "bg-[#eef5fe] text-[#2f5f9f] ring-[#d5e4f5]"
                      }`}
                    >
                      {productTypeLabel(product.product_type)}
                    </span>
                  </td>
                  <td className="num px-3 py-2 font-medium text-ink-soft">
                    {product.price_toman !== null ? faNum(product.price_toman) : "—"}
                  </td>
                  <td dir="ltr" className="px-4 py-2 font-mono text-[8px] text-faint">
                    {product.irc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <p className="py-10 text-center text-[10px] text-faint">محصولی در این شاخه ثبت نشده است.</p>
          )}
        </div>
      </section>

      <div className="mt-4 flex items-start gap-1.5 text-[8.5px] leading-5 text-faint">
        <FileText className="mt-0.5 h-3 w-3 shrink-0" />
        سطح ۱ گروه اصلی، سطح ۲ زیرگروه درمانی، سطح ۳ زیرگروه فارماکولوژیک، سطح ۴ زیرگروه
        شیمیایی/درمانی و سطح ۵ ماده مؤثره است. DDD صرفاً برای کدهای سطح ۵ ثبت می‌شود.
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogProduct } from "@/lib/catalog/types";
import { faNum, formatDose, productTypeLabel } from "@/lib/format";

export function ProductTable({
  products,
  showGeneric = true,
}: {
  products: CatalogProduct[];
  showGeneric?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] sm:min-w-[760px]">
        <thead>
          <tr className="border-b border-line/60 text-[8.5px] text-faint">
            <th className="px-3 py-2 text-start font-medium sm:px-4">نام محصول</th>
            <th className="px-2 py-2 text-start font-medium">دوز / شکل</th>
            <th className="px-2 py-2 text-start font-medium">صاحب برند</th>
            <th className="px-2 py-2 text-start font-medium">تولیدکننده</th>
            {showGeneric && <th className="px-2 py-2 text-start font-medium">GenericCode</th>}
            <th className="px-2 py-2 text-start font-medium">قیمت بسته</th>
            <th className="px-2 py-2 text-start font-medium">قیمت واحد</th>
            <th className="px-3 py-2 text-start font-medium sm:px-4">نوع</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">
          {products.map((product) => {
            const active = selected === product.irc;
            return (
              <tr
                key={product.irc}
                role="link"
                tabIndex={0}
                onClick={() => {
                  setSelected(product.irc);
                  router.push(`/drug/${product.canonicalIrc}`);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/drug/${product.canonicalIrc}`);
                  }
                }}
                className={`cursor-pointer transition-colors ${
                  active ? "bg-[#eaf3fe]" : "hover:bg-[#f5f9ff]"
                }`}
              >
                <td className="px-3 py-2.5 sm:px-4">
                  <span className="block font-semibold text-ink">{product.displayName}</span>
                  <span dir="ltr" className="mt-0.5 block font-mono text-[8px] text-faint">{product.irc}</span>
                </td>
                <td className="px-2 py-2.5 text-muted">
                  {[formatDose(product.dose), product.dosageFormFa, product.packageCount ? `بسته ${faNum(product.packageCount)}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="px-2 py-2.5 text-muted">{product.brandOwnerName ?? "—"}</td>
                <td className="px-2 py-2.5 text-muted">{product.producerName ?? "—"}</td>
                {showGeneric && (
                  <td dir="ltr" className="px-2 py-2.5 font-mono text-[8.5px] text-faint">
                    {product.genericCode ?? "—"}
                  </td>
                )}
                <td className="num px-2 py-2.5 font-semibold text-ink">
                  {product.priceToman !== null ? faNum(product.priceToman) : "—"}
                </td>
                <td className="num px-2 py-2.5 text-ink-soft">
                  {product.unitPriceToman !== null ? faNum(product.unitPriceToman) : "—"}
                </td>
                <td className="px-3 py-2.5 sm:px-4">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[8px] ring-1 ${
                      String(product.productType) === "28"
                        ? "bg-[#f0ecfd] text-[#6144c2] ring-[#ddd5f8]"
                        : "bg-[#eef5fe] text-[#2f5f9f] ring-[#d5e4f5]"
                    }`}
                  >
                    {productTypeLabel(product.productType)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && <p className="py-10 text-center text-[10px] text-faint">محصولی ثبت نشده است.</p>}
    </div>
  );
}

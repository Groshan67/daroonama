"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { faNum, faPrice } from "@/lib/format";

export type CategoryIngredientRow = {
  key: string;
  name: string;
  nameEn: string | null;
  count: number;
  brands: number;
  producers: number;
  minPrice: number | null;
  maxPrice: number | null;
  minUnit: number | null;
  maxUnit: number | null;
};

export function CategoryIngredientTable({ rows, categoryCode }: { rows: CategoryIngredientRow[]; categoryCode: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px] sm:min-w-[700px]">
        <thead>
          <tr className="border-b border-line/60 text-[8.5px] text-faint">
            <th className="px-3 py-2 text-start font-medium sm:px-4">نام ماده مؤثره</th>
            <th className="px-2 py-2 text-start font-medium">تعداد محصول</th>
            <th className="px-2 py-2 text-start font-medium">صاحبان برند</th>
            <th className="px-2 py-2 text-start font-medium">تولیدکنندگان</th>
            <th className="px-2 py-2 text-start font-medium">بازه قیمت بسته</th>
            <th className="px-3 py-2 text-start font-medium sm:px-4">بازه قیمت واحد</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line/50">
          {rows.map((row) => {
            const active = selected === row.key;
            return (
              <tr
                key={row.key}
                role="link"
                tabIndex={0}
                onClick={() => {
                  setSelected(row.key);
                  router.push(`/ingredient/${encodeURIComponent(row.key)}?category=${categoryCode}`);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/ingredient/${encodeURIComponent(row.key)}?category=${categoryCode}`);
                  }
                }}
                className={`cursor-pointer transition-colors ${active ? "bg-[#eaf3fe]" : "hover:bg-[#f5f9ff]"}`}
              >
                <td className="px-3 py-2.5 sm:px-4">
                  <span className="block font-semibold text-ink">{row.name}</span>
                  <span dir="ltr" className="mt-0.5 block text-[8px] text-faint">{row.nameEn ?? row.key}</span>
                </td>
                <td className="num px-2 py-2.5 text-ink-soft">{faNum(row.count)}</td>
                <td className="num px-2 py-2.5 text-muted">{faNum(row.brands)}</td>
                <td className="num px-2 py-2.5 text-muted">{faNum(row.producers)}</td>
                <td className="num px-2 py-2.5 font-semibold text-ink">
                  {row.minPrice !== null ? `${faPrice(row.minPrice)} تا ${faPrice(row.maxPrice ?? row.minPrice)}` : "—"}
                </td>
                <td className="num px-3 py-2.5 text-ink-soft sm:px-4">
                  {row.minUnit !== null ? `${faPrice(row.minUnit)} تا ${faPrice(row.maxUnit ?? row.minUnit)}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-10 text-center text-[10px] text-faint">موردی ثبت نشده است.</p>}
    </div>
  );
}

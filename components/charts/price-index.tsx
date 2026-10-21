"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faDigits, faNum } from "@/lib/format";

export function PriceIndexChart({ data }: { data: { year: number; index: number }[] }) {
  const latest = data[data.length - 1];
  const first = data[0];
  const growth = first?.index ? (latest.index / first.index - 1) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] text-muted">شاخص میانگین قیمت (۱۳۹۵ = ۱۰۰)</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[24px] font-extrabold text-ink">{faNum(latest?.index ?? 0)}</span>
            <span className="text-[9px] text-faint">در سال {faDigits(latest?.year ?? 0)}</span>
          </div>
        </div>
        <span className="num rounded-md bg-[#fdf1f3] px-2 py-1 text-[9px] font-medium text-[#b84d64]">
          رشد {faNum(Math.round(growth))}٪ از ابتدای دوره
        </span>
      </div>

      <div className="h-[210px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="index-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7457d4" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#7457d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#ece8fa" />
            <XAxis
              dataKey="year"
              tickFormatter={(value: number) => faDigits(value)}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9a91b8", fontSize: 8.5, fontFamily: "Vazirmatn Variable" }}
              height={24}
            />
            <YAxis
              orientation="right"
              tickFormatter={(value: number) => faNum(value)}
              axisLine={false}
              tickLine={false}
              width={44}
              tick={{ fill: "#9a91b8", fontSize: 8, fontFamily: "Vazirmatn Variable" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as { year: number; index: number };
                return (
                  <div dir="rtl" className="rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-lg">
                    <p className="text-[8.5px] text-faint">سال {faDigits(point.year)}</p>
                    <p className="num text-[11px] font-bold text-ink">شاخص {faNum(point.index)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="index"
              stroke="#7457d4"
              strokeWidth={2}
              fill="url(#index-area)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faCompact, faNum, faPercent } from "@/lib/format";
import { formatJalali, jalaliYearLabel } from "@/lib/jalali";
import type { PricePoint } from "@/lib/data/types";

type Point = PricePoint & { label: string };

const RANGES = [
  { key: "10y", label: "۱۰ سال", months: 120 },
  { key: "5y", label: "۵ سال", months: 60 },
  { key: "3y", label: "۳ سال", months: 36 },
] as const;

export function PriceTrendChart({ history }: { history: PricePoint[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("10y");

  const activeRange = RANGES.find((item) => item.key === range)!;
  const data: Point[] = useMemo(
    () =>
      history.slice(-(activeRange.months + 1)).map((point) => ({
        ...point,
        label: formatJalali(point.date),
      })),
    [history, activeRange.months],
  );

  const first = data[0]?.price ?? 0;
  const last = data[data.length - 1]?.price ?? 0;
  const totalChange = first ? ((last - first) / first) * 100 : 0;
  const years = Math.max(1, data.length / 12);
  const annual = first ? (Math.pow(last / first, 1 / years) - 1) * 100 : 0;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="text-[11px] text-muted">
              رشد کل دوره{" "}
              <strong className="num ms-0.5 font-semibold text-[#c2546b]">
                {faPercent(totalChange)}
              </strong>
            </p>
            <p className="text-[11px] text-muted">
              میانگین سالانه{" "}
              <strong className="num ms-0.5 font-semibold text-ink-soft">
                {faPercent(annual)}
              </strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-line bg-surface-soft p-0.5">
          {RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
              className={`rounded-md px-2.5 py-1 text-[10px] transition-colors ${
                range === item.key
                  ? "bg-white font-semibold text-brand-dark shadow-sm"
                  : "text-faint hover:text-ink-soft"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 h-[268px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="price-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4b86dd" stopOpacity={0.26} />
                <stop offset="70%" stopColor="#4b86dd" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#4b86dd" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8eff8" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => jalaliYearLabel(value)}
              axisLine={false}
              tickLine={false}
              interval={Math.max(1, Math.floor(data.length / 7))}
              tick={{ fill: "#8b9db0", fontSize: 9.5, fontFamily: "Vazirmatn Variable" }}
              height={26}
            />
            <YAxis
              orientation="right"
              tickFormatter={(value: number) => faCompact(value)}
              axisLine={false}
              tickLine={false}
              width={64}
              tick={{ fill: "#8b9db0", fontSize: 9, fontFamily: "Vazirmatn Variable" }}
            />
            <Tooltip
              content={<PriceTooltip />}
              cursor={{ stroke: "#b8d3f2", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#2f6fce"
              strokeWidth={2.2}
              fill="url(#price-area)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff", fill: "#2f6fce" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[9px] text-faint/80" dir="rtl">
        قیمت‌ها به تومان · منبع: بازنگری‌های رسمی ثبت‌شده در پایگاه داده
      </p>
    </div>
  );
}

function PriceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div
      dir="rtl"
      className="rounded-lg border border-line bg-white/95 px-3 py-2 shadow-[0_10px_30px_-12px_rgba(15,42,78,0.35)] backdrop-blur"
    >
      <p className="text-[9.5px] text-faint">{point.label}</p>
      <p className="num mt-0.5 text-[12.5px] font-bold text-ink">{faNum(point.price)} تومان</p>
    </div>
  );
}

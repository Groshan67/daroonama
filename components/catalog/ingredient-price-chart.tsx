"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faCompact, faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

const COLORS = ["#2f6fce", "#159a89", "#c47a20", "#b84d63", "#6749c6", "#62798f"];

type Series = {
  irc: string;
  name: string;
  points: { observedAt: string; packagePriceToman: number }[];
};

export function IngredientPriceChart({ series }: { series: Series[] }) {
  if (series.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-line bg-surface-soft/30 text-center">
        <div>
          <p className="text-[11px] font-semibold text-ink-soft">هنوز تاریخچه قیمت کافی وجود ندارد</p>
          <p className="mt-1 text-[9px] text-faint">با ورود فایل‌های هفتگی، نمودار ساخته می‌شود.</p>
        </div>
      </div>
    );
  }

  const byDate = new Map<string, Record<string, string | number>>();
  for (const item of series) {
    for (const point of item.points) {
      const row = byDate.get(point.observedAt) ?? { date: point.observedAt.slice(0, 10) };
      row[item.irc] = point.packagePriceToman;
      byDate.set(point.observedAt, row);
    }
  }
  const data = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => row);

  return (
    <div>
      <div className="h-[250px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8eff8" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatJalali(value, { withYear: false })}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b9db0", fontSize: 9, fontFamily: "Vazirmatn Variable" }}
              height={26}
            />
            <YAxis
              orientation="right"
              tickFormatter={(value: number) => faCompact(value)}
              axisLine={false}
              tickLine={false}
              width={64}
              tick={{ fill: "#8b9db0", fontSize: 8.5, fontFamily: "Vazirmatn Variable" }}
            />
            <Tooltip content={<ChartTooltip series={series} />} />
            <Legend
              formatter={(value: string) => (
                <span dir="rtl" className="text-[8.5px] text-faint">
                  {series.find((item) => item.irc === value)?.name ?? value}
                </span>
              )}
            />
            {series.map((item, index) => (
              <Line
                key={item.irc}
                type="monotone"
                dataKey={item.irc}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3.5, strokeWidth: 1.5, fill: "#fff" }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[8.5px] text-faint">
        قیمت بسته (ConsumerPrice × PackageCount) به تومان · هر خط یک محصول
      </p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; payload: Record<string, string | number> }[];
  series: Series[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-lg border border-line bg-[#eef1f4]/95 px-3 py-2 text-[10px] shadow-md backdrop-blur">
      <p className="mb-1 text-[8.5px] text-faint">{formatJalali(String(payload[0].payload.date))}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-3">
          <span className="max-w-[180px] truncate text-ink-soft">
            {series.find((row) => row.irc === item.dataKey)?.name ?? item.dataKey}
          </span>
          <span className="num font-semibold text-ink">{faNum(item.value)} ت</span>
        </div>
      ))}
    </div>
  );
}

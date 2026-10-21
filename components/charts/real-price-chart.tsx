"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faCompact, faNum } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

type Point = {
  date: string;
  label: string;
  price: number;
  irc: string;
};

export function RealPriceChart({
  history,
}: {
  history: { observedAt: string; priceToman: number; irc: string }[];
}) {
  const data: Point[] = history.map((point) => ({
    date: point.observedAt.slice(0, 10),
    label: formatJalali(point.observedAt),
    price: point.priceToman,
    irc: point.irc,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-soft/40 text-center">
        <p className="text-[12px] font-semibold text-ink-soft">قیمتی برای این محصول ثبت نشده است</p>
        <p className="mt-1 max-w-sm text-[10px] leading-5 text-faint">
          فایل منبع برای این محصول قیمت مصرف‌کننده نداشته است؛ با ورود فایل بعدی، در صورت وجود قیمت،
          نمودار ساخته می‌شود.
        </p>
      </div>
    );
  }

  const first = data[0].price;
  const last = data[data.length - 1].price;
  const change = first ? ((last - first) / first) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
        <span>
          تعداد مشاهده: <strong className="num font-semibold text-ink-soft">{faNum(data.length)}</strong>
        </span>
        <span>
          تغییر کل دوره:{" "}
          <strong className={`num font-semibold ${change >= 0 ? "text-[#b84d64]" : "text-[#1b8663]"}`}>
            {change >= 0 ? "+" : ""}
            {faNum(Number(change.toFixed(1)))}٪
          </strong>
        </span>
      </div>
      <div className="h-[250px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8eff8" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatJalali(value, { withYear: false })}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8b9db0", fontSize: 9.5, fontFamily: "Vazirmatn Variable" }}
              height={26}
            />
            <YAxis
              orientation="right"
              tickFormatter={(value: number) => faCompact(value)}
              axisLine={false}
              tickLine={false}
              width={68}
              tick={{ fill: "#8b9db0", fontSize: 9, fontFamily: "Vazirmatn Variable" }}
            />
            <Tooltip content={<PriceTooltip />} cursor={{ stroke: "#b8d3f2", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2f6fce"
              strokeWidth={2.2}
              dot={{ r: 4, fill: "#2f6fce", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[9px] text-faint/80" dir="rtl">
        قیمت‌ها به تومان · هر نقطه یک مشاهده واقعی در فایل هفتگی است
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
      <p dir="ltr" className="mt-0.5 font-mono text-[8px] text-faint">{point.irc}</p>
    </div>
  );
}

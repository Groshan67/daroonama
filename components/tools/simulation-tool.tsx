"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, Info, Loader2, RotateCcw, Search, TrendingUp, Wallet, X } from "lucide-react";
import { faCompact, faDigits, faNum, faPrice } from "@/lib/format";
import type { SimulationDrug } from "@/lib/catalog/simulation";

const PRESETS = [
  { label: "خوش‌بینانه", rate: 20 },
  { label: "پایه", rate: 35 },
  { label: "بدبینانه", rate: 50 },
];

export function SimulationTool({ initial }: { initial: SimulationDrug | null }) {
  const [drug, setDrug] = useState<SimulationDrug | null>(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SimulationDrug[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [packsPerMonth, setPacksPerMonth] = useState(1);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(35);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/simulation/products?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { products?: SimulationDrug[] };
        setResults(data.products ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const model = useMemo(() => {
    if (!drug) return null;
    const monthlyNow = drug.price * packsPerMonth;
    const yearlyNow = monthlyNow * 12;
    const rows = Array.from({ length: years + 1 }, (_, index) => {
      const factor = Math.pow(1 + rate / 100, index);
      return {
        year: 1405 + index,
        packPrice: Math.round(drug.price * factor),
        annual: Math.round(yearlyNow * factor),
        monthly: Math.round(monthlyNow * factor),
      };
    });
    const final = rows[rows.length - 1];
    const total = rows.slice(1).reduce((sum, row) => sum + row.annual, 0);
    return { rows, monthlyNow, yearlyNow, final, total };
  }, [drug, packsPerMonth, years, rate]);

  if (!drug || !model) {
    return (
      <div className="surface-card px-5 py-14 text-center">
        <p className="text-[13px] font-bold text-ink">دارویی با قیمت بسته معتبر پیدا نشد</p>
        <p className="mt-1 text-[10px] text-faint">ابتدا فایل قیمت را وارد کنید.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="surface-card h-fit p-4 lg:sticky lg:top-[84px]">
        <div className="mb-3 flex items-center gap-2 border-b border-line/70 pb-2.5">
          <Calculator className="h-4 w-4 text-brand" />
          <h2 className="text-[12px] font-bold text-ink">پارامترهای شبیه‌سازی</h2>
        </div>

        <div ref={wrapperRef} className="relative z-30">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-medium text-muted">جستجو و انتخاب دارو</span>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="نام دارو، ماده مؤثره یا IRC…"
                className="h-10 w-full rounded-lg border border-line bg-white ps-9 pe-9 text-[11px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                  aria-label="پاک کردن"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[8px] text-faint">جستجو</span>
              )}
            </div>
          </label>

          {open && (
            <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-pop">
              {searching ? (
                <div className="flex items-center justify-center gap-2 py-5 text-[10px] text-faint">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  در حال جستجو…
                </div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setDrug(item);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-start transition hover:bg-surface-soft"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[10.5px] font-semibold text-ink">{item.name}</span>
                      <span className="mt-0.5 block truncate text-[8.5px] text-faint">
                        {item.ingredientName} · {item.companyName}
                      </span>
                    </span>
                    <span className="num shrink-0 text-[9px] text-ink-soft">{faPrice(item.price)}</span>
                  </button>
                ))
              ) : (
                <p className="px-3 py-5 text-center text-[10px] text-faint">دارویی پیدا نشد.</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-2.5 rounded-lg border border-line/80 bg-surface-soft px-2.5 py-2 text-[9.5px] leading-5 text-faint">
          <span className="block font-medium text-ink-soft">
            {drug.name} · {drug.pack}
          </span>
          {drug.companyName} · {drug.categoryName}
          <span className="mt-0.5 block">
            قیمت بسته: <span className="num font-semibold text-ink-soft">{faPrice(drug.price)}</span>
          </span>
          <span className="block">
            قیمت واحد:{" "}
            <span className="num font-semibold text-ink-soft">
              {faPrice(Math.round(drug.price / drug.unitsPerPack))}
            </span>
          </span>
        </div>

        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted">
            <span>تعداد بسته در ماه</span>
            <span className="num font-semibold text-brand">{faNum(packsPerMonth)}</span>
          </span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={packsPerMonth}
            onChange={(event) => setPacksPerMonth(Number(event.target.value))}
            className="w-full accent-[#2f6fce]"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted">
            <span>افق پیش‌بینی</span>
            <span className="num font-semibold text-brand">{faNum(years)} سال</span>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
            className="w-full accent-[#2f6fce]"
          />
        </label>

        <label className="mt-3 block">
          <span className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-muted">
            <span>نرخ رشد سالانه قیمت</span>
            <span className="num font-semibold text-brand">{faNum(rate)}٪</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="w-full accent-[#2f6fce]"
          />
        </label>

        <div className="mt-2 grid grid-cols-3 gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setRate(preset.rate)}
              className={`rounded-md border py-1.5 text-[9px] transition ${
                rate === preset.rate
                  ? "border-[#b7d3f3] bg-[#eef5fe] font-semibold text-brand-dark"
                  : "border-line bg-white text-muted hover:border-[#c8dcf2] hover:text-brand"
              }`}
            >
              {preset.label}
              <span className="num mt-0.5 block text-[8px] text-faint">{faNum(preset.rate)}٪</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setPacksPerMonth(1);
            setYears(5);
            setRate(35);
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-white py-2 text-[10px] text-muted transition hover:border-[#c8dcf2] hover:text-brand"
        >
          <RotateCcw className="h-3 w-3" />
          بازنشانی به مقادیر پیش‌فرض
        </button>

        <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-[#f0e2c8] bg-[#fffbf3] px-2.5 py-2 text-[8.5px] leading-4 text-[#8f6d34]">
          <Info className="mt-0.5 h-2.5 w-2.5 shrink-0" />
          این ابزار یک برآورد ساده بر اساس نرخ رشد فرضی است و پیش‌بینی قطعی قیمت نیست.
        </div>
      </aside>

      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <SimStat label="هزینه ماهانه امروز" value={faPrice(model.monthlyNow)} />
          <SimStat label="هزینه سالانه امروز" value={faPrice(model.yearlyNow)} />
          <SimStat label={`هزینه سالانه در ${faDigits(1405 + years)}`} value={faPrice(model.final.annual)} tone="brand" />
          <SimStat label="جمع هزینه در افق" value={faPrice(model.total)} />
        </div>

        <section className="surface-card p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[13px] font-bold text-ink">روند هزینه سالانه</h2>
              <p className="mt-0.5 text-[10px] text-faint">
                {drug.name} · {faNum(packsPerMonth)} بسته در ماه · رشد {faNum(rate)}٪ سالانه
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef8f4] px-2 py-1 text-[9px] text-[#1b8663]">
              <TrendingUp className="h-3 w-3" />
              ضریب رشد {faNum(Math.round(Math.pow(1 + rate / 100, years) * 100) / 100)}×
            </span>
          </div>

          <div className="h-[280px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.rows} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="sim-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#159a89" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#159a89" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e8eff8" />
                <XAxis
                  dataKey="year"
                  tickFormatter={(value: number) => faDigits(value)}
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
                <Tooltip content={<SimTooltip />} />
                <Area
                  type="monotone"
                  dataKey="annual"
                  stroke="#159a89"
                  strokeWidth={2.1}
                  fill="url(#sim-area)"
                  dot={{ r: 2.5, fill: "#159a89", strokeWidth: 0 }}
                  activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2, fill: "#159a89" }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-center text-[9px] text-faint">هزینه سالانه به تومان · سال‌های شمسی</p>
        </section>

        <section className="surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
            <Wallet className="h-3.5 w-3.5 text-brand" />
            <h2 className="text-[12px] font-bold text-ink">جدول سال‌به‌سال</h2>
            <span className="ms-auto text-[9px] text-faint">
              {faNum(years)} سال آینده + سال جاری
            </span>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-[10.5px] sm:min-w-[400px]">
              <thead className="sticky top-0 bg-white text-[9px] text-faint">
                <tr className="border-b border-line/60">
                  <th className="px-3 py-2 text-start font-medium sm:px-4">سال</th>
                  <th className="px-2 py-2 text-start font-medium sm:px-3">قیمت بسته</th>
                  <th className="hidden px-3 py-2 text-start font-medium sm:table-cell">هزینه ماهانه</th>
                  <th className="px-3 py-2 text-start font-medium sm:px-4">هزینه سالانه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {model.rows.map((row) => (
                  <tr key={row.year} className={row.year === 1405 ? "bg-[#f8fbff]" : undefined}>
                    <td className="num px-3 py-2 text-ink-soft sm:px-4">
                      {faDigits(row.year)}
                      {row.year === 1405 && (
                        <span className="ms-1.5 rounded bg-[#eaf2fe] px-1 py-0.5 text-[7.5px] text-brand">جاری</span>
                      )}
                    </td>
                    <td className="num px-2 py-2 text-muted sm:px-3">{faNum(row.packPrice)}</td>
                    <td className="num hidden px-3 py-2 text-muted sm:table-cell">{faNum(row.monthly)}</td>
                    <td className="num px-3 py-2 font-semibold text-ink sm:px-4">{faNum(row.annual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SimStat({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className="surface-card p-3">
      <p className="text-[8.5px] leading-4 text-faint">{label}</p>
      <p className={`num mt-1 text-[12.5px] font-extrabold leading-5 ${tone === "brand" ? "text-brand-dark" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

function SimTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { year: number; annual: number; monthly: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div dir="rtl" className="rounded-lg border border-line bg-white/95 px-3 py-2 shadow-lg">
      <p className="text-[9px] text-faint">سال {faDigits(point.year)}</p>
      <p className="num mt-0.5 text-[11px] font-bold text-ink">{faPrice(point.annual)}</p>
      <p className="num text-[9px] text-faint">ماهانه {faPrice(point.monthly)}</p>
    </div>
  );
}

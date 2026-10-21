"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import type { ImportAnalysis } from "@/lib/import/normalize";
import type { BatchRow, ImportSummary } from "@/lib/import/service";
import { faNum, faPrice } from "@/lib/format";
import { formatJalali } from "@/lib/jalali";

type AnalyzeResponse = {
  ok: boolean;
  error?: string;
  file?: { name: string; size: number; hash: string; delimiter: string };
  duplicateBatch?: { id: number; importedAt: string; rows: number } | null;
  analysis?: ImportAnalysis;
};

type ImportResult = {
  batchId: number;
  rowCount: number;
  inserted: number;
  updated: number;
  unchanged: number;
  priceChanges: number;
  invalidRows: number;
  observedAt: string;
};

type BatchesResponse = {
  ok: boolean;
  summary?: {
    total: number;
    ingredients: number;
    companies: number;
    categories: number;
    genericFamilies: number;
    lastSeen: string | null;
    batches: number;
  };
  batches?: BatchRow[];
};

type UploadState = "idle" | "analyzing" | "ready" | "importing" | "done";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${faNum(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${faNum(Math.round(bytes / 1024))} کیلوبایت`;
  return `${faNum(Math.round((bytes / 1024 / 1024) * 10) / 10)} مگابایت`;
}

function uploadWithProgress(
  url: string,
  body: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; body: AnalyzeResponse & { result?: ImportResult; summary?: BatchesResponse["summary"] } }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        resolve({ status: xhr.status, body: JSON.parse(xhr.responseText) });
      } catch {
        reject(new Error("پاسخ سرور قابل خواندن نبود."));
      }
    };
    xhr.onerror = () => reject(new Error("ارتباط با سرور برقرار نشد."));
    xhr.send(body);
  });
}

export function ImportWizard({
  initialSummary,
  initialBatches = [],
}: {
  initialSummary?: ImportSummary;
  initialBatches?: BatchRow[];
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [priceUnit, setPriceUnit] = useState<"rial" | "toman">("rial");
  const [observedAt, setObservedAt] = useState(new Date().toISOString().slice(0, 10));
  const [force, setForce] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [fileInfo, setFileInfo] = useState<AnalyzeResponse["file"] | null>(null);
  const [duplicateBatch, setDuplicateBatch] = useState<AnalyzeResponse["duplicateBatch"]>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<BatchRow[]>(initialBatches);
  const [summary, setSummary] = useState<BatchesResponse["summary"]>(initialSummary);

  const loadBatches = useCallback(async () => {
    try {
      const response = await fetch("/api/import/batches", { cache: "no-store" });
      const data = (await response.json()) as BatchesResponse;
      if (data.ok) {
        setBatches(data.batches ?? []);
        setSummary(data.summary);
      }
    } catch {
      // The import form still works if the history cannot be loaded.
    }
  }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  const chooseFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv") && selected.type !== "text/csv") {
      setError("فقط فایل CSV قابل قبول است.");
      return;
    }
    setFile(selected);
    setAnalysis(null);
    setFileInfo(null);
    setDuplicateBatch(null);
    setResult(null);
    setError("");
    setState("idle");
    setProgress(0);
  };

  const analyze = async () => {
    if (!file) return;
    setState("analyzing");
    setError("");
    setAnalysis(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("priceUnit", priceUnit);
      body.append("observedAt", observedAt);
      const response = await fetch("/api/import/analyze", { method: "POST", body });
      const data = (await response.json()) as AnalyzeResponse;
      if (!response.ok || !data.ok || !data.analysis) {
        setError(data.error ?? "تحلیل فایل انجام نشد.");
        setState("idle");
        return;
      }
      setAnalysis(data.analysis);
      setFileInfo(data.file ?? null);
      setDuplicateBatch(data.duplicateBatch ?? null);
      setForce(false);
      setState("ready");
    } catch {
      setError("ارتباط با سرور هنگام تحلیل برقرار نشد.");
      setState("idle");
    }
  };

  const importFile = async () => {
    if (!file || !analysis) return;
    setState("importing");
    setProgress(0);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("priceUnit", priceUnit);
      body.append("observedAt", observedAt);
      body.append("force", force ? "1" : "0");
      const response = await uploadWithProgress("/api/import", body, setProgress);
      if (response.status === 409 || !response.body.ok) {
        setError(response.body.error ?? "ثبت داده انجام نشد.");
        setState("ready");
        if (response.status === 409) setForce(true);
        return;
      }
      setResult(response.body.result ?? null);
      setState("done");
      void loadBatches();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ثبت داده انجام نشد.");
      setState("ready");
    }
  };

  const reset = () => {
    setFile(null);
    setAnalysis(null);
    setFileInfo(null);
    setDuplicateBatch(null);
    setResult(null);
    setError("");
    setState("idle");
    setProgress(0);
    setForce(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-faint">
        <Step active={Boolean(file)} done={Boolean(analysis)} index="۱" label="انتخاب فایل" />
        <span className="h-px w-6 bg-line-strong" />
        <Step active={Boolean(analysis)} done={state === "done"} index="۲" label="تحلیل و نگاشت" />
        <span className="h-px w-6 bg-line-strong" />
        <Step active={state === "done"} done={state === "done"} index="۳" label="ثبت در دیتابیس" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="space-y-5">
          <section className="surface-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-bold text-ink">فایل CSV سازمان غذا و دارو</h2>
                <p className="mt-0.5 text-[10px] leading-5 text-muted">
                  خروجی هفتگی را بدون تغییر ستون‌ها انتخاب کنید. فقط خواندن و ذخیره انجام می‌شود.
                </p>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-[9.5px] text-faint hover:text-[#bd4f67]"
                >
                  <X className="h-3 w-3" />
                  حذف انتخاب
                </button>
              )}
            </div>

            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />

            {!file ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  chooseFile(event.dataTransfer.files?.[0] ?? null);
                }}
                className={`mt-4 flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center transition ${
                  dragOver
                    ? "border-brand bg-[#eef5fe]"
                    : "border-line-strong bg-surface-soft/60 hover:border-[#b7d3f3] hover:bg-[#f7fbff]"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand shadow-sm ring-1 ring-line">
                  <Upload className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="mt-3 text-[12px] font-semibold text-ink">
                  فایل CSV را اینجا رها کنید
                </span>
                <span className="mt-1 text-[10px] text-muted">یا برای انتخاب کلیک کنید · حداکثر ۱۲۰ مگابایت</span>
                <span className="mt-2 text-[9px] text-faint">ستون‌های ضروری: IRC، FaName، GenericEnName</span>
              </button>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface-soft p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eaf2fe] text-brand">
                  <FileSpreadsheet className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-ink">{file.name}</p>
                  <p className="num mt-0.5 text-[9px] text-faint">{formatBytes(file.size)} · CSV</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[9.5px] text-muted hover:text-brand"
                >
                  تغییر فایل
                </button>
              </div>
            )}

            <div className="mt-4 grid gap-3 border-t border-line/60 pt-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[9.5px] text-muted">واحد قیمت فایل</span>
                <select
                  value={priceUnit}
                  onChange={(event) => {
                    setPriceUnit(event.target.value as "rial" | "toman");
                    setAnalysis(null);
                    setFileInfo(null);
                    setDuplicateBatch(null);
                    setResult(null);
                    setState("idle");
                  }}
                  className="field !py-1.5 text-[10.5px]"
                >
                  <option value="rial">ریال (پیش‌فرض)</option>
                  <option value="toman">تومان</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[9.5px] text-muted">تاریخ مشاهده (میلادی)</span>
                <input
                  type="date"
                  value={observedAt}
                  onChange={(event) => setObservedAt(event.target.value)}
                  className="field num !py-1.5 text-[10.5px]"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!file || state === "analyzing" || state === "importing"}
                  className="btn-primary w-full !justify-center !py-2 !text-[11px]"
                >
                  {state === "analyzing" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      در حال تحلیل…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      تحلیل فایل
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#f0d6dd] bg-[#fff7f9] px-3 py-2 text-[10px] leading-5 text-[#a6475e]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </section>

          {analysis && fileInfo && (
            <>
              <section className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[14px] font-bold text-ink">خلاصه تحلیل</h2>
                    <p className="mt-0.5 text-[9.5px] text-faint">
                      {fileInfo.name} · {formatBytes(fileInfo.size)} · هش{" "}
                      <span dir="ltr" className="font-mono">
                        {fileInfo.hash.slice(0, 12)}…
                      </span>
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef8f4] px-2 py-0.5 text-[9px] font-medium text-[#1b8663]">
                    آماده ورود
                  </span>
                </div>

                {duplicateBatch && (
                  <div className="mt-3 rounded-lg border border-[#f0e2c8] bg-[#fffbf3] px-3 py-2 text-[9.5px] leading-5 text-[#8f6d34]">
                    این فایل در{" "}
                    <span className="num">{formatJalali(duplicateBatch.importedAt)}</span> با{" "}
                    <span className="num">{faNum(duplicateBatch.rows)}</span> ردیف وارد شده است. برای
                    ثبت مجدد، گزینه «ورود مجدد» را در پایین فعال کنید.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <MiniStat label="ردیف فایل" value={faNum(analysis.rows)} />
                  <MiniStat label="IRC یکتا" value={faNum(analysis.uniqueIrc)} />
                  <MiniStat label="مواد مؤثره" value={faNum(analysis.ingredientCount)} />
                  <MiniStat label="شرکت‌ها" value={faNum(analysis.brandOwnerCount)} />
                  <MiniStat label="بدون قیمت" value={faNum(analysis.missingPrice)} tone={analysis.missingPrice ? "amber" : undefined} />
                  <MiniStat label="خانواده ژنریک" value={faNum(analysis.genericCodeCount)} />
                  <MiniStat
                    label="میانه قیمت (تومان)"
                    value={analysis.price ? faNum(analysis.price.median) : "—"}
                  />
                  <MiniStat label="دسته‌های ATC" value={faNum(analysis.atcCount)} />
                </div>

                {analysis.warnings.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {analysis.warnings.map((warning) => (
                      <p key={warning} className="flex items-start gap-1.5 text-[9.5px] leading-5 text-[#8f6d34]">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        {warning}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line/60 pt-3">
                  {analysis.productTypes.map((type) => (
                    <span
                      key={type.value}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] ${
                        type.value === "28"
                          ? "border-[#ddd5f8] bg-[#f8f6fe] text-[#6144c2]"
                          : "border-[#d5e4f5] bg-[#f6faff] text-[#2f5f9f]"
                      }`}
                    >
                      {type.label}
                      <span className="num text-faint">{faNum(type.count)}</span>
                    </span>
                  ))}
                  {analysis.categories.slice(0, 6).map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[9px] text-muted"
                    >
                      {category.name}
                      <span className="num text-faint">{faNum(category.count)}</span>
                    </span>
                  ))}
                </div>
              </section>

              <section className="surface-card overflow-hidden">
                <div className="border-b border-line/70 px-4 py-3">
                  <h2 className="text-[13px] font-bold text-ink">نگاشت ستون‌ها به مدل فعلی</h2>
                  <p className="mt-0.5 text-[9.5px] text-faint">
                    فقط ستون‌هایی که در فایل پیدا شده‌اند در ورود استفاده می‌شوند.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-[10px]">
                    <thead>
                      <tr className="border-b border-line/60 bg-surface-soft/60 text-[8.5px] text-faint">
                        <th className="px-4 py-2 text-start font-medium">فیلد CSV</th>
                        <th className="px-3 py-2 text-start font-medium">نقش در دارونما</th>
                        <th className="px-4 py-2 text-start font-medium">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/50">
                      {analysis.headers.map((header) => (
                        <tr key={header.key} className="hover:bg-surface-soft">
                          <td className="px-4 py-2">
                            <span className="font-medium text-ink-soft">{header.label}</span>
                            {header.detected && header.detected !== header.label && (
                              <span className="ms-1 text-[8px] text-faint">({header.detected})</span>
                            )}
                            <span className="mt-0.5 block text-[8.5px] text-faint">{header.note}</span>
                          </td>
                          <td className="px-3 py-2 text-muted">{header.role}</td>
                          <td className="px-4 py-2">
                            {header.detected ? (
                              <span className="inline-flex items-center gap-1 text-[8.5px] text-[#1b8663]">
                                <CheckCircle2 className="h-3 w-3" />
                                موجود
                              </span>
                            ) : (
                              <span className="text-[8.5px] text-faint">خالی / ناموجود</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="surface-card p-4 sm:p-5">
                <h2 className="text-[13px] font-bold text-ink">جمله‌بندی گروه‌بندی</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {analysis.grouping.map((item) => (
                    <div key={item.title} className="rounded-lg border border-line/80 bg-surface-soft p-2.5">
                      <p className="text-[9px] font-semibold text-brand-dark">{item.title}</p>
                      <p dir="ltr" className="mt-0.5 text-start font-mono text-[8.5px] text-ink-soft">
                        {item.field}
                      </p>
                      <p className="mt-1 text-[8.5px] leading-4 text-muted">{item.use}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="surface-card overflow-hidden">
                <div className="border-b border-line/70 px-4 py-3">
                  <h2 className="text-[13px] font-bold text-ink">نمونه ردیف‌های نرمال‌شده</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-[9.5px]">
                    <thead>
                      <tr className="border-b border-line/60 text-[8.5px] text-faint">
                        <th className="px-4 py-2 text-start font-medium">نام</th>
                        <th className="px-3 py-2 text-start font-medium">ماده مؤثره</th>
                        <th className="px-3 py-2 text-start font-medium">شرکت</th>
                        <th className="px-3 py-2 text-start font-medium">قیمت</th>
                        <th className="px-4 py-2 text-start font-medium">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/50">
                      {analysis.samples.map((sample) => (
                        <tr key={sample.irc}>
                          <td className="px-4 py-2 font-medium text-ink-soft">{sample.name}</td>
                          <td className="px-3 py-2 text-muted">{sample.ingredient}</td>
                          <td className="px-3 py-2 text-muted">{sample.company}</td>
                          <td className="num px-3 py-2 text-ink-soft">
                            {sample.price !== null ? faPrice(sample.price) : "—"}
                          </td>
                          <td className="px-4 py-2 text-muted">{sample.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-[13px] font-bold text-ink">
                      ثبت {faNum(analysis.validRows)} ردیف در دیتابیس
                    </h2>
                    <p className="mt-0.5 text-[9.5px] leading-5 text-muted">
                      ردیف‌ها با کلید IRC به‌روزرسانی می‌شوند و قیمت هر بار ورود در تاریخچه ثبت می‌شود.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {duplicateBatch && (
                      <label className="inline-flex items-center gap-1.5 text-[9px] text-muted">
                        <input
                          type="checkbox"
                          checked={force}
                          onChange={(event) => setForce(event.target.checked)}
                          className="accent-[#2f6fce]"
                        />
                        ورود مجدد
                      </label>
                    )}
                    <button
                      type="button"
                      onClick={importFile}
                      disabled={state === "importing" || state === "done" || Boolean(duplicateBatch && !force)}
                      className="btn-primary !justify-center !py-2 !text-[11px]"
                    >
                      {state === "importing" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          {progress < 100 ? `آپلود ${faNum(progress)}٪` : "در حال پردازش…"}
                        </>
                      ) : state === "done" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          ثبت شد
                        </>
                      ) : (
                        <>
                          <Database className="h-3.5 w-3.5" />
                          ثبت در دیتابیس
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {state === "importing" && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-tint">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[#2f6fce] to-[#159a89] transition-all"
                      style={{ width: `${Math.max(4, progress)}%` }}
                    />
                  </div>
                )}
              </section>
            </>
          )}

          {state === "done" && result && (
            <section className="surface-card border-[#cfe8dd] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f0] text-[#1b8663]">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-bold text-ink">ورود داده با موفقیت ثبت شد</h2>
                  <p className="mt-1 text-[10px] leading-5 text-muted">
                    batch #{faNum(result.batchId)} · تاریخ مشاهده {formatJalali(result.observedAt)}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <MiniStat label="کل ردیف" value={faNum(result.rowCount)} />
                    <MiniStat label="جدید" value={faNum(result.inserted)} />
                    <MiniStat label="به‌روزرسانی" value={faNum(result.updated)} />
                    <MiniStat label="تغییر قیمت" value={faNum(result.priceChanges)} tone={result.priceChanges ? "rose" : undefined} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/imported" className="btn-primary !py-2 !text-[10.5px]">
                      کاوش داده‌های واردشده
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                    <button type="button" onClick={reset} className="btn-secondary !py-2 !text-[10.5px]">
                      ورود فایل جدید
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-4">
            <h2 className="flex items-center gap-1.5 text-[12px] font-bold text-ink">
              <Database className="h-3.5 w-3.5 text-brand" />
              وضعیت دیتابیس
            </h2>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <MiniStat label="محصولات" value={faNum(summary?.total ?? 0)} />
              <MiniStat label="مواد مؤثره" value={faNum(summary?.ingredients ?? 0)} />
              <MiniStat label="شرکت‌ها" value={faNum(summary?.companies ?? 0)} />
              <MiniStat label="batchها" value={faNum(summary?.batches ?? 0)} />
            </div>
            {summary?.lastSeen && (
              <p className="mt-2 text-[8.5px] text-faint">
                آخرین به‌روزرسانی: {formatJalali(summary.lastSeen)}
              </p>
            )}
            <Link href="/imported" className="mt-2 inline-flex items-center gap-1 text-[9.5px] text-brand hover:text-brand-dark">
              مشاهده داده‌ها
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </section>

          <section className="surface-card p-4">
            <h2 className="text-[11.5px] font-bold text-ink">قبل از ورود بدانید</h2>
            <ul className="mt-2 space-y-2 text-[9px] leading-5 text-muted">
              <li>• هر ردیف CSV یک بسته/ثبت است، نه یک داروی یکتا.</li>
              <li>• کلید اصلی <span dir="ltr">IRC</span> است؛ GTIN یکتا نیست.</li>
              <li>• قیمت با فرض واحد انتخابی به تومان تبدیل می‌شود.</li>
              <li>• تاریخچه قیمت فقط از ورودی‌های ثبت‌شده ساخته می‌شود.</li>
              <li>• فایل را دست‌نخورده و بدون بازکردن در Excel آپلود کنید؛ IRC می‌تواند با صفر شروع شود.</li>
              <li>• این صفحه در نسخه نمایشی احراز هویت ندارد؛ در استقرار عمومی باید محافظت شود.</li>
            </ul>
          </section>

          <section className="surface-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-3.5 py-2.5">
              <h2 className="text-[11.5px] font-bold text-ink">آخرین ورودها</h2>
              <span className="num text-[8.5px] text-faint">{faNum(batches.length)}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {batches.length === 0 ? (
                <p className="px-3.5 py-5 text-center text-[9px] text-faint">هنوز فایلی وارد نشده است.</p>
              ) : (
                <ul className="divide-y divide-line/50">
                  {batches.map((batch) => (
                    <li key={batch.id} className="px-3.5 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="num text-[9px] text-ink-soft">batch #{faNum(batch.id)}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[7.5px] ${
                            batch.status === "completed"
                              ? "bg-[#eaf7f0] text-[#1c825f]"
                              : batch.status === "failed"
                                ? "bg-[#fdeef1] text-[#b84a63]"
                                : "bg-[#fdf4e6] text-[#a86e19]"
                          }`}
                        >
                          {batch.status === "completed" ? "کامل" : batch.status === "failed" ? "خطا" : "در حال پردازش"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[8.5px] text-faint">{batch.file_name}</p>
                      <p className="num mt-0.5 text-[8px] text-faint">
                        {faNum(batch.row_count)} ردیف · {formatJalali(batch.imported_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Step({
  active,
  done,
  index,
  label,
}: {
  active: boolean;
  done: boolean;
  index: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 ${
        done
          ? "border-[#cfe8dd] bg-[#f3fbf7] text-[#1b8663]"
          : active
            ? "border-[#c9ddf5] bg-[#f4f9ff] text-brand-dark"
            : "border-line bg-white text-faint"
      }`}
    >
      <span className="num flex h-4 w-4 items-center justify-center rounded-full bg-white/80 text-[8px]">
        {done ? "✓" : index}
      </span>
      {label}
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "amber" | "rose" }) {
  return (
    <div className="rounded-lg border border-line/80 bg-white px-2.5 py-2">
      <p className="text-[8px] text-faint">{label}</p>
      <p
        className={`num mt-0.5 text-[11px] font-bold ${
          tone === "amber" ? "text-[#a86e19]" : tone === "rose" ? "text-[#b84d64]" : "text-ink-soft"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

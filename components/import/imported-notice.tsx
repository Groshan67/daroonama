"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { faNum } from "@/lib/format";

type SummaryResponse = {
  ok: boolean;
  summary?: { total: number; batches: number };
};

export function ImportedDataNotice() {
  const [summary, setSummary] = useState<SummaryResponse["summary"]>(undefined);

  useEffect(() => {
    let active = true;
    fetch("/api/import/summary", { cache: "no-store" })
      .then((response) => response.json() as Promise<SummaryResponse>)
      .then((data) => {
        if (active && data.ok) setSummary(data.summary);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!summary || summary.total <= 0) return null;

  return (
    <Link
      href="/imported"
      className="group mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#cfe6df] bg-[#f3fbf8] px-3.5 py-2.5 text-[9.5px] text-[#1b6f5b] transition hover:border-[#a9d8ca] hover:bg-[#eefaf5]"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-teal ring-1 ring-[#d5eee5]">
        <Database className="h-3 w-3" />
      </span>
      <span>
        داده CSV واردشده:{" "}
        <strong className="num font-semibold">{faNum(summary.total)}</strong> محصول در{" "}
        <strong className="num font-semibold">{faNum(summary.batches)}</strong> فایل
      </span>
      <span className="ms-auto inline-flex items-center gap-1 font-medium">
        کاوش در دیتابیس
        <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}

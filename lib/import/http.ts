import type { NextRequest } from "next/server";
import {
  buildHeaderMap,
  parseCsvBuffer,
  sha256,
  type HeaderMap,
  type ParsedCsv,
  type PriceUnit,
} from "./normalize";

const MAX_FILE_BYTES = 120 * 1024 * 1024;
const MAX_ROWS = 120_000;

export type CsvUpload = {
  buffer: Buffer;
  fileName: string;
  fileHash: string;
  priceUnit: PriceUnit;
  force: boolean;
  observedAt: string;
  parsed: ParsedCsv;
  headers: HeaderMap;
};

export async function readCsvUpload(request: NextRequest): Promise<CsvUpload> {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new Error("فایلی برای ارسال پیدا نشد. یک فایل CSV انتخاب کنید.");
  }
  if (file.size === 0) throw new Error("فایل خالی است.");
  if (file.size > MAX_FILE_BYTES) throw new Error("حجم فایل بیش از ۱۲۰ مگابایت است.");

  const priceUnit: PriceUnit = form.get("priceUnit") === "toman" ? "toman" : "rial";
  const force = form.get("force") === "1";
  const observedRaw = String(form.get("observedAt") ?? "").trim();
  const observedAt = /^\d{4}-\d{2}-\d{2}$/.test(observedRaw)
    ? observedRaw
    : new Date().toISOString().slice(0, 10);

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseCsvBuffer(buffer);
  if (!parsed.rows.length) throw new Error("هیچ ردیف داده‌ای در فایل پیدا نشد.");
  if (parsed.rows.length > MAX_ROWS) {
    throw new Error(`فایل بیش از ${MAX_ROWS.toLocaleString("fa-IR")} ردیف دارد.`);
  }

  return {
    buffer,
    fileName: file.name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 160),
    fileHash: sha256(buffer),
    priceUnit,
    force,
    observedAt,
    parsed,
    headers: buildHeaderMap(parsed.headers),
  };
}

import { NextResponse, type NextRequest } from "next/server";
import { readCsvUpload } from "@/lib/import/http";
import { normalizeRows, REQUIRED_FIELDS } from "@/lib/import/normalize";
import {
  findBatchByHash,
  getImportSummary,
  importProducts,
} from "@/lib/import/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let upload;
  try {
    upload = await readCsvUpload(request);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "دریافت فایل ناموفق بود." },
      { status: 400 },
    );
  }

  if (upload.headers.missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `ستون‌های ضروری پیدا نشد: ${upload.headers.missing.join("، ")}`,
        missing: upload.headers.missing,
        expected: REQUIRED_FIELDS,
      },
      { status: 400 },
    );
  }

  const duplicate = findBatchByHash(upload.fileHash);
  if (duplicate && !upload.force) {
    return NextResponse.json(
      {
        ok: false,
        code: "duplicate",
        error: "همین فایل قبلاً وارد شده است. برای ثبت مجدد، گزینه «ورود مجدد» را فعال کنید.",
        duplicateBatch: {
          id: duplicate.id,
          importedAt: duplicate.imported_at,
          rows: duplicate.row_count,
        },
      },
      { status: 409 },
    );
  }

  const { products, invalidRows } = normalizeRows(
    upload.parsed.rows,
    upload.headers,
    upload.priceUnit,
  );
  if (products.length === 0) {
    return NextResponse.json(
      { ok: false, error: "هیچ ردیف معتبری برای ورود پیدا نشد." },
      { status: 400 },
    );
  }

  try {
    const result = importProducts(products, {
      fileName: upload.fileName,
      fileHash: upload.fileHash,
      observedAt: upload.observedAt,
      priceUnit: upload.priceUnit,
      columns: upload.parsed.headers,
      invalidRows,
    });
    return NextResponse.json({
      ok: true,
      result,
      summary: getImportSummary(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `ثبت داده با خطا مواجه شد: ${error.message}`
            : "ثبت داده با خطا مواجه شد.",
      },
      { status: 500 },
    );
  }
}

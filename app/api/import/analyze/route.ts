import { NextResponse, type NextRequest } from "next/server";
import { readCsvUpload } from "@/lib/import/http";
import {
  analyzeProducts,
  normalizeRows,
  REQUIRED_FIELDS,
} from "@/lib/import/normalize";
import { findBatchByHash } from "@/lib/import/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const upload = await readCsvUpload(request);
    if (upload.headers.missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `ستون‌های ضروری پیدا نشد: ${upload.headers.missing.join("، ")}`,
          missing: upload.headers.missing,
          receivedHeaders: upload.parsed.headers,
          expected: REQUIRED_FIELDS,
        },
        { status: 400 },
      );
    }

    const { products, invalidRows } = normalizeRows(
      upload.parsed.rows,
      upload.headers,
      upload.priceUnit,
    );
    const analysis = analyzeProducts(products, upload.priceUnit, invalidRows, upload.headers);
    if (upload.parsed.repairedRows > 0) {
      analysis.warnings.unshift(
        `${upload.parsed.repairedRows} ردیف دارای ستون اضافی/جابه‌جایی بود و به‌صورت خودکار اصلاح شد.`,
      );
    }
    const duplicate = findBatchByHash(upload.fileHash);

    return NextResponse.json({
      ok: true,
      file: {
        name: upload.fileName,
        size: upload.buffer.length,
        hash: upload.fileHash,
        delimiter: upload.parsed.delimiter,
        repairedRows: upload.parsed.repairedRows,
      },
      duplicateBatch: duplicate
        ? {
            id: duplicate.id,
            importedAt: duplicate.imported_at,
            rows: duplicate.row_count,
          }
        : null,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "تحلیل فایل با خطا مواجه شد.",
      },
      { status: 400 },
    );
  }
}

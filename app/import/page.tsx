import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ImportWizard } from "@/components/import/import-wizard";
import { getImportSummary, listBatches } from "@/lib/import/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ورود داده CSV",
  description: "بارگذاری خروجی هفتگی سازمان غذا و دارو در دیتابیس دارونما.",
};

export default function ImportPage() {
  const summary = getImportSummary();
  const batches = listBatches(12);

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "داده" }, { label: "ورود داده CSV" }]} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="h-1 w-1 rounded-full bg-teal" />
            داده رسمی · مرحله ورود
          </p>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            ورود داده CSV
          </h1>
          <p className="mt-1.5 max-w-[700px] text-[12px] leading-6 text-muted">
            فایل هفتگی سازمان غذا و دارو را انتخاب کنید؛ ابتدا ستون‌ها و کیفیت داده تحلیل می‌شود و
            سپس با کلید IRC در دیتابیس ثبت می‌شوند. تاریخچه قیمت برای هر بار ورود نگه داشته می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 text-[9.5px] text-muted">
            <FileSpreadsheet className="h-3.5 w-3.5 text-teal" />
            CSV · UTF-8 / Windows-1256
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 text-[9.5px] text-muted">
            <Database className="h-3.5 w-3.5 text-brand" />
            SQLite
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#f0e2c8] bg-[#fffbf3] px-3.5 py-2.5 text-[9.5px] leading-5 text-[#8f6d34]">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          این صفحه در نسخه نمایشی احراز هویت ندارد و برای اجرای محلی طراحی شده است. پیش از
          استقرار عمومی، دسترسی آن را محدود کنید. داده اصلی در{" "}
          <span dir="ltr" className="font-mono">.data/daranama.sqlite</span> ذخیره می‌شود.
        </p>
      </div>

      <div className="mt-6">
        <ImportWizard initialSummary={summary} initialBatches={batches} />
      </div>

      <p className="mt-4 text-[9px] text-faint">
        برای مشاهده داده‌های ثبت‌شده به{" "}
        <Link href="/imported" className="text-brand hover:underline">
          کاوش داده‌های واردشده
        </Link>{" "}
        بروید. داده‌های فعلی خانه و جستجوی عمومی همچنان نمونه نمایشی هستند؛ اتصال کامل صفحات به
        دیتابیس در مرحله بعد انجام می‌شود.
      </p>
    </div>
  );
}

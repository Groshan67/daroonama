import Link from "next/link";
import { Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eaf2fe] to-[#e8f7f3] text-brand ring-1 ring-[#dbe8f6]">
        <Compass className="h-6 w-6" strokeWidth={1.6} />
      </span>
      <p className="num mt-4 text-[42px] font-extrabold leading-none text-ink">۴۰۴</p>
      <h1 className="mt-2 text-[18px] font-bold text-ink">این صفحه پیدا نشد</h1>
      <p className="mt-1.5 max-w-sm text-[11.5px] leading-6 text-muted">
        ممکن است نشانی تغییر کرده باشد یا محصول موردنظر در نسخه نمایشی وجود نداشته باشد. از
        جستجوی سراسری استفاده کنید.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/search" className="btn-primary">
          <Search className="h-3.5 w-3.5" />
          جستجوی دارو
        </Link>
        <Link href="/" className="btn-secondary">
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}

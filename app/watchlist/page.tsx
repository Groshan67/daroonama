import type { Metadata } from "next";
import { WatchlistPage } from "@/components/watchlist/watchlist-page";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "لیست پیگیری",
  description: "داروهای ذخیره‌شده و تغییر قیمت آن‌ها از زمان افزودن به لیست پیگیری.",
};

export default function Page() {
  return (
    <>
      <div className="page-container pt-5">
        <Breadcrumbs items={[{ label: "لیست پیگیری" }]} />
      </div>
      <WatchlistPage />
    </>
  );
}

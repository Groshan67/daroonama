import { ArrowDown, ArrowUp } from "lucide-react";
import { faPercent } from "@/lib/format";

export function PriceChange({
  value,
  compact = false,
  title = "تغییر نسبت به بازنگری قبلی",
}: {
  value: number;
  compact?: boolean;
  title?: string;
}) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium num ${
        compact ? "px-1 py-[1px] text-[9.5px]" : "px-1.5 py-0.5 text-[10.5px]"
      } ${
        positive ? "bg-[#fdf1f3] text-[#bd4f67]" : "bg-[#eaf7f1] text-[#1b8663]"
      }`}
      title={title}
      aria-label={`${title}: ${faPercent(value)}`}
    >
      {positive ? (
        <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.4} />
      ) : (
        <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.4} />
      )}
      {faPercent(value)}
    </span>
  );
}

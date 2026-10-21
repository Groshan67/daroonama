const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function faDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** Persian number with the Arabic thousands separator. */
export function faNum(value: number): string {
  const rounded = Math.round(value);
  return faDigits(new Intl.NumberFormat("en-US").format(rounded)).replace(/,/g, "٬");
}

export function faPrice(value: number): string {
  return `${faNum(value)} تومان`;
}

export function faPercent(value: number, withSign = false): string {
  const rounded = Math.round(value * 10) / 10;
  const abs = faDigits(
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: Number.isInteger(rounded) ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(Math.abs(rounded)),
  );
  const sign = rounded > 0 ? (withSign ? "+" : "") : rounded < 0 ? "−" : "";
  return `${sign}${abs}٪`;
}

/** Compact price for chart axes: ۴۵۰ هزار، ۱٫۲ میلیون */
export function faCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `${faDigits((value / 1_000_000_000).toFixed(1).replace(/\.0$/, "").replace(".", "٫"))} میلیارد`;
  }
  if (value >= 1_000_000) {
    return `${faDigits((value / 1_000_000).toFixed(1).replace(/\.0$/, "").replace(".", "٫"))} میلیون`;
  }
  if (value >= 1_000) {
    return `${faDigits(Math.round(value / 1_000))} هزار`;
  }
  return faNum(value);
}

export function faCount(value: number): string {
  return `${faNum(value)} قلم`;
}

export function productTypeLabel(value: string | number | null | undefined): string {
  const type = String(value ?? "").replace(/\.0+$/, "");
  if (type === "22") return "دارو";
  if (type === "28") return "مکمل";
  return "نامشخص";
}

/** Convert common English dose units to Persian-friendly labels. */
export function formatDose(value: string | null | undefined): string {
  if (!value) return "";
  let output = value
    .replace(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*mL/gi, "$1 میلی‌گرم/میلی‌لیتر")
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:mcg|µg|ug)\b/gi, "$1 میکروگرم")
    .replace(/(\d+(?:[.,]\d+)?)\s*mg\b/gi, "$1 میلی‌گرم")
    .replace(/(\d+(?:[.,]\d+)?)\s*IU\b/g, "$1 واحد")
    .replace(/(\d+(?:[.,]\d+)?)\s*mL\b/gi, "$1 میلی‌لیتر")
    .replace(/(\d+(?:[.,]\d+)?)\s*%/, "$1٪")
    .replace(/(\d+(?:[.,]\d+)?)\s*g\b/gi, "$1 گرم");
  output = faDigits(output).replace(/\./g, "٫");
  return output;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

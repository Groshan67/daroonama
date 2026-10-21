import { toJalaali } from "jalaali-js";
import { faDigits } from "./format";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export type JalaliParts = { jy: number; jm: number; jd: number };

export function jalaliParts(iso: string | Date): JalaliParts {
  const date = typeof iso === "string" ? new Date(`${iso.slice(0, 10)}T12:00:00Z`) : iso;
  const { jy, jm, jd } = toJalaali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return { jy, jm, jd };
}

/** ۲۵ مهر ۱۴۰۵ */
export function formatJalali(iso: string | Date, options?: { withYear?: boolean }): string {
  const { jy, jm, jd } = jalaliParts(iso);
  const withYear = options?.withYear ?? true;
  return `${faDigits(jd)} ${JALALI_MONTHS[jm - 1]}${withYear ? ` ${faDigits(jy)}` : ""}`;
}

/** مهر ۱۴۰۵ */
export function formatJalaliMonth(iso: string | Date): string {
  const { jy, jm } = jalaliParts(iso);
  return `${JALALI_MONTHS[jm - 1]} ${faDigits(jy)}`;
}

/** ۱۴۰۵/۰۷ */
export function formatJalaliNumeric(iso: string | Date): string {
  const { jy, jm, jd } = jalaliParts(iso);
  return faDigits(
    `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`,
  );
}

export function jalaliYear(iso: string | Date): number {
  return jalaliParts(iso).jy;
}

export function currentJalaliYear(): number {
  return jalaliParts(new Date()).jy;
}

/** Short label used on chart axes: ۱۴۰۵ */
export function jalaliYearLabel(iso: string): string {
  return faDigits(jalaliParts(iso).jy);
}

export type ImportCategory = {
  id: string;
  name: string;
  shortName: string;
};

export const IMPORT_CATEGORIES: ImportCategory[] = [
  { id: "diabetes", name: "دیابت", shortName: "دیابت" },
  { id: "hypertension", name: "ضد فشار خون (ARB و غیره)", shortName: "فشار خون" },
  { id: "neuro", name: "عصبی-روانی", shortName: "عصبی-روانی" },
  { id: "respiratory", name: "آسم و COPD", shortName: "آسم و COPD" },
  { id: "cephalosporin", name: "آنتی‌بیوتیک سفالوسپورین", shortName: "سفالوسپورین" },
  { id: "oncology", name: "ضدسرطان", shortName: "ضدسرطان" },
  { id: "immuno", name: "ضد روماتیسم و سرکوب‌کننده ایمنی", shortName: "ایمنی و روماتیسم" },
  { id: "gi", name: "PPI و زخم معده", shortName: "گوارش" },
  { id: "pain", name: "ضدتب و ضددرد", shortName: "ضددرد" },
  { id: "cardio", name: "قلبی-عروقی", shortName: "قلبی-عروقی" },
  { id: "antibiotic", name: "آنتی‌بیوتیک عمومی", shortName: "آنتی‌بیوتیک" },
  { id: "vitamin", name: "ویتامین و مکمل", shortName: "ویتامین" },
  { id: "hormone", name: "غدد و هورمون", shortName: "غدد" },
  { id: "ophthalmic", name: "چشمی", shortName: "چشمی" },
  { id: "diagnostic", name: "داروهای تشخیصی و تصویربرداری", shortName: "تشخیصی" },
  { id: "other", name: "سایر / طبقه‌بندی‌نشده", shortName: "سایر" },
];

export const IMPORT_CATEGORY_BY_ID = new Map(
  IMPORT_CATEGORIES.map((category) => [category.id, category]),
);

/**
 * ATC is the most reliable field for therapeutic grouping. We only use the
 * first 4 characters, because the full ATC code is product-specific.
 */
export function mapAtcToCategory(atc: string | null | undefined): ImportCategory {
  const code = (atc ?? "").trim().toUpperCase();
  if (!code) return IMPORT_CATEGORY_BY_ID.get("other")!;

  if (code.startsWith("A10")) return IMPORT_CATEGORY_BY_ID.get("diabetes")!;
  if (/^C0[23789]/.test(code)) return IMPORT_CATEGORY_BY_ID.get("hypertension")!;
  if (code.startsWith("C10") || code.startsWith("C01")) {
    return IMPORT_CATEGORY_BY_ID.get("cardio")!;
  }
  if (/^N0[356]/.test(code)) return IMPORT_CATEGORY_BY_ID.get("neuro")!;
  if (code.startsWith("R03")) return IMPORT_CATEGORY_BY_ID.get("respiratory")!;
  if (code.startsWith("J01D")) return IMPORT_CATEGORY_BY_ID.get("cephalosporin")!;
  if (code.startsWith("J01") || code.startsWith("J02")) {
    return IMPORT_CATEGORY_BY_ID.get("antibiotic")!;
  }
  if (code.startsWith("L01") || code.startsWith("L02")) {
    return IMPORT_CATEGORY_BY_ID.get("oncology")!;
  }
  if (code.startsWith("L04") || code.startsWith("M05") || code.startsWith("P01")) {
    return IMPORT_CATEGORY_BY_ID.get("immuno")!;
  }
  if (code.startsWith("A02")) return IMPORT_CATEGORY_BY_ID.get("gi")!;
  if (code.startsWith("N02") || code.startsWith("M01")) {
    return IMPORT_CATEGORY_BY_ID.get("pain")!;
  }
  if (code.startsWith("A11") || code.startsWith("B03")) {
    return IMPORT_CATEGORY_BY_ID.get("vitamin")!;
  }
  if (code.startsWith("H02") || code.startsWith("H03")) {
    return IMPORT_CATEGORY_BY_ID.get("hormone")!;
  }
  if (code.startsWith("S01")) return IMPORT_CATEGORY_BY_ID.get("ophthalmic")!;
  if (code.startsWith("V08")) return IMPORT_CATEGORY_BY_ID.get("diagnostic")!;

  return IMPORT_CATEGORY_BY_ID.get("other")!;
}

export function importedCategoryName(id: string | null | undefined): string {
  if (!id) return "سایر / طبقه‌بندی‌نشده";
  return IMPORT_CATEGORY_BY_ID.get(id)?.name ?? "سایر / طبقه‌بندی‌نشده";
}

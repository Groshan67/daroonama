import { IMPORT_CATEGORIES } from "@/lib/import/categories";
import type { AccentName } from "@/components/accents";

type CategoryMeta = {
  description: string;
  icon: string;
  accent: AccentName;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
  diabetes: {
    description: "داروهای خوراکی و تزریقی کنترل قند خون.",
    icon: "droplet",
    accent: "blue",
  },
  hypertension: {
    description: "داروهای کنترل فشار خون و بیماری‌های قلبی-عروقی.",
    icon: "heart-pulse",
    accent: "rose",
  },
  neuro: {
    description: "داروهای عصبی، روانی و ضدتشنج.",
    icon: "brain",
    accent: "violet",
  },
  respiratory: {
    description: "داروهای آسم، COPD و بیماری‌های تنفسی.",
    icon: "wind",
    accent: "cyan",
  },
  cephalosporin: {
    description: "آنتی‌بیوتیک‌های سفالوسپورین.",
    icon: "shield",
    accent: "amber",
  },
  oncology: {
    description: "داروهای ضدسرطان و درمان‌های هدفمند.",
    icon: "ribbon",
    accent: "rose",
  },
  immuno: {
    description: "داروهای ایمنی، روماتیسم و پیوند.",
    icon: "shield-check",
    accent: "emerald",
  },
  gi: {
    description: "داروهای گوارش، PPI و زخم معده.",
    icon: "stomach",
    accent: "teal",
  },
  pain: {
    description: "مسکن‌ها، ضدالتهاب‌ها و داروهای تب‌بر.",
    icon: "thermometer",
    accent: "amber",
  },
  cardio: {
    description: "داروهای قلبی-عروقی، چربی خون و ضدپلاکت.",
    icon: "activity",
    accent: "indigo",
  },
  antibiotic: {
    description: "آنتی‌بیوتیک‌های عمومی و ضدعفونت.",
    icon: "bug",
    accent: "teal",
  },
  vitamin: {
    description: "ویتامین‌ها، مواد معدنی و مکمل‌های تغذیه‌ای.",
    icon: "sun",
    accent: "emerald",
  },
  hormone: {
    description: "داروهای غدد درون‌ریز و هورمون‌ها.",
    icon: "flask",
    accent: "violet",
  },
  ophthalmic: {
    description: "داروهای چشمی و مراقبت از چشم.",
    icon: "eye",
    accent: "blue",
  },
  diagnostic: {
    description: "داروها و مواد تشخیصی و تصویربرداری.",
    icon: "flask",
    accent: "cyan",
  },
  other: {
    description: "سایر داروها و اقلام طبقه‌بندی‌نشده.",
    icon: "pill",
    accent: "blue",
  },
};

export const CATEGORY_LIST = IMPORT_CATEGORIES.map((category) => ({
  ...category,
  ...(CATEGORY_META[category.id] ?? CATEGORY_META.other),
}));

export const CATEGORY_BY_ID = new Map(CATEGORY_LIST.map((category) => [category.id, category]));

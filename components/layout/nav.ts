import {
  Archive,
  BookOpen,
  Building2,
  CalendarDays,
  Calculator,
  Database,
  Home,
  Layers,
  Network,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
};

export type NavGroup = {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "خانه",
    items: [{ label: "صفحه اصلی", href: "/", icon: Home, exact: true }],
  },
  {
    label: "جستجو",
    items: [
      { label: "جستجوی دارو", href: "/search", icon: Search },
      { label: "مواد مؤثره", href: "/ingredients", icon: Layers },
      { label: "طبقه‌بندی اثر دارویی", href: "/categories", icon: Tags },
      { label: "سازندگان", href: "/companies", icon: Building2 },
    ],
  },
  {
    label: "ابزارها",
    items: [
      { label: "شبیه‌سازی قیمت", href: "/simulation", icon: Calculator },
      { label: "تقویم بازنگری", href: "/calendar", icon: CalendarDays },
      { label: "آرشیو بازنگری", href: "/archive", icon: Archive },
      { label: "جستجوی شرطی", href: "/screener", icon: SlidersHorizontal },
      { label: "دستیار هوشمند", href: "/ask", icon: Sparkles, badge: "بتا" },
    ],
  },
  {
    label: "مطالعه",
    items: [{ label: "توضیح سیستم و گزارش‌ها", href: "/insights", icon: BookOpen }],
  },
  {
    label: "داده",
    adminOnly: true,
    items: [
      { label: "ورود داده CSV", href: "/import", icon: Upload },
      { label: "کاوش داده‌های واردشده", href: "/imported", icon: Database },
      { label: "سلسله‌مراتب ATC", href: "/atc", icon: Network },
    ],
  },
];

export const PAGE_TITLES: Record<string, string> = {
  search: "جستجوی دارو",
  ingredients: "مواد مؤثره",
  categories: "طبقه‌بندی اثر دارویی",
  companies: "سازندگان",
  drug: "صفحه دارو",
  ingredient: "ماده مؤثره",
  category: "طبقه‌بندی",
  company: "سازنده",
  simulation: "شبیه‌سازی قیمت",
  calendar: "تقویم بازنگری",
  archive: "آرشیو بازنگری",
  screener: "جستجوی شرطی",
  insights: "توضیح سیستم و گزارش‌ها",
  ask: "دستیار هوشمند",
  watchlist: "لیست پیگیری",
  about: "درباره داده‌ها",
  import: "ورود داده CSV",
  imported: "داده‌های واردشده",
  atc: "سلسله‌مراتب ATC",
};

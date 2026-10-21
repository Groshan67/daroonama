import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  FlaskConical,
  LayoutGrid,
  Tags,
} from "lucide-react";
import { ACCENTS, type AccentName } from "@/components/accents";

type ExploreCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof FlaskConical;
  accent: AccentName;
};

const SEARCH_CARDS: ExploreCard[] = [
  {
    title: "جستجو بر اساس مواد مؤثره",
    description: "مقایسه زودهنگام و دیرهنگام رقبا با ماده مؤثره یکسان و انتخاب اقتصادی‌تر.",
    href: "/ingredients",
    cta: "مشاهده مواد مؤثره",
    icon: FlaskConical,
    accent: "blue",
  },
  {
    title: "طبقه‌بندی اثر دارویی",
    description: "جستجو بر اساس دسته؛ مانند دیابت، فشار خون، ضدسرطان و داروهای گوارشی.",
    href: "/categories",
    cta: "مشاهده دسته‌ها",
    icon: Tags,
    accent: "violet",
  },
  {
    title: "جستجو بر اساس سازنده",
    description: "فهرست اقلام و قیمت دارو بر اساس شرکت داروسازی و کشور مبدأ.",
    href: "/companies",
    cta: "مشاهده سازندگان",
    icon: Building2,
    accent: "teal",
  },
];

const TOOL_CARDS: ExploreCard[] = [
  {
    title: "شبیه‌سازی قیمت دارو",
    description: "پیش‌بینی روند قیمت در ۱۰ سال آینده بر اساس معیارهای محاسباتی و نرخ رشد.",
    href: "/simulation",
    cta: "برآورد کن",
    icon: Calculator,
    accent: "teal",
  },
  {
    title: "تقویم بازنگری",
    description: "برنامه سالانه و تاریخچه بازنگری داروها، مهلت‌ها و اقدامات انتقالی.",
    href: "/calendar",
    cta: "مشاهده تقویم",
    icon: CalendarDays,
    accent: "blue",
  },
  {
    title: "آرشیو بازنگری",
    description: "فهرست کاهش قیمت، اقلام جدید، توقف تولید و بازنگری‌های گذشته.",
    href: "/archive",
    cta: "مشاهده آرشیو",
    icon: Archive,
    accent: "emerald",
  },
];

export function SearchCards() {
  return (
    <section aria-labelledby="search-title" className="mt-9">
      <SectionHead
        id="search-title"
        title="جستجو"
        hint="از ماده مؤثره تا سازنده"
        href="/search"
        linkLabel="جستجوی پیشرفته"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {SEARCH_CARDS.map((card, index) => (
          <ExploreCardView key={card.title} card={card} index={index} />
        ))}
      </div>
    </section>
  );
}

export function ToolCards() {
  return (
    <section aria-labelledby="tools-title" className="mt-8">
      <SectionHead
        id="tools-title"
        title="ابزارها (نمایشی)"
        hint="اتصال این بخش به داده واقعی در مرحله بعد"
        href="/calendar"
        linkLabel="همه ابزارها"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {TOOL_CARDS.map((card, index) => (
          <ExploreCardView key={card.title} card={card} index={index} />
        ))}
      </div>
    </section>
  );
}

function ExploreCardView({ card, index }: { card: ExploreCard; index: number }) {
  const accent = ACCENTS[card.accent];
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={`group surface-card rise relative flex flex-col overflow-hidden p-4 pt-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-[18px] sm:pt-5 ${accent.ring}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l ${accent.bar}`}
        aria-hidden="true"
      />
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent.iconBg} ${accent.iconText}`}
      >
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
      </span>
      <h3 className="mt-3.5 text-[14px] font-bold leading-6 text-ink transition-colors group-hover:text-brand-dark">
        {card.title}
      </h3>
      <p className="mt-1.5 min-h-[44px] text-[11.5px] leading-[1.9] text-muted">{card.description}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand">
        {card.cta}
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      </span>
    </Link>
  );
}

function SectionHead({
  id,
  title,
  hint,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  hint: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h2
          id={id}
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.07em] text-faint"
        >
          <span className="h-3 w-[3px] rounded-full bg-brand/50" />
          {title}
        </h2>
        <span className="hidden text-[10px] text-faint/70 sm:inline">{hint}</span>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[10.5px] font-medium text-faint transition-colors hover:text-brand"
      >
        {linkLabel}
        <ArrowLeft className="h-3 w-3" />
      </Link>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { WatchlistProvider } from "@/components/watchlist-provider";
import { SITE } from "@/lib/site";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "قیمت دارو | جستجوی قیمت داروهای ایرانی و خارجی | دارونما",
    template: "%s | دارونما",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: SITE.keywords,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "health",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },
  alternates: {
    canonical: SITE.url,
    languages: { "fa-IR": SITE.url },
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE.url,
    siteName: SITE.name,
    title: "قیمت دارو | جستجوی قیمت داروهای ایرانی و خارجی | دارونما",
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE.name} | ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "قیمت دارو | دارونما",
    description: SITE.description,
    images: [SITE.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2f7fd",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    alternateName: [SITE.nameEn, ...SITE.brandAliases],
    url: SITE.url,
    description: SITE.description,
    inLanguage: "fa-IR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icon.svg`,
    description: SITE.description,
    sameAs: [SITE.url],
  },
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "فهرست قیمت داروهای ایران",
    alternateName: "Iran Drug Price Database",
    description:
      "داده‌های قیمت بسته و واحد محصولات دارویی ایران بر پایه فهرست رسمی کدهای دارویی (IRC)، شامل ماده مؤثره، کد ژنریک، ATC و تاریخچه قیمت.",
    url: `${SITE.url}/search`,
    keywords: SITE.keywords,
    inLanguage: "fa-IR",
    spatialCoverage: { "@type": "Place", name: "Iran" },
    temporalCoverage: "2026/2026",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: SITE.name, url: SITE.url },
    variableMeasured: ["ConsumerPrice", "PackageCount", "قیمت بسته", "قیمت واحد"],
  },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const admin = await isAdmin();
  return (
    <html lang="fa" dir="rtl">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-3.5 focus:py-2 focus:text-[12px] focus:font-medium focus:text-brand focus:shadow-lg"
        >
          پرش به محتوای اصلی
        </a>
        <WatchlistProvider>
          <AppShell isAdmin={admin}>{children}</AppShell>
        </WatchlistProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { SITE } from "./site";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE.url).toString();
}

export function seoMetadata({
  title,
  description,
  path,
  keywords = [],
  type = "website",
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.ogImage);
  return {
    title,
    description,
    keywords: [...new Set([...SITE.keywords, ...keywords])],
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE.name,
      title,
      description,
      locale: "fa_IR",
      images: [{ url: image, width: 1200, height: 630, alt: `${SITE.name} | ${SITE.tagline}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noindex
      ? { index: false, follow: true }
      : {
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
  };
}

import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/login", "/import", "/imported", "/atc"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}

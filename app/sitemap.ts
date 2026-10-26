import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function safeDate(value: string | null | undefined): Date {
  if (!value) return new Date(SITE.updatedAt);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(SITE.updatedAt) : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url.replace(/\/$/, "");
  const db = getDb();

  const staticRoutes = [
    "",
    "/drug-prices",
    "/compare",
    "/ingredients",
    "/categories",
    "/companies",
    "/simulation",
    "/ask",
    "/insights",
    "/about",
  ];

  const products = db
    .prepare(
      `SELECT irc, last_seen_at FROM products
       WHERE is_current = 1 AND irc IS NOT NULL AND irc != ''
       ORDER BY last_seen_at DESC, irc ASC`,
    )
    .all() as unknown as { irc: string; last_seen_at: string | null }[];

  const ingredients = db
    .prepare(
      `SELECT ingredient_key AS key, MAX(last_seen_at) AS last_seen_at
       FROM products
       WHERE is_current = 1 AND ingredient_key IS NOT NULL AND ingredient_key != ''
       GROUP BY ingredient_key
       ORDER BY last_seen_at DESC`,
    )
    .all() as unknown as { key: string; last_seen_at: string | null }[];

  const companies = db
    .prepare(
      `SELECT COALESCE(NULLIF(brand_owner_national_id, ''), brand_owner_name) AS id,
              MAX(last_seen_at) AS last_seen_at
       FROM products
       WHERE is_current = 1 AND brand_owner_name IS NOT NULL AND brand_owner_name != ''
       GROUP BY COALESCE(NULLIF(brand_owner_national_id, ''), brand_owner_name)
       ORDER BY last_seen_at DESC`,
    )
    .all() as unknown as { id: string; last_seen_at: string | null }[];

  const compareIngredients = db
    .prepare(
      `SELECT ingredient_key AS key, MAX(last_seen_at) AS last_seen_at, COUNT(*) AS count
       FROM products
       WHERE is_current = 1 AND ingredient_key IS NOT NULL AND ingredient_key != ''
       GROUP BY ingredient_key
       ORDER BY count DESC, key ASC
       LIMIT 20`,
    )
    .all() as unknown as { key: string; last_seen_at: string | null }[];

  const categories = db
    .prepare(
      `SELECT n.code, MAX(p.last_seen_at) AS last_seen_at
       FROM atc_nodes n
       JOIN products p ON p.atc LIKE n.code || '%' AND p.is_current = 1
       WHERE LENGTH(n.code) = 4
       GROUP BY n.code
       HAVING COUNT(p.irc) > 0
       ORDER BY last_seen_at DESC`,
    )
    .all() as unknown as { code: string; last_seen_at: string | null }[];

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: new Date(SITE.updatedAt),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : route === "/search" ? 0.9 : 0.7,
    })),
    ...products.map((row) => ({
      url: `${base}/drug/${encodeURIComponent(row.irc)}`,
      lastModified: safeDate(row.last_seen_at),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...compareIngredients.map((row) => ({
      url: `${base}/compare/${encodeURIComponent(row.key)}`,
      lastModified: safeDate(row.last_seen_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...ingredients.map((row) => ({
      url: `${base}/ingredient/${encodeURIComponent(row.key)}`,
      lastModified: safeDate(row.last_seen_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...companies.map((row) => ({
      url: `${base}/company/${encodeURIComponent(row.id)}`,
      lastModified: safeDate(row.last_seen_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...categories.map((row) => ({
      url: `${base}/category/${encodeURIComponent(row.code)}`,
      lastModified: safeDate(row.last_seen_at),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}

#!/usr/bin/env python3
"""Import approved Darukade high-confidence matches into market_prices.

Reads dry-run CSV files only; does not write to PostgreSQL and does not
overwrite products.price_toman.

Approval policy:
  - high: name_similarity >= 0.70
  - variant: score == 115 and name_similarity >= 0.70
"""
from __future__ import annotations

import csv
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(".data/daranama.sqlite")
DRY_RUN = ROOT / "dry-run"

SCHEMA = """
CREATE TABLE IF NOT EXISTS market_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_product_id TEXT NOT NULL,
  source_url TEXT,
  matched_irc TEXT NOT NULL,
  match_score INTEGER NOT NULL,
  match_confidence TEXT NOT NULL,
  price_toman INTEGER NOT NULL,
  original_price_toman INTEGER,
  discount_percent REAL,
  package_count INTEGER,
  unit_price_toman INTEGER,
  raw_name TEXT,
  raw_brand TEXT,
  raw_company TEXT,
  fetched_at TEXT NOT NULL,
  verified_at TEXT,
  UNIQUE(source, source_product_id, matched_irc)
);
CREATE INDEX IF NOT EXISTS idx_market_prices_irc ON market_prices(matched_irc);
CREATE INDEX IF NOT EXISTS idx_market_prices_source ON market_prices(source, source_product_id);
"""


def number(value: str | None) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def pack_number(value: str | None) -> int | None:
    if not value:
        return None
    head = value.split(":", 1)[0]
    return number(head)


def main() -> None:
    rows: list[dict] = []
    for filename in ("high-confidence.csv", "variant-groups.csv"):
        with (DRY_RUN / filename).open(encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                similarity = float(row.get("name_similarity") or 0)
                if row["status"] == "high" and similarity >= 0.70:
                    rows.append(row)
                elif row["status"] == "variant" and row["score"] == "115" and similarity >= 0.70:
                    rows.append(row)

    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0
    for row in rows:
        price = number(row.get("discount_cost_toman"))
        if not price:
            continue
        package_count = pack_number(row.get("matched_pack"))
        unit_price = round(price / package_count) if package_count else None
        conn.execute(
            """
            INSERT INTO market_prices (
              source, source_product_id, source_url, matched_irc,
              match_score, match_confidence, price_toman, original_price_toman,
              discount_percent, package_count, unit_price_toman,
              raw_name, raw_brand, raw_company, fetched_at, verified_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(source, source_product_id, matched_irc) DO UPDATE SET
              source_url = excluded.source_url,
              match_score = excluded.match_score,
              match_confidence = excluded.match_confidence,
              price_toman = excluded.price_toman,
              original_price_toman = excluded.original_price_toman,
              discount_percent = excluded.discount_percent,
              package_count = excluded.package_count,
              unit_price_toman = excluded.unit_price_toman,
              raw_name = excluded.raw_name,
              raw_brand = excluded.raw_brand,
              raw_company = excluded.raw_company,
              fetched_at = excluded.fetched_at,
              verified_at = excluded.verified_at
            """,
            (
                "darukade",
                str(row["darukade_id"]),
                row.get("product_url"),
                row["matched_irc"],
                int(row["score"]),
                row["status"],
                price,
                number(row.get("original_cost_toman")),
                float(row["discount_percent"]) if row.get("discount_percent") else None,
                package_count,
                unit_price,
                row.get("darukade_en_name"),
                row.get("darukade_brand"),
                row.get("darukade_company"),
                now,
                now,
            ),
        )
        inserted += 1
    conn.commit()
    count = conn.execute("SELECT COUNT(*) FROM market_prices").fetchone()[0]
    conn.close()
    print(f"approved rows: {len(rows)}")
    print(f"upserted: {inserted}")
    print(f"market_prices total: {count}")


if __name__ == "__main__":
    main()

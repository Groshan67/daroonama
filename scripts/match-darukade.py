#!/usr/bin/env python3
"""
Dry-run matching between Darukade products_flated and DaroNama supplements.

This script only reads both databases and writes CSV/JSON files. It never
updates PostgreSQL or SQLite.

Requirements:
  pip install psycopg2-binary

Environment:
  DARUKADE_DATABASE_URL=postgresql://user:password@localhost:5432/darukade
  DARANAMA_DB_PATH=.data/daranama.sqlite
  DRY_RUN_OUTPUT=dry-run

Usage:
  python scripts/match-darukade.py
"""
from __future__ import annotations

import csv
import json
import os
import random
import re
import sqlite3
from difflib import SequenceMatcher
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import psycopg2

PG_DSN = os.environ.get("DARUKADE_DATABASE_URL")
SQLITE_PATH = Path(os.environ.get("DARANAMA_DB_PATH", ".data/daranama.sqlite"))
OUTPUT_DIR = Path(os.environ.get("DRY_RUN_OUTPUT", "dry-run"))

DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
LEGAL_WORDS = [
    "شرکت",
    "داروسازی",
    "دارو سازی",
    "صنایع",
    "گروه",
    "تولید",
    "pharmaceutical",
    "pharma",
    "company",
    "co",
    "ltd",
    "inc",
    "corp",
]
STOP_WORDS = {
    "and", "for", "with", "the", "of", "plus", "p", "mg", "ml", "g", "kg",
    "عدد", "میلی", "لیتر", "گرم", "کیلوگرم", "کپسول", "قرص", "شربت", "قطره",
    "سافت", "ژل", "محلول", "خوراکی", "بسته", "جعبه", "مقوایی", "ایران",
    "supplement", "مکمل",
}


def normalize(value: object) -> str:
    if value is None:
        return ""
    text = str(value).translate(DIGITS).lower()
    text = text.replace("ي", "ی").replace("ك", "ک").replace("\u200c", " ")
    text = re.sub(r"[^0-9a-zآ-ی]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def tokens(value: object, drop: set[str] | None = None) -> list[str]:
    result: list[str] = []
    for token in normalize(value).split():
        if len(token) < 3 or token in STOP_WORDS or token.isdigit():
            continue
        if drop and token in drop:
            continue
        result.append(token)
    return result


def company_normalize(value: object) -> str:
    text = normalize(value)
    for legal in LEGAL_WORDS:
        legal_norm = normalize(legal)
        if legal_norm:
            text = re.sub(rf"\b{re.escape(legal_norm)}\b", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_pack(value: object) -> tuple[str | None, str | None]:
    text = normalize(value)
    match = re.search(r"(\d+(?:\.\d+)?)\s*(عدد|میلی لیتر|ml|گرم|g|kg|کیلوگرم)?", text)
    if not match:
        return None, None
    number = match.group(1)
    unit = match.group(2) or ""
    unit = {
        "عدد": "count",
        "میلی لیتر": "ml",
        "ml": "ml",
        "گرم": "g",
        "g": "g",
        "kg": "kg",
        "کیلوگرم": "kg",
    }.get(unit, unit)
    return number, unit or None


def form_normalize(value: object) -> str:
    text = normalize(value)
    mappings = [
        ("کپسول", "capsule"),
        ("capsule", "capsule"),
        ("قرص", "tablet"),
        ("tablet", "tablet"),
        ("شربت", "syrup"),
        ("syrup", "syrup"),
        ("قطره", "drop"),
        ("drop", "drop"),
        ("محلول", "solution"),
        ("solution", "solution"),
        ("سافت ژل", "softgel"),
        ("softgel", "softgel"),
        ("پودر", "powder"),
        ("powder", "powder"),
    ]
    for key, label in mappings:
        if key in text:
            return label
    return text


def dose_key(value: object) -> frozenset[str]:
    text = normalize(value)
    matches = re.findall(r"(\d+(?:[.,]\d+)?)\s*(mg|mcg|µg|ug|g|ml|iu|%|واحد|میلی گرم|میلیگرم)", text)
    result = set()
    for number, unit in matches:
        unit = {
            "µg": "mcg",
            "ug": "mcg",
            "میلی گرم": "mg",
            "میلیگرم": "mg",
            "واحد": "iu",
        }.get(unit, unit)
        result.add(f"{number.replace(',', '.')}:{unit}")
    return frozenset(result)


def product_text(value: object, brand_tokens: set[str]) -> str:
    text = normalize(value)
    for token in brand_tokens:
        text = re.sub(rf"\b{re.escape(token)}\b", " ", text)
    text = re.sub(r"\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|ug|g|ml|iu|%)\b", " ", text)
    text = re.sub(r"\b\d{1,4}\b", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def name_similarity(left: object, right: object, brand_tokens: set[str]) -> float:
    left_text = product_text(left, brand_tokens)
    right_text = product_text(right, brand_tokens)
    if not left_text or not right_text:
        return 0.0
    return SequenceMatcher(None, left_text, right_text).ratio()


def attrs_from_row(row: dict) -> dict[str, object]:
    attrs: dict[str, object] = {}
    for index in range(1, 13):
        title = row.get(f"title{index}")
        if title:
            key = normalize(title)
            value = row.get(f"value{index}")
            if key not in attrs or attrs[key] in (None, ""):
                attrs[key] = value
    return attrs


def attr(attrs: dict[str, object], *names: str) -> object:
    for name in names:
        value = attrs.get(normalize(name))
        if value not in (None, ""):
            return value
    return None


def our_pack(row: sqlite3.Row) -> tuple[str | None, str | None]:
    count = row["package_count"]
    en = normalize(row["en_name"])
    if count and count > 0:
        unit = "ml" if re.search(r"\bml\b", en) else "count"
        return str(int(count)), unit
    match = re.search(r"(?:^|\s)(\d{1,4})(?:\s*(ml|g|گرم|میلی لیتر))?(?:\s|$)", en)
    if not match:
        return None, None
    number = match.group(1)
    raw_unit = match.group(2) or ""
    unit = {"ml": "ml", "g": "g", "گرم": "g", "میلی لیتر": "ml"}.get(raw_unit, "count")
    return number, unit


def load_our_products() -> list[dict]:
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT irc, en_name, display_name, brand_name, brand_owner_name,
               ingredient_name_fa, package_count, dosage_form_fa, dose, price_toman
        FROM products
        WHERE is_current = 1 AND product_type = '28'
        """
    ).fetchall()
    conn.close()

    products: list[dict] = []
    for row in rows:
        en = normalize(row["en_name"])
        display = normalize(row["display_name"])
        brand = normalize(row["brand_name"])
        owner = company_normalize(row["brand_owner_name"])
        pack_number, pack_unit = our_pack(row)
        products.append(
            {
                "irc": row["irc"],
                "en": en,
                "display": display,
                "brand": brand,
                "owner": owner,
                "form": form_normalize(row["dosage_form_fa"]),
                "pack_number": pack_number,
                "pack_unit": pack_unit,
                "pack_key": f"{pack_number}:{pack_unit}" if pack_number else None,
                "dose": dose_key(f"{row['en_name']} {row['dose'] or ''}"),
                "price": row["price_toman"],
                "tokens": set(en.split() + display.split()),
            }
        )
    return products


def build_index(products: list[dict]) -> defaultdict[str, set[int]]:
    index: defaultdict[str, set[int]] = defaultdict(set)
    for idx, product in enumerate(products):
        for token in product["tokens"]:
            index[token].add(idx)
    return index


def load_darukade_rows() -> list[dict]:
    if not PG_DSN:
        raise RuntimeError("DARUKADE_DATABASE_URL is not set")
    conn = psycopg2.connect(PG_DSN)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, pid, product_url, en_name, fa_name, brand_en_name,
               original_cost, discount_cost, discount_percent,
               title1, value1, title2, value2, title3, value3, title4, value4,
               title5, value5, title6, value6, title7, value7, title8, value8
        FROM public.products_flated
        WHERE product_url ILIKE '%supplement%'
           OR fa_name LIKE '%مکمل%'
           OR value4 LIKE '%مکمل%'
        ORDER BY id
        """
    )
    columns = [description[0] for description in cur.description]
    rows = [dict(zip(columns, row)) for row in cur.fetchall()]
    conn.close()
    return rows


def safe_int(value: object) -> int | None:
    if value is None:
        return None
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    our_products = load_our_products()
    index = build_index(our_products)
    darukade_rows = load_darukade_rows()

    results: list[dict] = []
    for row in darukade_rows:
        attrs = attrs_from_row(row)
        brand_raw = row.get("brand_en_name")
        brand_tokens = set(tokens(brand_raw))
        product_tokens = set(tokens(row.get("en_name"), drop=brand_tokens))
        company = company_normalize(attr(attrs, "شرکت سازنده"))
        pack_raw = attr(attrs, "تعداد در بسته", "سایز")
        pack_number, pack_unit = parse_pack(pack_raw)
        pack_key = f"{pack_number}:{pack_unit}" if pack_number else None
        form = form_normalize(attr(attrs, "نوع محصول", "شکل دارویی"))
        pg_dose = dose_key(row.get("en_name"))

        token_sets = [index[token] for token in product_tokens if token in index]
        if token_sets:
            candidates = set.intersection(*token_sets) if len(token_sets) > 1 else set(token_sets[0])
        else:
            candidates = set()

        best = None
        top: list[dict] = []
        for idx in list(candidates)[:600]:
            item = our_products[idx]
            brand_match = bool(brand_tokens) and all(token in item["tokens"] for token in brand_tokens)
            product_match = bool(product_tokens) and all(token in item["tokens"] for token in product_tokens)
            pack_match = bool(pack_key) and pack_key == item["pack_key"]
            company_match = bool(company) and company == item["owner"]
            form_match = bool(form) and form == item["form"]
            dose_match = bool(pg_dose) and bool(pg_dose & item["dose"])
            dose_compatible = not (pg_dose and item["dose"]) or dose_match
            similarity = max(
                name_similarity(row.get("en_name"), item["en"], brand_tokens),
                name_similarity(row.get("en_name"), item["display"], brand_tokens),
            )

            score = (
                (40 if brand_match else 0)
                + (30 if product_match else 0)
                + (20 if pack_match else 0)
                + (20 if company_match else 0)
                + (5 if form_match else 0)
            )
            alternative = {
                "irc": item["irc"],
                "score": score,
                "display": item["display"],
                "en": item["en"],
                "owner": item["owner"],
                "pack": item["pack_key"],
                "brand_match": brand_match,
                "product_match": product_match,
                "pack_match": pack_match,
                "company_match": company_match,
                "form_match": form_match,
                "dose_match": dose_match,
                "dose_compatible": dose_compatible,
                "name_similarity": round(similarity, 3),
            }
            top.append(alternative)
            if best is None or score > best["score"]:
                best = alternative

        top.sort(key=lambda value: (-value["score"], value["irc"]))
        candidate_count = len(candidates)
        top_score = best["score"] if best else 0
        top_variants = [item for item in top if item["score"] == top_score] if best else []
        top_ties = len(top_variants)
        ambiguous = top_ties > 1
        same_variant_group = ambiguous and len(
            {(item["en"], item["owner"], item["pack"]) for item in top_variants}
        ) == 1
        is_ambiguous = ambiguous and not same_variant_group
        if best is None:
            status = "unmatched"
        elif same_variant_group:
            status = "variant"
        elif ambiguous:
            status = "ambiguous"
        elif (
            best["brand_match"]
            and best["product_match"]
            and best["pack_match"]
            and (best["company_match"] or best["form_match"])
            and best["score"] >= 85
            and best["dose_compatible"]
            and best["name_similarity"] >= 0.55
        ):
            status = "high"
        elif best["brand_match"] and best["product_match"] and best["score"] >= 55:
            status = "review"
        else:
            status = "unmatched"

        matched = our_products[next(i for i, item in enumerate(our_products) if best and item["irc"] == best["irc"])] if best else None
        results.append(
            {
                "status": status,
                "score": best["score"] if best else 0,
                "candidate_count": candidate_count,
                "top_ties": top_ties,
                "ambiguous": is_ambiguous,
                "variant_group": same_variant_group,
                "darukade_id": row["id"],
                "darukade_pid": row["pid"],
                "darukade_en_name": row["en_name"],
                "darukade_fa_name": row["fa_name"],
                "darukade_brand": row["brand_en_name"],
                "darukade_company": company,
                "darukade_pack": pack_key,
                "darukade_form": form,
                "discount_cost_toman": safe_int(row["discount_cost"]),
                "original_cost_toman": safe_int(row["original_cost"]),
                "discount_percent": safe_int(row["discount_percent"]),
                "product_url": row["product_url"],
                "matched_irc": matched["irc"] if matched else None,
                "matched_display": matched["display"] if matched else None,
                "matched_en_name": matched["en"] if matched else None,
                "matched_owner": matched["owner"] if matched else None,
                "matched_pack": matched["pack_key"] if matched else None,
                "matched_price_toman": matched["price"] if matched else None,
                "brand_match": best["brand_match"] if best else False,
                "product_match": best["product_match"] if best else False,
                "pack_match": best["pack_match"] if best else False,
                "company_match": best["company_match"] if best else False,
                "form_match": best["form_match"] if best else False,
                "dose_match": best["dose_match"] if best else False,
                "dose_compatible": best["dose_compatible"] if best else True,
                "name_similarity": best["name_similarity"] if best else 0,
                "alternatives": top[:3],
            }
        )

    # Stable output ordering for review.
    results.sort(key=lambda value: (-value["score"], value["darukade_id"]))

    all_fields = [
        "status", "score", "candidate_count", "top_ties", "ambiguous", "variant_group",
        "darukade_id", "darukade_pid", "darukade_en_name", "darukade_fa_name",
        "darukade_brand", "darukade_company", "darukade_pack", "darukade_form",
        "discount_cost_toman", "original_cost_toman", "discount_percent", "product_url",
        "matched_irc", "matched_display", "matched_en_name", "matched_owner",
        "matched_pack", "matched_price_toman",
        "brand_match", "product_match", "pack_match", "company_match", "form_match",
        "dose_match", "dose_compatible", "name_similarity",
    ]

    def write_csv(path: Path, rows: list[dict]) -> None:
        with path.open("w", encoding="utf-8-sig", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=all_fields, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)

    high = [item for item in results if item["status"] == "high"]
    review = [item for item in results if item["status"] == "review"]
    variant = [item for item in results if item["status"] == "variant"]
    ambiguous = [item for item in results if item["status"] == "ambiguous"]
    unmatched = [item for item in results if item["status"] == "unmatched"]
    write_csv(OUTPUT_DIR / "all-matches.csv", results)
    write_csv(OUTPUT_DIR / "high-confidence.csv", high)
    write_csv(OUTPUT_DIR / "review.csv", review)
    write_csv(OUTPUT_DIR / "variant-groups.csv", variant)
    write_csv(OUTPUT_DIR / "ambiguous.csv", ambiguous)
    write_csv(OUTPUT_DIR / "unmatched.csv", unmatched)

    random.seed(1405)
    sample = random.sample(high, min(30, len(high)))
    write_csv(OUTPUT_DIR / "manual-review-sample.csv", sample)

    counts = Counter(item["status"] for item in results)
    score_counts = Counter(item["score"] for item in results)
    matched_ircs = Counter(item["matched_irc"] for item in high if item["matched_irc"])
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_darukade_supplement_rows": len(results),
        "high_confidence": counts["high"],
        "review": counts["review"],
        "variant_groups": counts["variant"],
        "ambiguous": counts["ambiguous"],
        "unmatched": counts["unmatched"],
        "score_distribution": dict(sorted(score_counts.items(), reverse=True)),
        "high_unique_ircs": len(matched_ircs),
        "high_duplicate_ircs": [
            {"irc": irc, "count": count}
            for irc, count in matched_ircs.most_common(20)
            if count > 1
        ],
        "sample_20101": next((item for item in results if item["darukade_id"] == 20101), None),
        "files": {
            "all": "all-matches.csv",
            "high": "high-confidence.csv",
            "review": "review.csv",
            "variant_groups": "variant-groups.csv",
            "ambiguous": "ambiguous.csv",
            "unmatched": "unmatched.csv",
            "manual_sample": "manual-review-sample.csv",
        },
    }
    (OUTPUT_DIR / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "summary.md").write_text(
        "# Darukade dry-run\n\n"
        f"- Darukade supplement rows: {len(results)}\n"
        f"- High confidence: {counts['high']}\n"
        f"- Review: {counts['review']}\n"
        f"- Variant groups: {counts['variant']}\n"
        f"- Ambiguous: {counts['ambiguous']}\n"
        f"- Unmatched: {counts['unmatched']}\n"
        f"- High unique IRCs: {len(matched_ircs)}\n\n"
        "No database writes were performed.\n",
        encoding="utf-8",
    )

    print(json.dumps({
        "total": len(results),
        "high": counts["high"],
        "review": counts["review"],
        "variant_groups": counts["variant"],
        "ambiguous": counts["ambiguous"],
        "unmatched": counts["unmatched"],
        "high_unique_ircs": len(matched_ircs),
        "output": str(OUTPUT_DIR),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

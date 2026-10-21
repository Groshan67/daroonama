"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, Search, X } from "lucide-react";
import type { CatalogIngredient } from "@/lib/catalog/types";
import { faNum } from "@/lib/format";

const ALPHABET = [
  "ا",
  "ب",
  "پ",
  "ت",
  "ث",
  "ج",
  "چ",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "ژ",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ک",
  "گ",
  "ل",
  "م",
  "ن",
  "و",
  "ه",
  "ی",
];

function letterOf(value: string): string {
  const clean = value
    .trim()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/^آ/, "ا");
  const first = clean.charAt(0);
  return ALPHABET.includes(first) ? first : "سایر";
}

export function IngredientBrowser({ ingredients }: { ingredients: CatalogIngredient[] }) {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState("");

  const decorated = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        ...ingredient,
        letter: letterOf(ingredient.name || ingredient.key),
        haystack: `${ingredient.name} ${ingredient.nameEn ?? ""} ${ingredient.key}`.toLowerCase(),
      })),
    [ingredients],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const ingredient of decorated) {
      map.set(ingredient.letter, (map.get(ingredient.letter) ?? 0) + 1);
    }
    return map;
  }, [decorated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decorated.filter((ingredient) => {
      if (letter && ingredient.letter !== letter) return false;
      if (q && !ingredient.haystack.includes(q)) return false;
      return true;
    });
  }, [decorated, letter, query]);

  return (
    <div>
      <div className="surface-card mt-5 p-4">
        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-ink-soft" htmlFor="ingredient-filter">
          <Filter className="h-3 w-3 text-teal" />
          پالایش بر اساس نام ماده مؤثره
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            id="ingredient-filter"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً متفورمین، آتوموکستین، متوترکسات…"
            className="h-10 w-full rounded-xl border border-line bg-white ps-9 pe-9 text-[11.5px] text-ink outline-none transition placeholder:text-faint focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="پاک کردن جستجو"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3">
          <button
            type="button"
            onClick={() => setLetter("")}
            className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
              letter === ""
                ? "border-[#bfe3da] bg-[#e6f7f3] font-semibold text-[#158d7d]"
                : "border-line bg-white text-muted hover:border-[#b9e4db] hover:text-teal"
            }`}
          >
            همه
          </button>
          {ALPHABET.map((item) => {
            const count = counts.get(item) ?? 0;
            const disabled = count === 0;
            return (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => setLetter(letter === item ? "" : item)}
                className={`inline-flex min-w-[28px] items-center justify-center gap-1 rounded-full border px-1.5 py-1 text-[10px] transition ${
                  letter === item
                    ? "border-[#bfe3da] bg-[#e6f7f3] font-semibold text-[#158d7d]"
                    : disabled
                      ? "cursor-not-allowed border-line/50 bg-surface-soft text-faint/35"
                      : "border-line bg-white text-muted hover:border-[#b9e4db] hover:text-teal"
                }`}
                title={disabled ? "موردی ندارد" : `${faNum(count)} ماده`}
              >
                {item}
                <span className={`num text-[8px] ${letter === item ? "text-[#158d7d]" : "text-faint/60"}`}>
                  {faNum(count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-faint">
        <span>
          <span className="num font-semibold text-ink-soft">{faNum(filtered.length)}</span> ماده مؤثره
          {letter ? ` با حرف «${letter}»` : ""}
        </span>
        {(letter || query) && (
          <button type="button" onClick={() => { setLetter(""); setQuery(""); }} className="text-brand hover:text-brand-dark">
            پاک کردن فیلترها
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ingredient) => (
          <Link
            key={ingredient.key}
            href={`/ingredient/${encodeURIComponent(ingredient.key)}`}
            className="surface-card group flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5 hover:border-[#cfeee7] hover:shadow-lift"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold leading-6 text-ink group-hover:text-teal">
                {ingredient.name}
              </span>
              <span dir="ltr" className="mt-0.5 block truncate text-[8.5px] text-faint">
                {ingredient.nameEn ?? ingredient.key}
              </span>
            </span>
            <span className="num shrink-0 rounded-full bg-[#e6f7f3] px-2 py-0.5 text-[9px] font-semibold text-[#158d7d]">
              {faNum(ingredient.count)}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="surface-card mt-4 px-4 py-12 text-center">
          <p className="text-[12px] font-semibold text-ink">ماده‌ای پیدا نشد</p>
          <p className="mt-1 text-[10px] text-faint">عبارت یا حرف دیگری را امتحان کنید.</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CornerDownLeft,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import type { AssistantAnswer, AssistantDrug } from "@/lib/assistant";
import { faPrice } from "@/lib/format";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  bullets?: string[];
  drugs?: AssistantDrug[];
  links?: { label: string; href: string }[];
  suggestions?: string[];
};

const GREETING: Message = {
  id: "welcome",
  role: "assistant",
  text: "سلام! من دستیار داده‌های دارونما هستم و مستقیم به دیتابیس واقعی محصولات وصل هستم. درباره قیمت بسته و واحد، مقایسه محصولات هم‌ماده، شرکت‌ها و آمار پایگاه بپرسید.\nاین دستیار توصیه درمانی نمی‌دهد.",
  suggestions: [
    "ارزان‌ترین متفورمین کدام است؟",
    "قیمت استراموکس ۱۸ میلی‌گرم",
    "محصولات هم‌ماده آتورواستاتین",
    "بیشترین افزایش قیمت اخیر",
  ],
};

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || loading) return;
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: question,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!response.ok) throw new Error("assistant failed");
      const data = (await response.json()) as AssistantAnswer;
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.answer,
          bullets: data.bullets,
          drugs: data.drugs,
          links: data.links,
          suggestions: data.suggestions,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "ارتباط با سرویس پاسخ برقرار نشد. لطفاً دوباره تلاش کنید یا از صفحه جستجو استفاده کنید.",
          links: [{ label: "جستجوی دارو", href: "/search" }],
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <div className="surface-card flex h-[640px] max-h-[calc(100vh-160px)] min-h-[500px] flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line/70 px-4 py-3">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#3d7fdc] to-[#159a89] text-white">
          <Sparkles className="h-4 w-4" />
          <span className="absolute -end-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-[#2bbf8e]" />
        </span>
        <div>
          <p className="text-[12px] font-bold leading-5 text-ink">دستیار داده‌های دارونما</p>
          <p className="text-[9px] leading-4 text-faint">بتا · پاسخ بر پایه داده‌های همین پایگاه</p>
        </div>
        <span className="ms-auto rounded-full bg-[#eef8f4] px-2 py-0.5 text-[8.5px] font-medium text-[#1b8663]">
          آنلاین
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
        {messages.map((message) =>
          message.role === "assistant" ? (
            <div key={message.id} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#eaf2fe] to-[#e8f7f3] text-brand ring-1 ring-[#dce9f7]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="max-w-[88%] sm:max-w-[82%]">
                <div className="rounded-2xl rounded-tr-md border border-line/80 bg-white px-3.5 py-3 shadow-[0_2px_10px_-6px_rgba(17,42,74,0.18)]">
                  <p className="whitespace-pre-line text-[11.5px] leading-6 text-ink-soft">{message.text}</p>
                  {message.bullets && message.bullets.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-line/60 pt-2">
                      {message.bullets.map((bullet, index) => (
                        <li key={`${message.id}-b-${index}`} className="flex gap-1.5 text-[10px] leading-5 text-muted">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand/50" />
                          <span className="num">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {message.drugs && message.drugs.length > 0 && (
                    <div className="mt-2.5 grid gap-1.5 border-t border-line/60 pt-2.5 sm:grid-cols-2">
                      {message.drugs.slice(0, 4).map((drug) => (
                        <Link
                          key={drug.code}
                          href={`/drug/${drug.code}`}
                          className="group flex items-center gap-2 rounded-lg border border-line/80 bg-surface-soft/80 px-2.5 py-1.5 transition hover:border-[#c3d9f2] hover:bg-white"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[10px] font-semibold text-ink group-hover:text-brand">
                              {drug.name}
                            </span>
                            <span className="block truncate text-[8.5px] text-faint">{drug.companyName}</span>
                          </span>
                          <span className="num shrink-0 text-[9px] font-medium text-ink-soft">
                            {faPrice(drug.price)}
                          </span>
                          <ChevronLeft className="h-3 w-3 shrink-0 text-faint/50" />
                        </Link>
                      ))}
                    </div>
                  )}
                  {message.links && message.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-1 rounded-full border border-[#d5e4f5] bg-[#f5f9ff] px-2 py-0.5 text-[8.5px] font-medium text-brand hover:border-[#b7d3f3]"
                        >
                          {link.label}
                          <ChevronLeft className="h-2.5 w-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        className="rounded-full border border-line bg-white px-2.5 py-1 text-[9px] text-muted transition hover:border-[#c3d9f2] hover:text-brand"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={message.id} className="flex justify-end">
              <div className="flex max-w-[86%] items-start gap-2">
                <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-[#3a7bd8] to-[#2a66c2] px-3.5 py-2.5 text-[11.5px] leading-6 text-white shadow-[0_8px_20px_-12px_rgba(35,92,178,0.8)]">
                  {message.text}
                </div>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-tint text-faint ring-1 ring-line">
                  <User className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ),
        )}

        {loading && (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eaf2fe] text-brand">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tr-md border border-line/80 bg-white px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/50 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/50 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand/50" />
              <span className="ms-1 text-[9px] text-faint">در حال بررسی داده‌ها…</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line/70 bg-surface-soft/40 px-2.5 py-2.5 sm:px-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="flex items-end gap-2 rounded-xl border border-line bg-white p-1.5 shadow-sm focus-within:border-[#a7c9ee] focus-within:ring-4 focus-within:ring-brand/10"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="سؤال خود را بنویسید؛ مثلاً «ارزان‌ترین آملودیپین کدام است؟»"
            className="max-h-24 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[11.5px] leading-6 text-ink outline-none placeholder:text-faint"
            aria-label="متن سؤال"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#3d7fdc] to-[#2a66c2] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="ارسال سؤال"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-1.5 flex items-center justify-center gap-1 text-[8px] text-faint">
          <CornerDownLeft className="h-2.5 w-2.5" />
          Enter برای ارسال · Shift+Enter برای خط جدید · پاسخ‌ها توصیه پزشکی نیستند
        </p>
      </div>
    </div>
  );
}

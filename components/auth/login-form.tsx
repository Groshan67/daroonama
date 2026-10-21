"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, User } from "lucide-react";

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    let navigated = false;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(
          data.error === "too_many_attempts"
            ? "تلاش‌های ناموفق زیاد بوده است؛ چند دقیقه بعد دوباره امتحان کنید."
            : data.error === "not_configured"
              ? "اطلاعات ورود مدیر روی سرور تنظیم نشده است."
              : "نام کاربری یا رمز عبور اشتباه است.",
        );
        return;
      }
      // A full navigation guarantees the server layout re-renders with the
      // admin navigation and the protected page's new components.
      navigated = true;
      window.location.replace(next);
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      if (!navigated) setLoading(false);
    }
  };

  return (
    <div className="page-container flex min-h-[70vh] items-center justify-center py-10">
      {loading && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#f2f7fd]/80 px-4 backdrop-blur-[3px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center rounded-2xl border border-line bg-white/95 px-8 py-7 text-center shadow-pop">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7f3] text-[#158d7d]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-ink">در حال ورود و بارگذاری صفحه…</p>
            <p className="mt-1 text-[10px] leading-5 text-faint">
              لطفاً چند لحظه صبر کنید و دکمه ورود را دوباره نزنید.
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-[420px]">
        <div className="mb-5 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e6f7f3] text-[#158d7d] ring-1 ring-[#cdeee6]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-[22px] font-extrabold text-ink">ورود به بخش داده</h1>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            ورود داده، کاوش دیتابیس و سلسله‌مراتب ATC فقط برای مدیر در دسترس است.
          </p>
        </div>

        <form onSubmit={submit} aria-busy={loading} className="surface-card p-5 sm:p-6">
          {!configured && (
            <p className="mb-4 rounded-lg border border-[#f0dfbd] bg-[#fffbf1] px-3 py-2 text-[10px] leading-5 text-[#8f6d34]">
              متغیرهای `ADMIN_PASSWORD` و `AUTH_SECRET` تنظیم نشده‌اند.
            </p>
          )}

          <label className="mb-1.5 block text-[10px] font-medium text-ink-soft" htmlFor="username">
            نام کاربری
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={loading}
              autoComplete="username"
              dir="ltr"
              className="h-10 w-full rounded-lg border border-line bg-white ps-9 pe-3 text-[11px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
            />
          </div>

          <label className="mb-1.5 mt-3 block text-[10px] font-medium text-ink-soft" htmlFor="password">
            رمز عبور
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              autoComplete="current-password"
              dir="ltr"
              className="h-10 w-full rounded-lg border border-line bg-white ps-9 pe-9 text-[11px] outline-none focus:border-[#a7c9ee] focus:ring-4 focus:ring-brand/10"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              disabled={loading}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink disabled:opacity-50"
              aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-[#fdeef1] px-3 py-2 text-[10px] leading-5 text-[#b84a63]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[12px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
            {loading ? "در حال ورود…" : "ورود مدیر"}
          </button>

          <Link href="/" className="mt-4 flex items-center justify-center gap-1 text-[10px] text-faint hover:text-brand">
            <ArrowLeft className="h-3 w-3" />
            بازگشت به صفحه اصلی
          </Link>
        </form>
      </div>
    </div>
  );
}

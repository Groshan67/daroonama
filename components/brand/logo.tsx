import Link from "next/link";

export function Logo({
  compact = false,
  href = "/",
}: {
  compact?: boolean;
  href?: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-2.5" aria-label="دارونما، صفحه اصلی">
      <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
        <svg viewBox="0 0 44 44" className="h-10 w-10 drop-shadow-[0_6px_10px_rgba(37,102,190,0.28)]" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="daranama-mark" x1="4" y1="2" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4a8ee6" />
              <stop offset="0.55" stopColor="#2f6fce" />
              <stop offset="1" stopColor="#169c8e" />
            </linearGradient>
          </defs>
          <rect width="44" height="44" rx="13" fill="url(#daranama-mark)" />
          <rect x="1" y="1" width="42" height="42" rx="12" fill="none" stroke="rgba(255,255,255,0.28)" />
          <path
            d="M10.5 23.5h6.2l3.3-8.6 5.1 16 3.1-7.4h5.3"
            fill="none"
            stroke="white"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="33.5" cy="23.5" r="1.7" fill="#d9fff8" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="text-[19px] font-extrabold leading-6 tracking-tight text-ink transition-colors group-hover:text-brand-dark">
          دارونما
        </span>
        {!compact && (
          <span className="text-[10.5px] font-medium leading-4 text-faint">پایگاه داده قیمت دارو</span>
        )}
      </span>
    </Link>
  );
}

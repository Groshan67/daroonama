"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";

export type WatchEntry = {
  code: string;
  name: string;
  ingredientName: string;
  companyName: string;
  priceAtAdd: number;
  addedAt: string;
};

type WatchlistContextValue = {
  entries: WatchEntry[];
  hydrated: boolean;
  count: number;
  isSaved: (code: string) => boolean;
  toggle: (entry: Omit<WatchEntry, "addedAt">) => void;
  remove: (code: string) => void;
  clear: () => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);
const STORAGE_KEY = "daranama.watchlist.v1";

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ message: string; added: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(
            parsed.filter(
              (item): item is WatchEntry =>
                Boolean(item?.code && item?.name && Number.isFinite(item?.priceAtAdd)),
            ),
          );
        }
      }
    } catch {
      // Ignore malformed storage; start with an empty watchlist.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage can be unavailable in private mode — the UI still works for this session.
    }
  }, [entries, hydrated]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const showToast = useCallback((message: string, added: boolean) => {
    setToast({ message, added });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const isSaved = useCallback(
    (code: string) => entries.some((entry) => entry.code === code),
    [entries],
  );

  const toggle = useCallback(
    (entry: Omit<WatchEntry, "addedAt">) => {
      const exists = entries.some((item) => item.code === entry.code);
      if (exists) {
        setEntries((current) => current.filter((item) => item.code !== entry.code));
        showToast("از لیست پیگیری حذف شد", false);
      } else {
        setEntries((current) => [
          { ...entry, addedAt: new Date().toISOString() },
          ...current.filter((item) => item.code !== entry.code),
        ]);
        showToast("به لیست پیگیری اضافه شد", true);
      }
    },
    [entries, showToast],
  );

  const remove = useCallback(
    (code: string) => {
      setEntries((current) => current.filter((item) => item.code !== code));
      showToast("از لیست پیگیری حذف شد", false);
    },
    [showToast],
  );

  const clear = useCallback(() => {
    setEntries([]);
    showToast("لیست پیگیری پاک شد", false);
  }, [showToast]);

  return (
    <WatchlistContext.Provider
      value={{ entries, hydrated, count: entries.length, isSaved, toggle, remove, clear }}
    >
      {children}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        {toast && (
          <div className="relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-[#efd7b4] bg-[#fff7e8] px-4 py-2.5 text-[12px] font-medium text-[#8f6d34] shadow-[0_20px_50px_-20px_rgba(143,109,52,0.35)]">
            <span className="absolute inset-x-0 top-0 h-[3px] bg-[#c47a20]" aria-hidden="true" />
            {toast.added ? (
              <BookmarkPlus className="h-4 w-4 text-[#b9751d]" strokeWidth={2} />
            ) : (
              <BookmarkCheck className="h-4 w-4 text-[#b9751d]" strokeWidth={2} />
            )}
            {toast.message}
          </div>
        )}
      </div>
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error("useWatchlist must be used inside WatchlistProvider");
  return context;
}

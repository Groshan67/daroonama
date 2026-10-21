"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SearchPalette } from "@/components/search/search-palette";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

export function AppShell({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);
      if (typing) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        setMenuOpen(false);
        return;
      }
      if (
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        (event.key === "/" || event.code === "Slash")
      ) {
        event.preventDefault();
        setSearchOpen(true);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} isAdmin={isAdmin} />
      <div className="flex min-h-screen flex-col lg:ms-[272px]">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <main id="main-content" className="flex-1 pb-12">
          {children}
        </main>
        <Footer isAdmin={isAdmin} />
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

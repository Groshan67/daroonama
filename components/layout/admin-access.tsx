"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, LogOut } from "lucide-react";

export function AdminAccess({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <Link href="/login" className="inline-flex items-center gap-1 hover:text-brand">
        <LockKeyhole className="h-3 w-3" />
        ورود مدیر
      </Link>
    );
  }

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={logout} disabled={loading} className="inline-flex items-center gap-1 hover:text-brand">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
      خروج مدیر
    </button>
  );
}

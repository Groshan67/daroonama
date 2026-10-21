"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label = "کپی" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1 text-[9.5px] text-faint transition-colors hover:text-brand"
      aria-label={`${label} ${value}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-teal" strokeWidth={2.2} />
      ) : (
        <Copy className="h-3 w-3" strokeWidth={1.9} />
      )}
      {copied ? "کپی شد" : label}
    </button>
  );
}

"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function CopyButton({
  value,
  title = "Salin",
  className,
}: {
  value: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer border border-border/40 shadow-2xs",
        copied && "text-emerald-600 bg-emerald-50 border-emerald-200",
        className
      )}
      onClick={handleCopy}
      title={copied ? "Tersalin!" : title}
      aria-label={title}
    >
      {copied ? (
        <Check className="size-3.5 stroke-[2.5]" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

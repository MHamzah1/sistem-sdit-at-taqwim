"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyButton({
  value,
  title = "Salin",
}: {
  value: string;
  title?: string;
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
      className="st-copy-btn"
      onClick={handleCopy}
      title={copied ? "Tersalin!" : title}
      aria-label={title}
    >
      {copied ? (
        <Check size={12} className="st-copy-check" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  );
}

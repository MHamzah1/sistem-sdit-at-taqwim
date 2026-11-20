"use client";

import React, { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="modal-close icon-btn no-print"
          aria-label="Tutup"
          onClick={close}
        >
          <X size={20} />
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

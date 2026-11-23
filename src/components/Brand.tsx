import React from "react";
import { cn } from "@/src/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("brand flex items-center gap-3 py-4 px-2", className)}>
      <img
        src="/attachment-0.png"
        alt="Logo SDIT AT-TAQWIM"
        className="size-10 object-contain rounded-full shadow-2xs"
      />
      <div className="flex flex-col min-w-0">
        <strong className="text-sm font-bold tracking-tight text-primary leading-tight font-heading truncate">
          SDIT AT-TAQWIM
        </strong>
        <span className="text-[10px] text-muted-foreground tracking-normal truncate">
          Sistem SPP & Kelayakan Ujian
        </span>
      </div>
    </div>
  );
}

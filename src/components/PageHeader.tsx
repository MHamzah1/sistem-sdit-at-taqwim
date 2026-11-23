import React, { type ReactNode } from "react";
import { cn } from "@/src/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60 mb-6",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {eyebrow && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}

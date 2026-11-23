import React from "react";
import { Badge as UiBadge } from "./ui/badge";
import { statusLabels } from "@/src/lib/calculations";
import { cn } from "@/src/lib/utils";

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const isGreen = ["PAID", "APPROVED", "ELIGIBLE", "ELIGIBLE_DISPENSATION"].includes(status);
  const isRed = ["REJECTED", "NOT_ELIGIBLE", "OVERDUE"].includes(status);
  const isNeutral = ["DRAFT", "ARCHIVED"].includes(status);

  const variant = isGreen
    ? "success"
    : isRed
      ? "destructive"
      : isNeutral
        ? "neutral"
        : "warning";

  const dotColor = isGreen
    ? "bg-emerald-600"
    : isRed
      ? "bg-red-600"
      : isNeutral
        ? "bg-slate-400"
        : "bg-amber-600";

  return (
    <UiBadge variant={variant} className={cn("gap-1.5 shadow-2xs", className)}>
      <span className={cn("size-1.5 rounded-full inline-block", dotColor)} />
      {statusLabels[status] || status}
    </UiBadge>
  );
}

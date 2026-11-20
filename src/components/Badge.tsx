import React from "react";
import { statusLabels } from "@/src/lib/calculations";

export function Badge({ status }: { status: string }) {
  const isGreen = ["PAID", "APPROVED", "ELIGIBLE"].includes(status);
  const isRed = ["REJECTED", "NOT_ELIGIBLE", "OVERDUE"].includes(status);
  const tone = isGreen ? "green" : isRed ? "red" : "amber";

  return (
    <span className={`badge ${tone}`}>
      <i />
      {statusLabels[status] || status}
    </span>
  );
}

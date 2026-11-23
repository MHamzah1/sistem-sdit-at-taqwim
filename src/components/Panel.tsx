import React, { type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { cn } from "@/src/lib/utils";

export function Panel({
  title,
  children,
  action,
  className,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border border-border/80 shadow-xs", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 py-4 px-6 border-b border-border/60 bg-card">
        <CardTitle className="text-sm font-bold text-foreground">
          {title}
        </CardTitle>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

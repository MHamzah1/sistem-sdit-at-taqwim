"use client";

import React, { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { cn } from "@/src/lib/utils";

export function Modal({
  title,
  children,
  close,
  className,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  className?: string;
}) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && close()}>
      <DialogContent onClose={close} className={cn("max-w-xl", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-foreground space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

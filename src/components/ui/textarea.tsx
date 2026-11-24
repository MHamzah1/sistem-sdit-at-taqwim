import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          "block w-full min-w-0 rounded-lg border border-input bg-card px-3.5 py-2 text-xs sm:text-sm text-foreground shadow-xs transition-all duration-150 outline-none leading-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

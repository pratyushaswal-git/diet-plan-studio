import * as React from "react";

import { cn } from "@/lib/utils";

// Lightweight styled native <select> — sufficient for the settings dropdowns
// (slot / recipe / kind / note-type). No external dependency.
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-app-rule bg-app-surface px-3 py-1 text-base shadow-sm transition-[border-color,box-shadow] focus-visible:border-app-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 lg:text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export { Select };

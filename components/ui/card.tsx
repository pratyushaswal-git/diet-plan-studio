import * as React from "react";

import { cn } from "@/lib/utils";

// Consistent elevated surface used across the app shell.
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-app-rule bg-app-surface shadow-card", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };

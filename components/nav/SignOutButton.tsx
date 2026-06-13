"use client";

import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

// Posts to the sign-out route. Confirmation dialog is wired in 7.3.
export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={cn(
          "inline-flex items-center gap-2 rounded-md text-sm text-app-muted transition-colors hover:text-app-ink",
          iconOnly ? "p-1.5" : "px-2 py-1.5",
        )}
        aria-label="Sign out"
      >
        <LogOut className="h-[18px] w-[18px]" />
        {!iconOnly && <span className="max-lg:hidden">Sign out</span>}
      </button>
    </form>
  );
}

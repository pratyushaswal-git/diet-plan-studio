"use client";

import { useRef } from "react";
import { LogOut } from "lucide-react";

import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";

// Posts to the sign-out route after a confirmation dialog.
export function SignOutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const confirm = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);

  async function onClick() {
    const ok = await confirm({
      title: "Sign out?",
      description: "You'll need to sign in again to make or edit plans.",
      confirmLabel: "Sign out",
    });
    if (ok) formRef.current?.submit();
  }

  return (
    <form ref={formRef} action="/auth/signout" method="post">
      <button
        type="button"
        onClick={onClick}
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

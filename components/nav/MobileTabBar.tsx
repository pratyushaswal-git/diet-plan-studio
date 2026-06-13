"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PlusCircle, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/plans", label: "Plans", icon: ClipboardList, match: (p: string) => p === "/plans" },
  { href: "/plans/new", label: "New", icon: PlusCircle, match: (p: string) => p.startsWith("/plans/new") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

// Native-style bottom tab bar (mobile only). Desktop uses the top AppNav.
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-app-rule bg-app-surface lg:hidden">
      <div className="flex items-stretch">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-app-ink" : "text-app-muted",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

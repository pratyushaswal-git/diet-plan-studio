"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/nav/SignOutButton";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/plans", label: "Plans", match: (p: string) => p.startsWith("/plans") },
  { href: "/settings", label: "Settings", match: (p: string) => p.startsWith("/settings") },
];

// Fixed neutral app chrome (desktop only). Brand theming lives on the builder canvas + PDF.
export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 hidden border-b border-app-rule bg-app-surface/85 backdrop-blur lg:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-7">
          <Link href="/plans" className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="" width={26} height={26} className="rounded-md" />
            <span className="font-serif text-lg text-app-ink">Diet Plan Studio</span>
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-app-accent-soft text-app-accent"
                      : "text-app-muted hover:bg-app-bg hover:text-app-ink",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}

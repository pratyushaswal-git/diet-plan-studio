import { SignOutButton } from "@/components/nav/SignOutButton";

// Slim sticky top bar (mobile only). Desktop uses the full AppNav.
export function MobileAppBar({ title }: { title: string }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-app-rule bg-app-surface/90 backdrop-blur lg:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <span className="font-serif text-lg text-app-ink">{title}</span>
        <span className="-mr-1">
          <SignOutButton iconOnly />
        </span>
      </div>
    </header>
  );
}

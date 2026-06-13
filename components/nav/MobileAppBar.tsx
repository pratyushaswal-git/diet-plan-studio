import { LogOut } from "lucide-react";

// Slim sticky top bar (mobile only). Desktop uses the full AppNav.
export function MobileAppBar({ title }: { title: string }) {
  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-app-rule bg-app-surface/95 backdrop-blur lg:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <span className="font-serif text-lg text-app-ink">{title}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="-mr-1 p-1.5 text-app-muted" aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </button>
        </form>
      </div>
    </header>
  );
}

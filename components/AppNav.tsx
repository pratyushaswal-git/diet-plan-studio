import Link from "next/link";

// Fixed neutral app chrome. Brand theming lives only on the builder canvas + PDF.
export function AppNav() {
  return (
    <header className="border-b border-app-rule bg-app-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/plans" className="font-serif text-lg text-app-ink">
            Diet Plan Studio
          </Link>
          <nav className="flex items-center gap-4 text-sm text-app-muted">
            <Link href="/plans" className="hover:text-app-ink">
              Plans
            </Link>
            <Link href="/settings" className="hover:text-app-ink">
              Settings
            </Link>
          </nav>
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-app-muted hover:text-app-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline — Diet Plan Studio" };

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-app-bg px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-app-surface shadow-sm">
        <WifiOff className="h-7 w-7 text-app-muted" />
      </div>
      <h1 className="mt-5 font-serif text-xl text-app-ink">You&rsquo;re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-app-muted">
        Diet Plan Studio needs a connection to load plans and save changes. Reconnect and try again.
      </p>
      {/* Server component — a plain link triggers a fresh navigation/retry. */}
      <a
        href="/plans"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-app-ink px-5 text-sm font-medium text-app-surface"
      >
        Retry
      </a>
    </div>
  );
}

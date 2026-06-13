import { AppNav } from "@/components/AppNav";
import { MobileAppBar } from "@/components/nav/MobileAppBar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";

// Standard chrome for the tabbed screens (Plans, Settings): desktop top nav,
// mobile slim app bar + bottom tab bar. The builder uses its own full-screen shell.
export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <MobileAppBar title={title} />
      {/* Clear the fixed bottom tab bar on mobile. */}
      <div className="pb-[68px] lg:pb-0">{children}</div>
      <MobileTabBar />
    </div>
  );
}

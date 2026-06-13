import Link from "next/link";
import { Plus } from "lucide-react";

import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";

export default function PlansPage() {
  return (
    <div className="min-h-dvh bg-app-bg">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-app-ink">Plans</h1>
          <Button asChild>
            <Link href="/plans/new">
              <Plus className="h-4 w-4" /> New plan
            </Link>
          </Button>
        </div>
        <p className="mt-2 text-sm text-app-muted">
          The searchable history table lands in Batch 5. For now, start a new plan above.
        </p>
      </main>
    </div>
  );
}

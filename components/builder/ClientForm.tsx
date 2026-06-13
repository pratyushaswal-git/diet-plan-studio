"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBuilder } from "@/lib/store/builder";

export function ClientForm({ clientNames }: { clientNames: string[] }) {
  const client = useBuilder((s) => s.client);
  const setClientField = useBuilder((s) => s.setClientField);

  return (
    <div className="space-y-3 rounded-lg border border-app-rule bg-app-surface p-4">
      <h2 className="font-serif text-lg text-app-ink">Client details</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="client-name" className="text-xs text-app-muted">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="client-name"
            list="client-name-options"
            value={client.name}
            onChange={(e) => setClientField("name", e.target.value)}
            placeholder="Full name"
            required
          />
          <datalist id="client-name-options">
            {clientNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-age" className="text-xs text-app-muted">
            Age
          </Label>
          <Input
            id="client-age"
            value={client.age ?? ""}
            onChange={(e) => setClientField("age", e.target.value)}
            placeholder="32 yrs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-weight" className="text-xs text-app-muted">
            Weight
          </Label>
          <Input
            id="client-weight"
            value={client.weight ?? ""}
            onChange={(e) => setClientField("weight", e.target.value)}
            placeholder="93 kgs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-height" className="text-xs text-app-muted">
            Height
          </Label>
          <Input
            id="client-height"
            value={client.height ?? ""}
            onChange={(e) => setClientField("height", e.target.value)}
            placeholder="5'4&quot;"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="client-extra" className="text-xs text-app-muted">
          Extra notes (optional)
        </Label>
        <Textarea
          id="client-extra"
          value={client.extra ?? ""}
          onChange={(e) => setClientField("extra", e.target.value)}
          placeholder="Condition, goals, allergies…"
          className="min-h-[44px]"
        />
      </div>
    </div>
  );
}

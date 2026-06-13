"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBuilder } from "@/lib/store/builder";
import type { Note } from "@/lib/types";

type NoteType = "important" | "care";

function NoteSection({ type, title, bank }: { type: NoteType; title: string; bank: Note[] }) {
  const selected = useBuilder((s) => (type === "important" ? s.importantNotes : s.careNotes));
  const { addNote, removeNoteAt, editNoteAt } = useBuilder();
  const [custom, setCustom] = useState("");

  const unused = useMemo(() => {
    const taken = new Set(selected.map((t) => t.trim()));
    return bank.filter((n) => !taken.has(n.text.trim()));
  }, [bank, selected]);

  return (
    <div className="space-y-2 rounded-xl border border-app-rule bg-app-surface p-4 shadow-card">
      <h3 className="font-serif text-base text-app-ink">{title}</h3>

      <div className="space-y-1.5">
        {selected.length === 0 && <p className="text-xs text-app-muted">None selected.</p>}
        {selected.map((text, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <Textarea
              value={text}
              onChange={(e) => editNoteAt(type, idx, e.target.value)}
              className="min-h-[38px] text-sm"
            />
            <button
              type="button"
              onClick={() => removeNoteAt(type, idx)}
              className="mt-2 text-app-muted hover:text-destructive"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {unused.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-app-muted hover:text-app-ink">
            Add from bank ({unused.length})
          </summary>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {unused.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => addNote(type, n.text)}
                className="inline-flex items-center gap-1 rounded-full border border-app-rule px-2 py-1 text-[11px] text-app-muted hover:border-brand-primary/40 hover:text-app-ink"
              >
                <Plus className="h-3 w-3" /> {n.text.length > 60 ? n.text.slice(0, 60) + "…" : n.text}
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="flex items-center gap-1.5 pt-1">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a custom line…"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && custom.trim()) {
              e.preventDefault();
              addNote(type, custom.trim());
              setCustom("");
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!custom.trim()}
          onClick={() => {
            addNote(type, custom.trim());
            setCustom("");
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function NotesPicker({ notes }: { notes: Note[] }) {
  const important = notes.filter((n) => n.type === "important");
  const care = notes.filter((n) => n.type === "care");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <NoteSection type="important" title="Important" bank={important} />
      <NoteSection type="care" title="Please take care" bank={care} />
    </div>
  );
}

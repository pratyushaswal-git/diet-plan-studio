"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useBuilder, selectPlanBody } from "@/lib/store/builder";
import { PlanDocument } from "@/components/pdf/PlanDocument";
import type { PlanBody } from "@/lib/types";

// PDFViewer is heavy and browser-only. Return the canonical { default } shape
// next/dynamic expects, and never put it in the server tree (see mounted gate).
const PDFViewer = dynamic(() => import("@react-pdf/renderer").then((m) => ({ default: m.PDFViewer })), {
  ssr: false,
  loading: () => <PreviewSkeleton label="Loading preview…" />,
});

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-app-rule bg-app-surface text-sm text-app-muted">
      {label}
    </div>
  );
}

export function PdfPreview() {
  // Only render the viewer after the component has mounted on the client — keeps
  // the react-pdf lazy boundary out of the SSR tree entirely.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Re-render the document on a debounce so typing stays smooth.
  const snapshotJson = useBuilder((s) => JSON.stringify(selectPlanBody(s)));
  const [debounced, setDebounced] = useState(snapshotJson);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(snapshotJson), 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [snapshotJson]);

  const body = useMemo(() => JSON.parse(debounced) as PlanBody, [debounced]);

  // Wait for client mount and a hydrated brand before mounting the viewer.
  if (!mounted) return <PreviewSkeleton label="Preview" />;
  if (!body.brand?.key) return <PreviewSkeleton label="Preview" />;

  return (
    <PDFViewer
      key={body.brand.key}
      showToolbar
      style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }}
    >
      <PlanDocument body={body} />
    </PDFViewer>
  );
}

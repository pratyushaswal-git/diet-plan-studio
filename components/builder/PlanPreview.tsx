"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useBuilder, selectPlanBody } from "@/lib/store/builder";
import { PlanView } from "@/components/plan-view/PlanView";
import { PLAN_VIEW_CSS } from "@/components/plan-view/plan-view-css";
import type { PlanBody } from "@/lib/types";

const PAGE_W = 980; // the design's fixed canvas width

function Skeleton() {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-app-rule bg-app-surface text-sm text-app-muted">
      Preview
    </div>
  );
}

// Live, pixel-accurate preview: the same <PlanView> the PDF export renders,
// scaled down to fit the preview pane (debounced so typing stays smooth).
export function PlanPreview() {
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

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [scaledH, setScaledH] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const compute = () => {
      const s = outer.clientWidth / PAGE_W;
      setScale(s);
      setScaledH(inner.scrollHeight * s); // scrollHeight is pre-transform (unscaled)
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [body]);

  if (!body.brand?.key) return <Skeleton />;

  return (
    <div ref={outerRef} className="h-full overflow-auto rounded-lg border border-app-rule bg-app-surface">
      <style>{PLAN_VIEW_CSS}</style>
      <div style={{ height: scaledH }}>
        <div ref={innerRef} style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PlanView body={body} />
        </div>
      </div>
    </div>
  );
}

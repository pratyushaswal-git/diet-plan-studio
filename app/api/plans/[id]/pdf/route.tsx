import { format } from "date-fns";

import { getPlan } from "@/lib/db";
import { createServiceClient } from "@/lib/supabase/server";
import { PlanView } from "@/components/plan-view/PlanView";
import { PLAN_VIEW_CSS } from "@/components/plan-view/plan-view-css";
import { fontFaceBase64, htmlToPdf } from "@/lib/render-pdf";
import type { PlanBody } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "plan-pdfs"; // private; served only through this auth-gated route

function pdfResponse(bytes: Uint8Array<ArrayBuffer>, filename: string) {
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // RLS-gated fetch (session cookies). Returns null if not found / not allowed.
  const plan = await getPlan(id);
  if (!plan) return new Response("Not found", { status: 404 });

  const safeName = (plan.client_name || "plan").replace(/[^\w\s-]/g, "").trim() || "plan";
  const filename = `${safeName} - ${format(new Date(plan.created_at), "d MMM yyyy")}.pdf`;

  // Cache key includes the plan's last-edit time, so any edit auto-invalidates.
  const stamp = `${new Date(plan.updated_at).getTime()}.pdf`;
  const cachePath = `${id}/${stamp}`;
  const svc = createServiceClient();

  try {
    // 1) Cache hit → serve the stored PDF, skip Chromium entirely.
    const cached = await svc.storage.from(BUCKET).download(cachePath);
    if (cached.data) {
      return pdfResponse(new Uint8Array(await cached.data.arrayBuffer()), filename);
    }

    // 2) Miss → render the real plan-view HTML with headless Chrome (fonts inlined
    //    base64 → offline-safe; recipe cards are text-only so no thumbnail fetches).
    const body = plan.body as PlanBody;
    const { renderToStaticMarkup } = await import("react-dom/server");
    const markup = renderToStaticMarkup(<PlanView body={body} />);
    const fonts = await fontFaceBase64();
    const paper = body.brand?.theme?.bg ?? "#ffffff";
    const html =
      `<!doctype html><html><head><meta charset="utf-8">` +
      `<style>${fonts}\n${PLAN_VIEW_CSS}</style></head>` +
      `<body style="margin:0;background:${paper}">${markup}</body></html>`;

    const pdf = await htmlToPdf(html);

    // 3) Store for next time + prune older versions of this plan (best-effort).
    await svc.storage.from(BUCKET).upload(cachePath, pdf, { contentType: "application/pdf", upsert: true });
    try {
      const { data: existing } = await svc.storage.from(BUCKET).list(id);
      const stale = (existing ?? []).filter((o) => o.name !== stamp).map((o) => `${id}/${o.name}`);
      if (stale.length) await svc.storage.from(BUCKET).remove(stale);
    } catch {
      /* pruning is best-effort */
    }

    return pdfResponse(new Uint8Array(pdf), filename);
  } catch (err) {
    // Surface the real cause (admin-only route) so headless-Chrome failures on
    // the host are diagnosable instead of an opaque 500.
    console.error("[pdf] render failed:", err);
    const detail = err instanceof Error ? `${err.message}\n\n${err.stack ?? ""}` : String(err);
    return new Response(`PDF render failed:\n\n${detail}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
}
